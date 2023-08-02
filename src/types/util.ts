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
