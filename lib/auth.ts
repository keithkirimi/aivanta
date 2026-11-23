
import { betterAuth } from "better-auth";
import { username } from "better-auth/plugins";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function getAuth() {
  const { env } = await getCloudflareContext({ async: true });

  const cloudflareEnv = env as unknown as {
    aivanta_db: D1Database;
  };

  const secret = process.env.BETTER_AUTH_SECRET;
  const baseURL = process.env.BETTER_AUTH_URL;

  if (!cloudflareEnv.aivanta_db) {
    throw new Error("Cloudflare D1 binding aivanta_db is unavailable.");
  }

  if (!secret) {
    throw new Error("BETTER_AUTH_SECRET is not configured.");
  }

  if (!baseURL) {
    throw new Error("BETTER_AUTH_URL is not configured.");
  }

  const trustedOrigins =
    process.env.NODE_ENV === "development"
      ? [
          baseURL,
          "http://localhost:3000",
          "http://127.0.0.1:3000",
        ]
      : [baseURL];

  return betterAuth({
    database: cloudflareEnv.aivanta_db,
    secret,
    baseURL,
    trustedOrigins,
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      maxPasswordLength: 128,
    },
    plugins: [
      username({
        minUsernameLength: 3,
        maxUsernameLength: 20,
      }),
    ],
    advanced: {
      ipAddress: {
        ipAddressHeaders: ["cf-connecting-ip"],
      },
    },
  });
}
