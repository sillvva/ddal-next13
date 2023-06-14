"use server";

import { revalidatePath } from "next/cache";

import { Character } from "@prisma/client";

import { prisma } from "../db/client";

export async function deleteLog(logId: string, userId?: string) {
	if (!userId) throw new Error("Not authenticated");
	const result = await prisma.$transaction(async tx => {
		const log = await tx.log.findUnique({
			where: {
				id: logId
			},
			include: {
				dm: true
			}
		});
		let character: Character | null = null;
		if (log?.characterId) {
			character = await tx.character.findUnique({
				where: {
					id: log.characterId || ""
				}
			});
			if (character?.userId !== userId) throw new Error("Not authorized");
		} else if (log?.dm && log.dm.uid !== userId) throw new Error("Not authorized");
		await tx.magicItem.updateMany({
			where: {
				logLostId: logId
			},
			data: {
				logLostId: null
			}
		});
		await tx.magicItem.deleteMany({
			where: {
				logGainedId: logId
			}
		});
		await tx.storyAward.updateMany({
			where: {
				logLostId: logId
			},
			data: {
				logLostId: null
			}
		});
		await tx.storyAward.deleteMany({
			where: {
				logGainedId: logId
			}
		});
		await tx.log.delete({
			where: {
				id: logId
			}
		});
		return character;
	});
	if (result) revalidatePath(`/character/${result.id}`);
	revalidatePath("/characters");
	return result?.id;
}
