"use server";

import { prisma } from "$src/server/db/client";
import { getUserDMsWithLogs } from "../db/dms";

export type DeleteDMResult = ReturnType<typeof deleteDM>;
export async function deleteDM(dmId: string, userId?: string) {
	try {
		if (!userId) throw new Error("You must be logged in to delete a DM");
		const dms = (await getUserDMsWithLogs(userId)).filter(dm => dm.id === dmId);
		if (!dms.length) throw new Error("You do not have permission to delete this DM");
		const dm = dms.find(dm => dm.logs.length);
		if (dm) throw new Error("You cannot delete a DM that has logs");
		const result = await prisma.dungeonMaster.delete({
			where: { id: dmId }
		});
		return { id: result.id, error: null };
	} catch (error) {
		if (error instanceof Error) return { id: null, error: error.message };
		else return { id: null, error: "An unknown error has occurred." };
	}
}
