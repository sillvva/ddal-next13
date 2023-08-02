import { prisma } from "$src/server/db/client";
import { unstable_cache } from "next/cache";

export type LogData = Exclude<Awaited<ReturnType<typeof getLog>>, null>;
export async function getLog(logId: string, dmLog = false) {
	return await prisma.log.findFirst({
		where: { id: logId, is_dm_log: dmLog },
		include: { dm: true, magic_items_gained: true, magic_items_lost: true, story_awards_gained: true, story_awards_lost: true }
	});
}

export function getLogCache(logId: string, dmLog = false) {
	return unstable_cache(
		async () => {
			return await getLog(logId, dmLog);
		},
		[`log-${logId}`],
		{
			tags: [`log-${logId}`]
		}
	)();
}

export type DMLogData = Awaited<ReturnType<typeof getDMLogs>>;
export async function getDMLogs(userId = "", userName = "") {
	return prisma.log.findMany({
		where: {
			is_dm_log: true,
			dm: {
				OR: [
					{
						uid: userId
					},
					{
						name: userName
					}
				]
			}
		},
		include: {
			dm: true,
			magic_items_gained: true,
			magic_items_lost: true,
			story_awards_gained: true,
			story_awards_lost: true,
			character: {
				include: {
					user: true
				}
			}
		}
	});
}

export function getDMLogsCache(userId = "", userName = "") {
	return unstable_cache(
		async () => {
			return await getDMLogs(userId, userName);
		},
		[`dm-logs-${userId}`],
		{
			tags: [`dm-logs-${userId}`]
		}
	)();
}
