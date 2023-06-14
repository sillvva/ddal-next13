"use server";
import { prisma } from "../db/client";

export type DeleteCharacterFunction = typeof deleteCharacter;
export async function deleteCharacter(characterId: string, userId?: string) {
	const character = await prisma.character.findUnique({
		where: { id: characterId },
		include: { logs: { include: { character: true } } }
	});
	if (character && character.userId !== userId) {
		const logIds = character.logs.map(log => log.id);
		return await prisma.$transaction(async tx => {
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
	} else return false;
}
