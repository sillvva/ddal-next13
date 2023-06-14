"use server";
import { prisma } from "../db/client";

export type DeleteCharacterFunction = typeof deleteCharacter;
export async function deleteCharacter(characterId: string, userId?: string) {
	try {
		if (!userId) throw new Error("Not authenticated");
		const character = await prisma.character.findUnique({
			where: { id: characterId },
			include: { logs: { include: { character: true } } }
		});
		if (!character) throw new Error("Character not found");
		if (character.userId !== userId) throw new Error("Not authorized");
		const logIds = character.logs.map(log => log.id);
		const result = await prisma.$transaction(async tx => {
			await tx.magicItem.deleteMany({
				where: {
					logGainedId: {
						in: logIds
					}
				}
			});
			await tx.storyAward.deleteMany({
				where: {
					logGainedId: {
						in: logIds
					}
				}
			});
			await tx.log.deleteMany({
				where: {
					id: {
						in: logIds
					}
				}
			});
			return await tx.character.delete({
				where: { id: characterId }
			});
		});
		return { id: result.id, error: null };
	} catch (error) {
		if (error instanceof Error) return { id: null, error: error.message };
		else return { id: null, error: "An unknown error has occurred" };
	}
}