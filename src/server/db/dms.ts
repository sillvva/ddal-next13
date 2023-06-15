import { prisma } from "$src/server/db/client";

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
