import { authOptions } from "$src/lib/auth";
import { parseError } from "$src/lib/utils";
import { prisma } from "$src/server/db/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET() {
	const session = await getServerSession(authOptions);

	if (!session?.user) return new Response("Unauthorized", { status: 401 });

	try {
		const dmLogs = await prisma.log.findMany({
			where: {
				dm: { uid: session.user.id },
				is_dm_log: true
			},
			orderBy: { date: "asc" },
			include: {
				magic_items_gained: true,
				story_awards_gained: true,
				character: true
			}
		});

		return NextResponse.json(dmLogs);
	} catch (err) {
		return new Response(parseError(err), { status: 500 });
	}
}
