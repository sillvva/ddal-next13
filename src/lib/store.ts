import { unstable_cache } from "next/cache";
import { cookies } from "next/headers";

export type CookieSchema<TDefaults> = { name: string; defaults: TDefaults };

export const getCookie = <TDefaults extends Record<string, string | number | boolean>>(schema: CookieSchema<TDefaults>) => {
	const cookieValue = JSON.parse(cookies().get(schema.name)?.value || "{}");
	const cookieData = schema.defaults;

	if (typeof cookieValue === "object") {
		for (let key in cookieData) {
			if (key in cookieValue) {
				cookieData[key] = cookieValue[key];
			}
		}
	}

	return cookieData;
};

export const dataCache = <TReturnType>(callback: (...args: any[]) => Promise<TReturnType>, tags: string[]) =>
	unstable_cache(callback, tags, {
		tags
	})();
