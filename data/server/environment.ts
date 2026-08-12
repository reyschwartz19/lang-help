import "server-only";

function readDatabaseUrl(): string {
  const value = process.env.DATABASE_URL;

  if (!value) {
    throw new Error("DATABASE_URL is required for server-side database access.");
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("DATABASE_URL must be a valid PostgreSQL connection URL.");
  }

  if (url.protocol !== "postgresql:" && url.protocol !== "postgres:") {
    throw new Error("DATABASE_URL must use the postgresql:// or postgres:// protocol.");
  }

  return value;
}

export const serverEnv = {
  get databaseUrl() {
    return readDatabaseUrl();
  },
};
