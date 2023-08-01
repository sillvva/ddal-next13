import { getLogsSummary } from "$src/lib/entities";
import { ExtractResponse } from "$src/types/util";
import { NextResponse } from "next/server";

export type CharacterData = ExtractResponse<typeof GET>;
export async function GET(request: Request, { params: { characterId } }: { params: { characterId: string } }) {
	const character = await prisma.character.findFirst({
		include: {
			user: true,
			logs: {
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
			}
		},
		where: { id: characterId }
	});

	if (!character) return null;

	return NextResponse.json({
		...character,
		...getLogsSummary(character.logs || [])
	});
}
