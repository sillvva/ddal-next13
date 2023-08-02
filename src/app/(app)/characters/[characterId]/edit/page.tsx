import { BreadCrumbs } from "$src/components/breadcrumbs";
import { EditCharacterForm } from "$src/components/forms";
import { authOptions } from "$src/lib/auth";
import { appMeta } from "$src/lib/meta";
import { saveCharacter } from "$src/server/actions/character";
import { getCharacterCache } from "$src/server/db/characters";
import { getServerSession } from "next-auth";
import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";

import type { NewCharacterSchema } from "$src/types/schemas";
import type { Metadata } from "next";

export default async function Page({ params: { characterId } }: { params: { characterId: string } }) {
	const session = await getServerSession(authOptions);
	if (!session?.user) throw redirect("/");

	const charData: NewCharacterSchema = {
		name: "",
		race: "",
		class: "",
		campaign: "",
		character_sheet_url: "",
		image_url: ""
	};

	if (characterId !== "new") {
		const character = await getCharacterCache(characterId);
		if (character?.userId !== session?.user?.id) throw redirect("/characters");

		if (character) {
			charData.name = character.name;
			charData.race = character.race || "";
			charData.class = character.class || "";
			charData.campaign = character.campaign || "";
			charData.character_sheet_url = character.character_sheet_url || "";
			charData.image_url = character.image_url || "";
		}
	}

	const actionEditCharacter = async (data: NewCharacterSchema) => {
		"use server";
		const result = await saveCharacter(characterId, session?.user?.id || "", data);
		if (result.id) {
			revalidateTag(`character-${result.id}`);
			redirect(`/characters/${result.id}`);
		}
		return result;
	};

	return (
		<>
			{characterId === "new" ? (
				<BreadCrumbs
					crumbs={[
						{
							name: "Characters",
							href: "/characters"
						},
						{
							name: "New Character"
						}
					]}
				/>
			) : (
				<BreadCrumbs
					crumbs={[
						{
							name: "Characters",
							href: "/characters"
						},
						{
							name: charData.name,
							href: `/characters/${characterId}`
						},
						{
							name: "Edit"
						}
					]}
				/>
			)}

			<EditCharacterForm id={characterId} character={charData} editCharacter={actionEditCharacter} />
		</>
	);
}

export async function generateMetadata({ params: { characterId } }: { params: { characterId: string } }): Promise<Metadata> {
	if (characterId === "new") return appMeta("New Character");

	const character = await getCharacterCache(characterId);
	if (character) return appMeta(`Edit ${character.name}`);
	else return appMeta("Character Not Found");
}
