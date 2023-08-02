import { prisma } from "$src/server/db/client";
import { unstable_cache } from "next/cache";

export type UserDMs = Awaited<ReturnType<typeof getUserDMs>>;
export async function getUserDMs(userId: string) {
	return await prisma.dungeonMaster.findMany({
		where: {
			OR: [
				{
					logs: {
						every: {
							character: {
								userId: userId
							}
						}
					}
				},
				{
					uid: userId
				}
			]
		}
	});
}

export function getUserDMsCache(userId: string) {
	return unstable_cache(
		async () => {
			return await getUserDMs(userId);
		},
		[`dms-${userId}`],
		{
			tags: [`dms-${userId}`]
		}
	)();
}

export type UserDMsWithLogs = Awaited<ReturnType<typeof getUserDMsWithLogs>>;
export async function getUserDMsWithLogs(userId: string) {
	return await prisma.dungeonMaster.findMany({
		where: {
			OR: [
				{
					logs: {
						every: {
							character: {
								userId: userId
							}
						}
					}
				},
				{
					uid: userId
				}
			]
		},
		include: {
			logs: {
				include: {
					character: {
						select: {
							id: true,
							name: true
						}
					}
				}
			}
		}
	});
}

export function getUserDMsWithLogsCache(userId: string) {
	return unstable_cache(
		async () => {
			return await getUserDMsWithLogs(userId);
		},
		[`dms-wlogs-${userId}`],
		{
			tags: [`dms-wlogs-${userId}`]
		}
	)();
}

export type UserDMWithLogs = Awaited<ReturnType<typeof getUserDMWithLogs>>;
export async function getUserDMWithLogs(userId: string, dmId: string) {
	return await prisma.dungeonMaster.findFirst({
		where: {
			id: dmId,
			OR: [
				{
					logs: {
						every: {
							character: {
								userId: userId
							}
						}
					}
				},
				{
					uid: userId
				}
			]
		},
		include: {
			logs: {
				include: {
					character: {
						select: {
							id: true,
							name: true
						}
					}
				}
			}
		}
	});
}

export function getUserDMWithLogsCache(userId: string, dmId: string) {
	return unstable_cache(
		async () => {
			return await getUserDMWithLogs(userId, dmId);
		},
		[`dm-wlogs-${dmId}`],
		{
			tags: [`dm-wlogs-${dmId}`]
		}
	)();
}
