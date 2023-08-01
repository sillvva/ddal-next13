import { DeleteCharacter } from "$src/components/actions";
import { BreadCrumbs } from "$src/components/breadcrumbs";
import { Items } from "$src/components/items";
import { CharacterLogTable } from "$src/components/table";
import { authOptions } from "$src/lib/auth";
import { appMeta, characterMeta } from "$src/lib/meta";
import { getCookie } from "$src/lib/store";
import { slugify } from "$src/lib/utils";
import { deleteCharacter } from "$src/server/actions/character";
import { deleteLog } from "$src/server/actions/log";
import { getCharacterCache } from "$src/server/db/characters";
import { getServerSession } from "next-auth";
import { revalidateTag } from "next/cache";
import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { mdiDotsHorizontal } from "@mdi/js";
import Icon from "@mdi/react";

import type { Metadata } from "next";
export type CharacterCookie = (typeof characterCookieSchema)["defaults"];
const characterCookieSchema = {
	name: "character",
	defaults: {
		descriptions: true
	}
};

export default async function Page({ params: { characterId } }: { params: { characterId: string } }) {
	if (characterId === "new") throw redirect("/characters/new/edit");

	const session = await getServerSession(authOptions);

	const character = await getCharacterCache(characterId);
	if (!character) throw redirect(session?.user ? "/characters" : "/");
	const myCharacter = character?.userId === session?.user?.id;

	const characterCookie = getCookie(characterCookieSchema);

	const actionDeleteLog = async (logId: string) => {
		"use server";
		const result = await deleteLog(logId, session?.user?.id);
		if (result.id) {
			revalidateTag(`character-${characterId}`);
		}
		return result;
	};

	const actionDeleteCharacter = async () => {
		"use server";
		const result = await deleteCharacter(characterId, session?.user?.id);
		if (result.id) {
			revalidateTag(`characters-${session?.user?.id}`);
		}
		return result;
	};

	return (
		<>
			<div className="hidden gap-4 print:hidden sm:flex">
				<BreadCrumbs crumbs={[{ name: "Characters", href: "/characters" }, { name: character.name }]} />

				{myCharacter && (
					<>
						<Link href={`/characters/${character.id}/edit`} className="btn-primary btn-sm btn">
							Edit
						</Link>
						<div className="dropdown-end dropdown">
							<span role="button" tabIndex={0} className="btn-sm btn bg-base-100">
								<Icon path={mdiDotsHorizontal} className="w-6" />
							</span>
							<ul className="dropdown-content menu rounded-box z-20 w-52 bg-base-100 p-2 shadow">
								<li>
									<a download={`${slugify(character.name)}.json`} href={`/api/export/characters/${character.id}`} target="_blank" rel="noreferrer noopener">
										Export
									</a>
								</li>
								<DeleteCharacter deleteCharacter={actionDeleteCharacter} />
							</ul>
						</div>
					</>
				)}
			</div>

			<section className="flex">
				<div className="flex flex-1 flex-col gap-6">
					<div className="flex">
						{character.image_url && (
							<div className="relative mr-4 hidden flex-col items-end justify-center print:hidden xs:flex md:hidden">
								<a href={character.image_url} target="_blank" rel="noreferrer noopener" className="mask mask-squircle mx-auto h-20 w-full bg-primary">
									<Image src={character.image_url} className="h-full w-full object-cover object-top transition-all" alt={character.name} />
								</a>
							</div>
						)}
						<div className="flex w-full flex-col">
							<div className="mb-2 flex gap-4 xs:mb-0">
								<h3 className="flex-1 py-2 font-vecna text-3xl font-bold text-accent-content sm:py-0 sm:text-4xl">{character.name}</h3>
								<div className="dropdown-end dropdown sm:hidden">
									<span role="button" tabIndex={0} className="btn">
										<Icon path={mdiDotsHorizontal} className="w-6" />
									</span>
									<ul className="dropdown-content menu rounded-box z-20 w-52 bg-base-100 p-2 shadow">
										{character.image_url && (
											<li className="xs:hidden">
												<a href={character.image_url} target="_blank">
													View Image
												</a>
											</li>
										)}
										{myCharacter && (
											<>
												<li>
													<a href={`/characters/${character.id}/edit`}>Edit</a>
												</li>
												<li>
													<DeleteCharacter deleteCharacter={actionDeleteCharacter} />
												</li>
											</>
										)}
									</ul>
								</div>
							</div>
							<p className="flex-1 text-xs font-semibold xs:text-sm">
								{character.race} {character.class}
							</p>
							<p className="flex-1 text-xs">
								{character.campaign}{" "}
								{character.character_sheet_url && (
									<span className="print:hidden">
										-{" "}
										<a
											href={character.character_sheet_url}
											target="_blank"
											rel="noreferrer noopner"
											className="font-semibold text-secondary dark:drop-shadow-sm">
											Character Sheet
										</a>
									</span>
								)}
							</p>
						</div>
					</div>
					<div className="flex flex-1 flex-wrap gap-4 print:flex-nowrap xs:flex-nowrap sm:gap-4 md:gap-6">
						<div className="flex basis-full flex-col gap-2 print:basis-1/3 xs:basis-[40%] sm:basis-1/3 sm:gap-4 md:basis-52">
							{character.image_url && (
								<div className="relative hidden flex-col items-end justify-center print:hidden md:flex">
									<a href={character.image_url} target="_blank" rel="noreferrer noopener" className="mask mask-squircle mx-auto h-52 w-full bg-primary">
										<Image src={character.image_url} className="h-full w-full object-cover object-top transition-all" alt={character.name} />
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
						<div className="divider hidden xs:divider-horizontal before:bg-black/50 after:bg-black/50 dark:before:bg-white/50 dark:after:bg-white/50 print:flex xs:mx-0 xs:flex" />
						<div className="flex basis-full flex-col print:basis-2/3 xs:basis-[60%] sm:basis-2/3 lg:basis-2/3">
							{character && (
								<div className="flex flex-col gap-4">
									<Items title="Story Awards" items={character.story_awards} collapsible sort />
									<Items title="Magic Items" items={character.magic_items} collapsible formatting sort />
								</div>
							)}
						</div>
					</div>
				</div>
			</section>

			<CharacterLogTable
				character={character}
				userId={session?.user?.id || ""}
				cookie={{ name: characterCookieSchema.name, value: characterCookie }}
				deleteLog={actionDeleteLog}
			/>
		</>
	);
}

export async function generateMetadata({ params: { characterId } }: { params: { characterId: string } }): Promise<Metadata> {
	const headersList = headers();
	const domain = headersList.get("host") || "";
	const fullUrl = headersList.get("referer") || "";
	const path = fullUrl.replace(domain, "").replace(/^https?:\/\//, "");

	const character = await getCharacterCache(characterId);
	if (character) return characterMeta(character, path);
	else return appMeta(path, "Character Not Found");
}
