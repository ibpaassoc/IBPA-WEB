const ZOOM_API_ORIGIN = "https://api.zoom.us/v2";
const ZOOM_OAUTH_URL = "https://zoom.us/oauth/token";

export type ZoomRecordingFile = {
  id: string;
  meeting_id?: string;
  recording_start?: string;
  recording_end?: string;
  file_type?: string;
  file_extension?: string;
  file_size?: number;
  play_url?: string;
  download_url?: string;
  status?: string;
  recording_type?: string;
};

export type ZoomRecordingMeeting = {
  uuid: string;
  id: number | string;
  account_id?: string;
  host_id?: string;
  host_email?: string;
  topic: string;
  start_time?: string;
  timezone?: string;
  duration?: number;
  total_size?: number;
  recording_count?: number;
  recording_files?: ZoomRecordingFile[];
};

export type ZoomRecordingPage = {
  from: string;
  to: string;
  page_count: number;
  page_size: number;
  total_records: number;
  next_page_token?: string;
  meetings: ZoomRecordingMeeting[];
};

type ZoomCredentials = {
  accountId: string;
  clientId: string;
  clientSecret: string;
};

type ZoomToken = {
  value: string;
  expiresAt: number;
};

let cachedToken: ZoomToken | null = null;

function getZoomCredentials(): ZoomCredentials {
  const accountId = process.env.ZOOM_ACCOUNT_ID?.trim();
  const clientId = process.env.ZOOM_CLIENT_ID?.trim();
  const clientSecret = process.env.ZOOM_CLIENT_SECRET?.trim();

  if (!accountId || !clientId || !clientSecret) {
    throw new Error(
      "Zoom is not configured. Set ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, and ZOOM_CLIENT_SECRET.",
    );
  }

  return { accountId, clientId, clientSecret };
}

async function readZoomError(response: Response) {
  const fallback = `Zoom request failed with status ${response.status}.`;

  try {
    const data = (await response.json()) as {
      message?: string;
      reason?: string;
    };
    return data.message || data.reason || fallback;
  } catch {
    return fallback;
  }
}

export async function getZoomAccessToken({ forceRefresh = false } = {}) {
  if (!forceRefresh && cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.value;
  }

  const credentials = getZoomCredentials();
  const tokenUrl = new URL(ZOOM_OAUTH_URL);
  tokenUrl.searchParams.set("grant_type", "account_credentials");
  tokenUrl.searchParams.set("account_id", credentials.accountId);

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(
        `${credentials.clientId}:${credentials.clientSecret}`,
      ).toString("base64")}`,
    },
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    throw new Error(await readZoomError(response));
  }

  const payload = (await response.json()) as {
    access_token?: string;
    expires_in?: number;
  };

  if (!payload.access_token) {
    throw new Error("Zoom OAuth returned no access token.");
  }

  cachedToken = {
    value: payload.access_token,
    expiresAt:
      Date.now() + Math.max(60, (payload.expires_in || 3600) - 60) * 1000,
  };

  return cachedToken.value;
}

async function zoomFetch(url: string | URL, init: RequestInit = {}) {
  const request = async (token: string) =>
    fetch(url, {
      ...init,
      headers: {
        ...init.headers,
        Authorization: `Bearer ${token}`,
      },
      signal: init.signal || AbortSignal.timeout(30_000),
    });

  let response = await request(await getZoomAccessToken());
  if (response.status === 401) {
    response = await request(await getZoomAccessToken({ forceRefresh: true }));
  }
  return response;
}

export async function listZoomRecordings(input: {
  from: string;
  to: string;
  pageSize?: number;
  nextPageToken?: string | null;
}) {
  const { accountId } = getZoomCredentials();
  const url = new URL(
    `${ZOOM_API_ORIGIN}/accounts/${encodeURIComponent(accountId)}/recordings`,
  );
  url.searchParams.set("from", input.from);
  url.searchParams.set("to", input.to);
  url.searchParams.set(
    "page_size",
    String(Math.min(Math.max(input.pageSize || 30, 1), 300)),
  );
  if (input.nextPageToken) {
    url.searchParams.set("next_page_token", input.nextPageToken);
  }

  const response = await zoomFetch(url);
  if (!response.ok) {
    throw new Error(await readZoomError(response));
  }

  const payload = (await response.json()) as ZoomRecordingPage;
  return {
    ...payload,
    meetings: Array.isArray(payload.meetings) ? payload.meetings : [],
  };
}

export async function getZoomMeetingRecordings(meetingUuid: string) {
  // Zoom requires UUIDs containing reserved characters to be encoded twice.
  const encodedUuid = encodeURIComponent(encodeURIComponent(meetingUuid));
  const response = await zoomFetch(
    `${ZOOM_API_ORIGIN}/meetings/${encodedUuid}/recordings`,
  );

  if (!response.ok) {
    throw new Error(await readZoomError(response));
  }

  return (await response.json()) as ZoomRecordingMeeting;
}

export async function openZoomRecordingDownload(downloadUrl: string) {
  let parsed: URL;
  try {
    parsed = new URL(downloadUrl);
  } catch {
    throw new Error("Zoom returned an invalid recording download URL.");
  }

  const hostname = parsed.hostname.toLowerCase();
  if (
    parsed.protocol !== "https:" ||
    parsed.username ||
    parsed.password ||
    (hostname !== "zoom.us" && !hostname.endsWith(".zoom.us"))
  ) {
    throw new Error("Zoom returned an untrusted recording download URL.");
  }

  const response = await zoomFetch(parsed, {
    redirect: "follow",
    signal: AbortSignal.timeout(60_000),
  });

  if (!response.ok || !response.body) {
    throw new Error(await readZoomError(response));
  }

  return response;
}
