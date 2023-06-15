import { CharactersTable } from "$src/components/table";
import { authOptions } from "$src/lib/auth";
import { appMeta } from "$src/lib/meta";
import { getCookie } from "$src/lib/store";
import { getCharacters } from "$src/server/db/characters";
import { getServerSession } from "next-auth";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { mdiDotsHorizontal, mdiHome, mdiPlus } from "@mdi/js";
import Icon from "@mdi/react";

import type { Metadata } from "next";

const charactersCookieSchema = {
	name: "characters",
	defaults: {
		magicItems: false
	}
};

export type CharactersCookie = (typeof charactersCookieSchema)["defaults"];

export default async function Page() {
	const session = await getServerSession(authOptions);
	if (!session?.user) throw redirect("/");

	const characters = await getCharacters(session.user.id);
	const characterCookie = getCookie(charactersCookieSchema);

	return (
		<div className="flex flex-col gap-4">
			<div className="flex gap-4">
				<div className="breadcrumbs text-sm">
					<ul>
						<li>
							<Icon path={mdiHome} className="w-4" />
						</li>
						<li className="dark:drop-shadow-md">Characters</li>
					</ul>
				</div>
				<div className="flex-1" />
				{characters && characters.length > 0 && (
					<Link href="/characters/new" className="btn-primary btn-sm btn">
						<span className="hidden sm:inline">New Character</span>
						<Icon path={mdiPlus} className="inline w-4 sm:hidden" />
					</Link>
				)}
				<div className="dropdown-end dropdown">
					<label tabIndex={1} className="btn-sm btn">
						<Icon path={mdiDotsHorizontal} size={1} />
					</label>
					<ul tabIndex={1} className="dropdown-content menu rounded-box w-52 bg-base-100 p-2 shadow">
						<li>
							<a download={`characters.json`} href={`/api/exports/characters/all`} target="_blank" rel="noreferrer noopener">
								Export
							</a>
						</li>
					</ul>
				</div>
			</div>

			<CharactersTable characters={characters} cookie={{ name: charactersCookieSchema.name, value: characterCookie }} />
		</div>
	);
}

export async function generateMetadata(): Promise<Metadata> {
	const session = await getServerSession(authOptions);
	const headersList = headers();
	const domain = headersList.get("host") || "";
	const fullUrl = headersList.get("referer") || "";
	const path = fullUrl.replace(domain, "").replace(/^https?:\/\//, "");

	return appMeta(path, `${session?.user?.name}'s Characters`);
}
