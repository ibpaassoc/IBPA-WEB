import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.warn("DATABASE_URL is not set. Backend will start, but database-backed routes will return 503 until it is configured.");
}

export const isDbConfigured = Boolean(databaseUrl);

let dbSingleton: ReturnType<any> | null = null;

function getDbInstance() {
  if (!databaseUrl) {
    return null;
  }

  if (dbSingleton) {
    return dbSingleton;
  }

  // Lazy-load drizzle so backend startup does not hang before the server binds to the port.
  // Use Neon HTTP mode to avoid long-lived WebSocket pool crashes in local/dev.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { neon, neonConfig } = require("@neondatabase/serverless");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { drizzle } = require("drizzle-orm/neon-http");

  if (neonConfig && typeof neonConfig === "object") {
    neonConfig.fetchConnectionCache = true;
  }

  const sqlClient = neon(databaseUrl);
  dbSingleton = drizzle(sqlClient, { schema });
  return dbSingleton;
}

export const db = new Proxy(
  {},
  {
    get(_target, prop) {
      const instance = getDbInstance();
      if (!instance) {
        throw new Error("DATABASE_URL must be set before using database-backed routes.");
      }

      return instance[prop as keyof typeof instance];
    },
  },
) as ReturnType<typeof getDbInstance>;

export function requireDb() {
  const instance = getDbInstance();

  if (!instance) {
    throw new Error("DATABASE_URL must be set before using database-backed routes.");
  }

  return instance;
}

export * from "./schema";
