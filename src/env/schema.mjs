// @ts-check
import { enumType, object, string, url } from "valibot";

/**
 * Specify your server-side environment variables schema here.
 * This way you can ensure the app isn't built with invalid env vars.
 */
export const serverSchema = object({
	DATABASE_URL: string([url()]),
	NODE_ENV: enumType(["development", "test", "production"]),
	NEXTAUTH_SECRET: string(),
	NEXTAUTH_URL: string([url()]),
	GOOGLE_CLIENT_ID: string(),
	GOOGLE_CLIENT_SECRET: string(),
	CRON_CHARACTER_ID: string()
});

/**
 * Specify your client-side environment variables schema here.
 * This way you can ensure the app isn't built with invalid env vars.
 * To expose them to the client, prefix them with `NEXT_PUBLIC_`.
 */
export const clientSchema = object({
	// NEXT_PUBLIC_BAR: string(),
});

/**
 * You can't destruct `process.env` as a regular object, so you have to do
 * it manually here. This is because Next.js evaluates this at build time,
 * and only used environment variables are included in the build.
 * @type {import("valibot").Output<typeof clientSchema>}
 */
export const clientEnv = {
	// NEXT_PUBLIC_BAR: process.env.NEXT_PUBLIC_BAR,
};
