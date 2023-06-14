import { Items } from "$src/components/items";
import { CharacterLogTable } from "$src/components/table";
import { authOptions } from "$src/lib/auth";
import { appMeta, characterMeta } from "$src/lib/meta";
import { slugify } from "$src/lib/misc";
import { getCookie } from "$src/lib/store";
import { getCharacter } from "$src/server/db/characters";
import { getServerSession } from "next-auth";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { mdiDotsHorizontal, mdiHome } from "@mdi/js";
import Icon from "@mdi/react";

const characterCookieSchema = {
	name: "character",
	defaults: {
		descriptions: false
	}
};

export type CharacterCookie = (typeof characterCookieSchema)["defaults"];

export default async function Page({ params: { characterId } }: { params: { characterId: string } }) {
	if (characterId === "new") throw redirect("/characters/new/edit");

	const session = await getServerSession(authOptions);
	const character = await getCharacter(characterId);
	const myCharacter = character?.userId === session?.user?.id;

	if (!character) throw redirect(session?.user ? "/characters" : "/");

	const characterCookie = getCookie(characterCookieSchema);

	return (
		<>
			<div className="flex gap-4 print:hidden">
				<div className="breadcrumbs mb-4 flex-1 text-sm">
					<ul>
						<li>
							<Icon path={mdiHome} className="w-4" />
						</li>
						<li>
							<Link href="/characters" className="text-secondary">
								Characters
							</Link>
						</li>
						<li className="overflow-hidden text-ellipsis whitespace-nowrap dark:drop-shadow-md">{character.name}</li>
					</ul>
				</div>
				{myCharacter && (
					<>
						<Link href={`/characters/${characterId}/edit`} className="btn-primary btn-sm btn hidden sm:flex">
							Edit
						</Link>
						<div className="dropdown-end dropdown">
							<label tabIndex={1} className="btn-sm btn">
								<Icon path={mdiDotsHorizontal} size={1} />
							</label>
							<ul tabIndex={1} className="dropdown-content menu rounded-box w-52 bg-base-100 p-2 shadow">
								<li className="flex sm:hidden">
									<Link href={`/characters/${characterId}/edit`}>Edit</Link>
								</li>
								<li>
									<a download={`${slugify(character.name)}.json`} href={`/api/exports/characters/${characterId}`} target="_blank" rel="noreferrer noopener">
										Export
									</a>
								</li>
								<li>
									{/* <a
										className="bg-red-600 text-white hover:bg-red-900"
										onClick={() => {
											if (confirm("Are you sure you want to delete this character? This action cannot be undone.")) {
												deleteCharacterMutation.mutate({
													id: characterId
												});
											}
										}}>
										Delete
									</a> */}
								</li>
							</ul>
						</div>
					</>
				)}
			</div>

			<section className="flex">
				<div className="flex flex-1 flex-col gap-6">
					<div className="flex flex-col">
						<h3 className="flex-1 font-vecna text-4xl font-bold text-accent-content">{character.name}</h3>
						<p className="flex-1 text-sm font-semibold">
							{character.race} {character.class}
						</p>
						<p className="flex-1 text-xs">
							{character.campaign}
							{character.character_sheet_url && (
								<span className="print:hidden">
									{" - "}
									<a href={character.character_sheet_url} target="_blank" rel="noreferrer noopner" className="font-semibold text-secondary dark:drop-shadow-sm">
										Character Sheet
									</a>
								</span>
							)}
						</p>
					</div>
					<div className="flex flex-1 flex-wrap gap-4 print:flex-nowrap sm:flex-nowrap sm:gap-4 md:gap-6">
						<div className="flex basis-full flex-col gap-2 print:basis-1/3 sm:gap-4 md:basis-52">
							{character.image_url && (
								<div className="relative hidden flex-col items-end justify-center print:hidden md:flex">
									<a href={character.image_url} target="_blank" rel="noreferrer noopener" className="mask mask-squircle mx-auto h-52 w-full bg-primary">
										{/* eslint-disable-next-line @next/next/no-img-element */}
										<img src={character.image_url} className="h-full w-full object-cover object-top transition-all" alt={character.name} />
									</a>
								</div>
							)}
							<div className="flex">
								<h4 className="font-semibold">Level</h4>
								<div className="flex-1 text-right">{character.total_level}</div>
							</div>
							<div className="flex">
								<h4 className="font-semibold">Tier</h4>
								<div className="flex-1 text-right">{character.tier}</div>
							</div>
							<div className="flex">
								<h4 className="font-semibold">Gold</h4>
								<div className="flex-1 text-right">{character.total_gold.toLocaleString("en-US")}</div>
							</div>
							<div className="flex">
								<h4 className="font-semibold">Downtime</h4>
								<div className="flex-1 text-right">{character.total_dtd}</div>
							</div>
						</div>
						<div className="divider hidden sm:divider-horizontal before:bg-neutral-content/50 after:bg-neutral-content/50 print:flex sm:flex"></div>
						<div className="flex flex-1 basis-full flex-col print:basis-2/3 sm:basis-2/3 lg:basis-2/3">
							{character && (
								<div className="flex flex-col gap-4">
									<Items title="Story Awards" items={character.story_awards} collapsible />
									<Items title="Magic Items" items={character.magic_items} collapsible formatting />
								</div>
							)}
						</div>
					</div>
				</div>
			</section>

			<CharacterLogTable character={character} cookie={{ name: characterCookieSchema.name, value: characterCookie }} userId={session?.user?.id} />
		</>
	);
}

import type { Metadata } from "next";
export async function generateMetadata({ params: { characterId } }: { params: { characterId: string } }): Promise<Metadata> {
	const headersList = headers();
	const domain = headersList.get("host") || "";
	const fullUrl = headersList.get("referer") || "";
	const path = fullUrl.replace(domain, "").replace(/^https?:\/\//, "");

	const character = await getCharacter(characterId);

	if (character) return characterMeta(character, path);
	else return appMeta(path, "Character Not Found");
}
