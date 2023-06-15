import { prisma } from "$src/server/db/client";

export type LogData = Exclude<Awaited<ReturnType<typeof getLog>>, null>;
export async function getLog(logId: string) {
	return await prisma.log.findFirst({
		where: { id: logId, is_dm_log: true },
		include: { dm: true, magic_items_gained: true, magic_items_lost: true, story_awards_gained: true, story_awards_lost: true }
	});
}
