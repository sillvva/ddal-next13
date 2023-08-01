import { authOptions } from "$src/lib/auth";
import { deleteCharacter } from "$src/server/actions/character";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function DELETE(request: Request, { params: { characterId } }: { params: { characterId: string } }) {
	const session = await getServerSession(authOptions);
	if (!session?.user) return new Response("Unauthorized", { status: 401 });

	const result = await deleteCharacter(characterId, session.user.id);
	return NextResponse.json(result);
}
