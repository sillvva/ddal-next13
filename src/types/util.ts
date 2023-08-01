import { CharacterData } from "$src/app/(app)/characters/[characterId]/get/route";
import { NextResponse } from "next/server";

export type ExtractResponse<P> = P extends (...args: any) => any
	? ExtractResponse<Awaited<ReturnType<P>>>
	: P extends NextResponse<infer T>
	? Convert<Date, string, T>
	: never;

type Convert<FromType, ToType, TObj> = {
	[K in keyof TObj]: TObj[K] extends FromType
		? ToType
		: TObj[K] extends FromType | null
		? ToType | null
		: TObj[K] extends FromType | undefined
		? ToType | undefined
		: TObj[K] extends FromType | null | undefined
		? ToType | null | undefined
		: TObj[K] extends object
		? Convert<FromType, ToType, TObj[K]>
		: TObj[K];
};

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
