// @ts-check
/**
 * This file is included in `/next.config.mjs` which ensures the app isn't built with invalid env vars.
 * It has to be a `.mjs`-file to be imported there.
 */
import { serverSchema } from "./schema.mjs";
import { env as clientEnv, formatErrors } from "./client.mjs";
import { ValiError, flatten } from "valibot";

function checkEnv() {
	try {
		const _serverEnv = serverSchema.parse(process.env);

		/**
		 * Validate that server-side environment variables are not exposed to the client.
		 */
		for (let key of Object.keys(_serverEnv)) {
			if (key.startsWith("NEXT_PUBLIC_")) {
				console.warn("❌ You are exposing a server-side env-variable:", key);

				throw new Error("You are exposing a server-side env-variable");
			}
		}

		return _serverEnv;
	} catch (err) {
		if (err instanceof ValiError) {
			const flatErrors = flatten(err);
			console.error("❌ Invalid environment variables:\n", ...formatErrors(flatErrors.nested));
			throw new Error("Invalid environment variables");
		}
	}
}

export const env = { ...checkEnv(), ...clientEnv };
