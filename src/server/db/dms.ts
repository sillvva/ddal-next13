import { prisma } from "$src/server/db/client";

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
