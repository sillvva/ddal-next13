import { BreadCrumbs } from "$src/components/breadcrumbs";
import { CharactersTable } from "$src/components/table";
import { authOptions } from "$src/lib/auth";
import { appMeta, isMobile } from "$src/lib/meta";
import { getCookie } from "$src/lib/store";
import { getCharacterCache, getCharactersCache } from "$src/server/db/characters";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { mdiDotsHorizontal } from "@mdi/js";
import Icon from "@mdi/react";

import type { Metadata } from "next";
export type CharactersCookie = (typeof charactersCookieSchema)["defaults"];
const charactersCookieSchema = {
	name: "characters",
	defaults: {
		magicItems: false
	}
};

export default async function Page() {
	const session = await getServerSession(authOptions);
	if (!session?.user) throw redirect("/");

	const charactersData = await getCharactersCache(session.user.id);
	const characterData = await Promise.all(charactersData.map(character => getCharacterCache(character.id)));
	const characters = characterData.filter(Boolean);

	const characterCookie = getCookie(charactersCookieSchema);

	const mobile = isMobile();

	return (
		<div className="flex flex-col gap-4">
			<div className="hidden gap-4 sm:flex">
				<BreadCrumbs crumbs={[{ name: "Characters" }]} />

				<div className="dropdown-end dropdown">
					<span role="button" tabIndex={0} className="btn-sm btn bg-base-100">
						<Icon path={mdiDotsHorizontal} className="w-6" />
					</span>
					<ul className="dropdown-content menu rounded-box w-52 bg-base-100 p-2 shadow">
						<li>
							<a download={`characters.json`} href={`/api/export/characters/all`} target="_blank" rel="noreferrer noopener">
								Export
							</a>
						</li>
					</ul>
				</div>
			</div>

			<CharactersTable characters={characters} cookie={{ name: charactersCookieSchema.name, value: characterCookie }} mobile={mobile} />
		</div>
	);
}

export async function generateMetadata(): Promise<Metadata> {
	const session = await getServerSession(authOptions);
	return appMeta(`${session?.user?.name}'s Characters`);
}
