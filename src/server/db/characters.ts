import { getLogsSummary } from "$src/lib/entities";
import { prisma } from "$src/server/db/client";
import { unstable_cache } from "next/cache";

export type CharacterData = Exclude<Awaited<ReturnType<typeof getCharacter>>, null>;
export async function getCharacter(characterId: string, includeLogs = true) {
	const character = await prisma.character.findFirst({
		include: {
			user: true
		},
		where: { id: characterId }
	});

	if (!character) throw new Error("Character not found");

	const logs = includeLogs
		? await prisma.log.findMany({
				where: { characterId: character.id },
				include: {
					dm: true,
					magic_items_gained: true,
					magic_items_lost: true,
					story_awards_gained: true,
					story_awards_lost: true
				},
				orderBy: {
					date: "asc"
				}
		  })
		: [];

	return {
		...character,
		...getLogsSummary(logs)
	};
}

export function getCharacterCache(characterId: string) {
	return unstable_cache(
		async () => {
			return await getCharacter(characterId);
		},
		[`character-${characterId}`],
		{
			tags: [`character-${characterId}`]
		}
	)();
}

export type CharactersData = Awaited<ReturnType<typeof getCharacters>>;
export async function getCharacters(userId: string) {
	return await prisma.character.findMany({
		include: {
			user: true
		},
		where: { userId: userId }
	});
}

export function getCharactersCache(userId: string) {
	return unstable_cache(
		async () => {
			return await prisma.character.findMany({
				include: {
					user: true
				},
				where: { userId: userId }
			});
		},
		[`characters-${userId}`],
		{
			tags: [`characters-${userId}`]
		}
	)();
}
