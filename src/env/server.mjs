// @ts-check
/**
 * This file is included in `/next.config.mjs` which ensures the app isn't built with invalid env vars.
 * It has to be a `.mjs`-file to be imported there.
 */
import { serverSchema } from "./schema.mjs";
import { env as clientEnv, formatErrors } from "./client.mjs";
import { flatten, safeParse } from "valibot";

const _serverEnv = safeParse(serverSchema, process.env);

if (!_serverEnv.success) {
	const flatErrors = flatten(_serverEnv.error);
	console.error("❌ Invalid environment variables:\n", ...formatErrors(flatErrors.nested));
	throw new Error("Invalid environment variables");
}

/**
 * Validate that server-side environment variables are not exposed to the client.
 */
for (let key of Object.keys(_serverEnv.data)) {
	if (key.startsWith("NEXT_PUBLIC_")) {
		console.warn("❌ You are exposing a server-side env-variable:", key);

		throw new Error("You are exposing a server-side env-variable");
	}
}

export const env = { ..._serverEnv.data, ...clientEnv };
