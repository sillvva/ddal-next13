import { authOptions } from "$src/lib/auth";
import { getCharacter } from "$src/server/db/characters";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function Page({ params: { characterId } }: { params: { characterId: string } }) {
	const session = await getServerSession(authOptions);
	if (!session?.user) throw redirect("/");

	const charData = {
		name: "",
		race: "",
		class: "",
		campaign: "",
		character_sheet_url: "",
		image_url: ""
	};

	const character = await getCharacter(characterId);
	if (character?.userId !== session?.user?.id) throw redirect("/characters");

	if (character) {
		charData.name = character.name;
		charData.race = character.race || "";
		charData.class = character.class || "";
		charData.campaign = character.campaign || "";
		charData.character_sheet_url = character.character_sheet_url || "";
		charData.image_url = character.image_url || "";
	} else if (characterId != "new") throw redirect("/characters");

	return (
		<>
			<h1>Edit {charData.name}</h1>
			<pre>{JSON.stringify(charData, null, 2)}</pre>
		</>
	);
}
