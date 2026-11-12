// Edge environment variables are immutable. Node uses its ordinary private env.
export const env = globalThis.__ABK_SERVER_ENV || process.env;
