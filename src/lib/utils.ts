import { CharacterData } from "$src/server/db/characters";
import dayjs from "dayjs";
import { twMerge } from "tailwind-merge";

const parseObjectPrimitives = (obj: Record<string, any>): any => {
	return Object.fromEntries(
		Object.entries(obj).map(([k, v]) => {
			if (typeof v === "object") return [k, parseObjectPrimitives(v)];
			if (!isNaN(v)) return [k, parseFloat(v)];
			if (v === "true") return [k, true];
			if (v === "false") return [k, false];
			if (typeof v === "string") return [k, v];
			return [k, null];
		})
	);
};

export const parseError = (e: unknown) => {
	if (e instanceof Error) return e.message;
	if (typeof e === "string") return e;
	if (typeof e === "object") return JSON.stringify(e);
	return "Unknown error";
};

export const formatDate = (date: Date | string) => {
	return dayjs(date).format("YYYY-MM-DDTHH:mm");
};

export const slugify = (text: string) => {
	return text
		.toString()
		.normalize("NFD") // split an accented letter in the base letter and the acent
		.replace(/[\u0300-\u036f]/g, "") // remove all previously split accents
		.toLowerCase()
		.trim()
		.replace(/\s+/g, "-")
		.replace(/[^\w\-]+/g, "")
		.replace(/\-\-+/g, "-");
};

export const tooltipClasses = (text?: string | null, align = "center") => {
	if (!text) return "";
	return twMerge(
		"before:hidden before:lg:block before:max-h-[50vh] before:overflow-hidden before:text-ellipsis",
		"before:z-20 before:whitespace-normal before:![content:attr(data-tip)]",
		align == "left" && "before:left-0 before:translate-x-0",
		align == "right" && "before:right-0 before:translate-x-0",
		text?.trim() && "tooltip"
	);
};

export function canUseDOM() {
	return !!(typeof window !== "undefined" && window.document && window.document.createElement);
}

export function setCookie(name: string, value: object): void {
	if (!canUseDOM()) return;
	const expires = new Date();
	expires.setFullYear(expires.getFullYear() + 1);
	document.cookie = `${name}=${JSON.stringify(value)}; expires=${expires.toUTCString()}; path=/;`;
}

export function serializeCharacter(data: CharacterData) {
	return {
		...data,
		created_at: new Date(data.created_at),
		user: {
			...data.user,
			emailVerified: data.user.emailVerified ? new Date(data.user.emailVerified) : null
		},
		logs: data.logs.map(log => ({
			...log,
			date: new Date(log.date),
			applied_date: log.applied_date ? new Date(log.applied_date) : null,
			created_at: new Date(log.created_at)
		}))
	};
}

export const sorter = (a: string | number | Date, b: string | number | Date) => {
	if (typeof a === "string" && typeof b === "string") return a.localeCompare(b);
	if (typeof a === "number" && typeof b === "number") return a - b;
	if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
	if (typeof a === "string" && b instanceof Date) return a.localeCompare(b.toISOString());
	if (typeof b === "string" && a instanceof Date) return a.toISOString().localeCompare(b);
	return 0;
};
