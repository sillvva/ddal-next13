import { authOptions } from "$src/lib/auth";
import { parseError } from "$src/lib/utils";
import { getCharacter, getCharacters } from "$src/server/db/characters";
import { getServerSession as getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params: { characterId } }: { params: { characterId: string } }) {
	const session = await getServerSession(authOptions);

	if (!session || !session.user) return new Response("Unauthorized", { status: 401 });

	try {
		if (characterId === "all") {
			const characters = await getCharacters(session.user.id);
			return NextResponse.json(characters);
		} else {
			if (typeof characterId !== "string") return new Response("Invalid characterId", { status: 400 });

			const character = await getCharacter(characterId);

			if (!character) return new Response("Character not found", { status: 404 });
			if (character.userId !== session.user.id) return new Response("Unauthorized", { status: 401 });

			return NextResponse.json(character);
		}
	} catch (err) {
		return NextResponse.json({ error: parseError(err) });
	}
}
