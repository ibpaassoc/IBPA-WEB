import {
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Readable } from "node:stream";

type R2Config = {
  bucket: string;
  client: S3Client;
};

let cachedConfig: R2Config | null = null;

function getR2Config(): R2Config {
  if (cachedConfig) return cachedConfig;

  const accountId = process.env.R2_ACCOUNT_ID?.trim();
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
  const bucket = process.env.R2_BUCKET_NAME?.trim();
  const configuredEndpoint = process.env.R2_ENDPOINT?.trim();

  if (
    !accountId ||
    !accessKeyId ||
    !secretAccessKey ||
    !bucket ||
    !configuredEndpoint
  ) {
    throw new Error(
      "R2 is not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, and R2_ENDPOINT.",
    );
  }

  const endpoint = configuredEndpoint.replace(/\/+$/, "");
  const endpointUrl = new URL(endpoint);
  if (endpointUrl.protocol !== "https:") {
    throw new Error("R2_ENDPOINT must use HTTPS.");
  }

  cachedConfig = {
    bucket,
    client: new S3Client({
      credentials: { accessKeyId, secretAccessKey },
      endpoint,
      region: "auto",
    }),
  };

  return cachedConfig;
}

export function normalizeEtag(etag?: string | null) {
  return etag?.replace(/^W\//, "").replace(/^\"|\"$/g, "") || null;
}

export async function uploadStreamToR2(input: {
  key: string;
  body: ReadableStream<Uint8Array>;
  contentType: string;
  contentLength?: number | null;
  metadata?: Record<string, string>;
}) {
  const { bucket, client } = getR2Config();
  const body = Readable.fromWeb(
    input.body as import("node:stream/web").ReadableStream,
  );
  const upload = new Upload({
    client,
    leavePartsOnError: false,
    params: {
      Bucket: bucket,
      Key: input.key,
      Body: body,
      ContentType: input.contentType,
      ContentLength: input.contentLength || undefined,
      Metadata: input.metadata,
    },
    partSize: 10 * 1024 * 1024,
    queueSize: 2,
  });

  const result = await upload.done();
  return { etag: normalizeEtag(result.ETag), key: input.key };
}

export async function putTextToR2(input: {
  key: string;
  text: string;
  expectedEtag?: string | null;
  metadata?: Record<string, string>;
  requireAbsent?: boolean;
}) {
  const { bucket, client } = getR2Config();
  let existingMetadata: Record<string, string> | undefined;

  if (input.expectedEtag) {
    const current = await headR2Object(input.key);
    if (
      !current ||
      normalizeEtag(current.etag) !== normalizeEtag(input.expectedEtag)
    ) {
      const error = new Error(
        "This subtitle track changed after you opened it. Reload the latest version before saving.",
      );
      Object.assign(error, { code: "VERSION_CONFLICT" });
      throw error;
    }
    existingMetadata = current.metadata;
  }

  let result;
  try {
    result = await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: input.key,
        Body: Buffer.from(input.text, "utf8"),
        ContentType: "text/vtt; charset=utf-8",
        CacheControl: "private, no-store",
        Metadata: input.metadata || existingMetadata,
        IfMatch: input.expectedEtag
          ? `"${normalizeEtag(input.expectedEtag)}"`
          : undefined,
        IfNoneMatch: input.requireAbsent ? "*" : undefined,
      }),
    );
  } catch (error) {
    const status =
      error && typeof error === "object"
        ? (error as { $metadata?: { httpStatusCode?: number } }).$metadata
            ?.httpStatusCode
        : null;
    if (status === 409 || status === 412) {
      const conflict = new Error(
        "This subtitle track changed after you opened it. Reload the latest version before saving.",
      );
      Object.assign(conflict, { code: "VERSION_CONFLICT" });
      throw conflict;
    }
    throw error;
  }

  return { etag: normalizeEtag(result.ETag), key: input.key };
}

export async function getTextFromR2(key: string) {
  const { bucket, client } = getR2Config();
  try {
    const result = await client.send(
      new GetObjectCommand({ Bucket: bucket, Key: key }),
    );
    return {
      etag: normalizeEtag(result.ETag),
      text: result.Body ? await result.Body.transformToString("utf-8") : "",
    };
  } catch (error) {
    if (isMissingObjectError(error)) return null;
    throw error;
  }
}

export async function headR2Object(key: string) {
  const { bucket, client } = getR2Config();
  try {
    const result = await client.send(
      new HeadObjectCommand({ Bucket: bucket, Key: key }),
    );
    return {
      contentLength: result.ContentLength ?? null,
      contentType: result.ContentType ?? null,
      etag: normalizeEtag(result.ETag),
      lastModified: result.LastModified?.toISOString() ?? null,
      metadata: result.Metadata || {},
    };
  } catch (error) {
    if (isMissingObjectError(error)) return null;
    throw error;
  }
}

export async function createPresignedR2GetUrl(key: string, expiresIn = 3600) {
  const { bucket, client } = getR2Config();
  return getSignedUrl(
    client,
    new GetObjectCommand({ Bucket: bucket, Key: key }),
    {
      expiresIn,
    },
  );
}

function isMissingObjectError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const candidate = error as {
    name?: string;
    $metadata?: { httpStatusCode?: number };
  };
  return (
    candidate.name === "NotFound" || candidate.$metadata?.httpStatusCode === 404
  );
}
