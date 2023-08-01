import { EditCharacterForm } from "$src/components/forms";
import { authOptions } from "$src/lib/auth";
import { appMeta } from "$src/lib/meta";
import { saveCharacter } from "$src/server/actions/character";
import { getCharacterCache } from "$src/server/db/characters";
import { newCharacterSchema } from "$src/types/zod-schema";
import { getServerSession } from "next-auth";
import { revalidateTag } from "next/cache";
// import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { z } from "zod";
import { mdiHome } from "@mdi/js";
import Icon from "@mdi/react";

import type { Metadata } from "next";

export default async function Page({ params: { characterId } }: { params: { characterId: string } }) {
	const session = await getServerSession(authOptions);
	if (!session?.user) throw redirect("/");

	const charData: z.infer<typeof newCharacterSchema> = {
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

	const actionEditCharacter = async (data: z.infer<typeof newCharacterSchema>) => {
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
			<div className="breadcrumbs mb-4 text-sm">
				<ul>
					<li>
						<Icon path={mdiHome} className="w-4" />
					</li>
					<li>
						<Link href="/characters" className="text-secondary">
							Characters
						</Link>
					</li>
					{characterId === "new" ? (
						<li className="dark:drop-shadow-md">New Character</li>
					) : (
						<>
							<li>
								<Link href={`/characters/${characterId}`} className="text-secondary">
									{charData.name}
								</Link>
							</li>
							<li className="dark:drop-shadow-md">Edit</li>
						</>
					)}
				</ul>
			</div>

			<EditCharacterForm id={characterId} character={charData} editCharacter={actionEditCharacter} />
		</>
	);
}

export async function generateMetadata({ params: { characterId } }: { params: { characterId: string } }): Promise<Metadata> {
	const headersList = headers();
	const domain = headersList.get("host") || "";
	const fullUrl = headersList.get("referer") || "";
	const path = fullUrl.replace(domain, "").replace(/^https?:\/\//, "");

	if (characterId === "new") return appMeta(path, "New Character");

	const character = await getCharacterCache(characterId);
	if (character) return appMeta(path, `Edit ${character.name}`);
	else return appMeta(path, "Character Not Found");
}
