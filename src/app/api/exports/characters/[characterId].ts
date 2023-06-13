import { authOptions as nextAuthOptions } from "$src/lib/auth";
import { parseError } from "$src/lib/misc";
import { getCharacter, getCharacters } from "$src/server/db/characters";
import { prisma } from "$src/server/db/client";
import { getServerSession as getServerSession } from "next-auth";

import type { NextApiHandler } from "next";
const handler: NextApiHandler = async function (req, res) {
	const session = await getServerSession(req, res, nextAuthOptions);

	if (!session || !session.user) return res.status(401).send("Unauthorized");
	const { characterId } = req.query;

	try {
		if (characterId === "all") {
			const characters = await getCharacters(prisma, session.user.id);
			return res.status(200).json(characters);
		} else {
			if (typeof characterId !== "string") return res.status(400).json({ message: "Invalid characterId" });

			const character = await getCharacter(prisma, characterId);

			if (!character) return res.status(404).json({ message: "Character not found" });
			if (character.userId !== session.user.id) return res.status(401).json({ message: "Unauthorized" });

			return res.status(200).json(character);
		}
	} catch (err) {
		return res.status(500).json({ error: parseError(err) });
	}
};

export default handler;
