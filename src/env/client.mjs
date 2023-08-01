// @ts-check
import { flatten, safeParse } from "valibot";
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

const _clientEnv = safeParse(clientSchema, clientEnv);

if (!_clientEnv.success) {
	const flatErrors = flatten(_clientEnv.error);
	console.error("❌ Invalid environment variables:\n", ...formatErrors(flatErrors.nested));
	throw new Error("Invalid environment variables");
}

/**
 * Validate that client-side environment variables are exposed to the client.
 */
for (let key of Object.keys(_clientEnv.data)) {
	if (!key.startsWith("NEXT_PUBLIC_")) {
		console.warn("❌ Invalid public environment variable name:", key);

		throw new Error("Invalid public environment variable name");
	}
}

export const env = _clientEnv.data;
