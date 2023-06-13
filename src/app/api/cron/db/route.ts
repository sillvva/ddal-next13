import { env } from "$src/env/server.mjs";
import { prisma } from "$src/server/db/client";
import { NextResponse } from "next/server";

export async function GET() {
	return NextResponse.json(
		await prisma.character.findFirst({
			where: {
				id: env.CRON_CHARACTER_ID
			}
		})
	);
}
