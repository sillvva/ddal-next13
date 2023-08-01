// @ts-check
import { ValiError, flatten } from "valibot";
import { clientEnv, clientSchema } from "./schema.mjs";

export const formatErrors = (
	/** @type Partial<Record<string, [string, ...string[]]>> */
	errors
) =>
	Object.entries(errors)
		.map(([name, value]) => {
			if (value && "_errors" in value) return `${name}: ${value.join(", ")}\n`;
		})
		.filter(Boolean);

function checkEnv() {
	try {
		const _clientEnv = clientSchema.parse(clientEnv);

		/**
		 * Validate that client-side environment variables are exposed to the client.
		 */
		for (let key of Object.keys(_clientEnv)) {
			if (!key.startsWith("NEXT_PUBLIC_")) {
				console.warn("❌ Invalid public environment variable name:", key);

				throw new Error("Invalid public environment variable name");
			}
		}

		return _clientEnv;
	} catch (err) {
		if (err instanceof ValiError) {
			const flatErrors = flatten(err);
			console.error("❌ Invalid environment variables:\n", ...formatErrors(flatErrors.nested));
			throw new Error("Invalid environment variables");
		}
	}
}

export const env = checkEnv();
