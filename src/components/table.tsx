"use client";

import type { DeleteLogResult } from "$src/server/actions/log";
import { setCookie, sorter } from "$src/lib/utils";
import { DeleteDMResult } from "$src/server/actions/dm";
import { UserDMsWithLogs } from "$src/server/db/dms";
import { DMLogData } from "$src/server/db/log";
import MiniSearch from "minisearch";
import Link from "next/link";
import { Fragment, useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { twMerge } from "tailwind-merge";
import { mdiAccount, mdiEye, mdiEyeOff, mdiFormatListText, mdiPencil, mdiPlus, mdiTrashCan, mdiViewGrid } from "@mdi/js";
import Icon from "@mdi/react";
import { LazyImage } from "./images";
import { Items } from "./items";
import { Markdown } from "./markdown";
import { SearchResults } from "./search";

import type { CharacterData } from "$src/server/db/characters";
import type { CharactersCookie } from "$src/app/(app)/characters/page";
import type { CharacterCookie } from "$src/app/(app)/characters/[characterId]/page";
let stopWords = new Set(["and", "or", "to", "in", "a", "the"]);
const charactersSearch = new MiniSearch({
	fields: ["characterName", "campaign", "race", "class", "magicItems", "tier", "level"],
	idField: "characterId",
	processTerm: term => (stopWords.has(term) ? null : term.toLowerCase()),
	searchOptions: {
		prefix: true
	}
});

export function CharactersTable({
	characters,
	cookie,
	mobile
}: {
	characters: CharacterData[];
	cookie: { name: string; value: CharactersCookie };
	mobile: boolean;
}) {
	const [search, setSearch] = useState("");
	const [magicItems, setMagicItems] = useState(cookie.value.magicItems);
	const [display, setDisplay] = useState<"grid" | "list">("list");

	const indexed = useMemo(
		() =>
			characters
				? characters.map(character => ({
						characterId: character.id,
						characterName: character.name,
						campaign: character.campaign || "",
						race: character.race || "",
						class: character.class || "",
						tier: `T${character.tier}`,
						level: `L${character.total_level}`,
						magicItems: character.logs
							.reduce((acc, log) => {
								acc.push(...log.magic_items_gained.filter(magicItem => !magicItem.logLostId).map(magicItem => magicItem.name));
								return acc;
							}, [] as string[])
							.join(", ")
				  }))
				: [],
		[characters]
	);

	useEffect(() => {
		if (indexed.length) charactersSearch.addAll(indexed);
		return () => charactersSearch.removeAll();
	}, [indexed]);

	const msResults = useMemo(() => charactersSearch.search(search), [search]);
	const resultsMap = useMemo(() => new Map(msResults.map(result => [result.id, result])), [msResults]);
	const results = useMemo(
		() =>
			indexed.length && search.length > 1
				? characters
						.filter(character => resultsMap.has(character.id))
						.map(character => {
							const { score = character.name, match = {} } = resultsMap.get(character.id) || {};
							return {
								...character,
								score: score,
								match: Object.values(match)
									.map(value => value[0])
									.filter(Boolean)
							};
						})
						.sort((a, b) => sorter(a.total_level, b.total_level) || sorter(a.name, b.name))
				: characters.sort((a, b) => sorter(a.total_level, b.total_level) || sorter(a.name, b.name)).map(character => ({ ...character, score: 0, match: [] })),
		[characters, resultsMap, indexed, search]
	);

	const toggleMagicItems = useCallback(() => {
		setCookie(cookie.name, { ...cookie.value, magicItems: !magicItems });
		setMagicItems(!magicItems);
	}, [magicItems, cookie]);

	useEffect(() => {
		setCookie(cookie.name, cookie.value);
	}, [cookie]);

	return !characters.length ? (
		<section className="bg-base-100">
			<div className="py-20 text-center">
				<p className="mb-4">You have no log sheets.</p>
				<p>
					<Link href="/characters/new" className="btn-primary btn">
						Create one now
					</Link>
				</p>
			</div>
		</section>
	) : (
		<>
			<div className="flex flex-wrap gap-2">
				<div className="flex w-full gap-2 sm:max-w-md">
					<Link href="/characters/new/edit" className="btn-primary btn-sm btn hidden sm:inline-flex" aria-label="New Character">
						New Character
					</Link>
					<input
						type="text"
						placeholder="Search by name, race, class, items, etc."
						onChange={e => setSearch(e.target.value)}
						className="input-bordered input min-w-0 flex-1 sm:input-sm"
					/>
					<Link href="/characters/new/edit" className="btn-primary btn inline-flex sm:hidden" aria-label="New Character">
						<Icon path={mdiPlus} className="inline w-6" />
					</Link>
					<button
						className={twMerge("btn inline-flex xs:hidden", magicItems && "btn-primary")}
						onClick={toggleMagicItems}
						onKeyPress={() => null}
						role="button"
						aria-label="Toggle Magic Items"
						tabIndex={0}>
						<Icon path={magicItems ? mdiEye : mdiEyeOff} className="w-6" />
					</button>
				</div>
				<div className="hidden flex-1 xs:block" />
				{display != "grid" && (
					<button
						className={twMerge("btn hidden sm:btn-sm xs:inline-flex", magicItems && "btn-primary")}
						onClick={toggleMagicItems}
						onKeyPress={() => null}
						role="button"
						aria-label="Toggle Magic Items"
						tabIndex={0}>
						<Icon path={magicItems ? mdiEye : mdiEyeOff} className="w-6" />
						<span className="hidden xs:inline-flex sm:hidden md:inline-flex">Magic Items</span>
					</button>
				)}
				<div className="join hidden xs:flex">
					<button
						className={twMerge("join-item btn sm:btn-sm", display == "list" ? "btn-primary" : "hover:btn-primary")}
						onClick={() => setDisplay("list")}
						onKeyPress={() => null}
						aria-label="List View">
						<Icon path={mdiFormatListText} className="w-4" />
					</button>
					<button
						className={twMerge("join-item btn sm:btn-sm", display == "grid" ? "btn-primary" : "hover:btn-primary")}
						onClick={() => setDisplay("grid")}
						onKeyPress={() => null}
						aria-label="Grid View">
						<Icon path={mdiViewGrid} className="w-4" />
					</button>
				</div>
			</div>

			<div className={twMerge("w-full overflow-x-auto rounded-lg", display == "grid" && "block xs:hidden")}>
				<div className={twMerge("grid-table", mobile ? "grid-characters-mobile sm:grid-characters-mobile-sm" : "grid-characters-mobile sm:grid-characters")}>
					<header className="!hidden sm:!contents">
						{!mobile && <div className="hidden sm:block" />}
						<div>Name</div>
						<div>Campaign</div>
						<div className="text-center">Tier</div>
						<div className="text-center">Level</div>
					</header>
					{results.map(character => (
						<Link href={`/characters/${character.id}`} className="img-grow" key={character.id}>
							{!mobile && (
								<div className="hidden pr-0 transition-colors sm:block sm:pr-2">
									<div className="avatar">
										<div className="mask mask-squircle h-12 w-12 bg-primary">
											{character.image_url ? (
												<LazyImage
													src={character.image_url}
													width={48}
													height={48}
													className="h-full w-full object-cover object-top transition-all hover:scale-125"
													alt={character.name}
													ioParams={{ rootMargin: "100px" }}
												/>
											) : (
												<Icon path={mdiAccount} className="w-12" />
											)}
										</div>
									</div>
								</div>
							)}
							<div>
								<div className="whitespace-pre-wrap text-base font-bold text-accent-content sm:text-xl">
									<SearchResults text={character.name} search={search} />
								</div>
								<div className="whitespace-pre-wrap text-xs sm:text-sm">
									<span className="inline pr-1 sm:hidden">Level {character.total_level}</span>
									<SearchResults text={character.race} search={search} /> <SearchResults text={character.class} search={search} />
								</div>
								<div className="mb-2 block text-xs sm:hidden">
									<p>
										<SearchResults text={character.campaign} search={search} />
									</p>
								</div>
								{(character.match.includes("magicItems") || magicItems) && character.magic_items.length > 0 && (
									<div className="mb-2">
										<p className="font-semibold">Magic Items:</p>
										<SearchResults text={character.magic_items.map(item => item.name)} search={search} />
									</div>
								)}
							</div>
							<div className="hidden transition-colors sm:flex">
								<SearchResults text={character.campaign} search={search} />
							</div>
							<div className="hidden justify-center transition-colors sm:flex">{character.tier}</div>
							<div className="hidden justify-center transition-colors sm:flex">{character.total_level}</div>
						</Link>
					))}
				</div>
			</div>

			{[1, 2, 3, 4].map(
				tier =>
					results.filter(c => c.tier == tier).length > 0 && (
						<Fragment key={tier}>
							<h1 className={twMerge("text-2xl font-bold dark:text-white", display == "list" && "hidden", display == "grid" && "hidden xs:block")}>
								Tier {tier}
							</h1>

							<div
								className={twMerge(
									"w-full",
									display == "list" && "hidden",
									display == "grid" && "hidden grid-cols-2 gap-4 xs:grid sm:grid-cols-3 md:grid-cols-4"
								)}>
								{results
									.filter(c => c.tier == tier)
									.map(character => {
										const miMatches = msResults.find(
											result => result.id == character.id && result.terms.find(term => result.match[term].includes("magicItems"))
										);
										return (
											<Link href={`/characters/${character.id}`} className="img-grow card card-compact bg-base-100 shadow-xl" key={character.id}>
												<figure className="relative aspect-square overflow-hidden">
													{character.image_url ? (
														<LazyImage
															src={character.image_url}
															className="h-full w-full object-cover object-top"
															alt={character.name}
															ioParams={{ rootMargin: "100px" }}
														/>
													) : (
														<Icon path={mdiAccount} className="h-full w-full object-cover object-top" />
													)}
													{search.length >= 1 && indexed.length > 0 && miMatches && (
														<div className="absolute inset-0 flex items-center bg-black/50 p-2 text-center text-xs text-white">
															<div className="flex-1">
																<SearchResults text={character.magic_items.map(item => item.name)} search={search} filtered />
															</div>
														</div>
													)}
												</figure>
												<div className="card-body text-center">
													<div className="flex flex-col gap-1">
														<h2 className="card-title block overflow-hidden text-ellipsis whitespace-nowrap text-sm dark:text-white">
															<SearchResults text={character.name} search={search} />
														</h2>
														<p className="text-xs">
															<SearchResults text={`${character.race} ${character.class}`} search={search} />
														</p>
														<p className="text-xs">
															Level {character.total_level} | Tier {character.tier}
														</p>
													</div>
												</div>
											</Link>
										);
									})}
							</div>
						</Fragment>
					)
			)}
		</>
	);
}

const logSearch = new MiniSearch({
	fields: ["logName", "magicItems", "storyAwards"],
	idField: "logId",
	processTerm: term => (stopWords.has(term) ? null : term.toLowerCase()),
	searchOptions: {
		prefix: true
	}
});

export function CharacterLogTable({
	character,
	userId,
	cookie,
	deleteLog
}: {
	character: CharacterData;
	userId: string;
	cookie: { name: string; value: CharacterCookie };
	deleteLog: (logId: string) => DeleteLogResult;
}) {
	const myCharacter = character.userId === userId;
	const [search, setSearch] = useState("");
	const [descriptions, setDescriptions] = useState(cookie.value.descriptions);
	const [modal, setModal] = useState<{
		name: string;
		description: string;
		date?: Date;
	} | null>(null);

	const logs = useMemo(() => {
		let level = 1;
		return character
			? character.logs.map(log => {
					const level_gained = character.log_levels.find(gl => gl.id === log.id);
					if (level_gained) level += level_gained.levels;
					return {
						...log,
						level_gained: level_gained?.levels || 0,
						total_level: level,
						score: 0
					};
			  })
			: [];
	}, [character]);

	const indexed = useMemo(() => {
		return logs.map(log => ({
			logId: log.id,
			logName: log.name,
			magicItems: [...log.magic_items_gained.map(item => item.name), ...log.magic_items_lost.map(item => item.name)].join(", "),
			storyAwards: [...log.story_awards_gained.map(item => item.name), ...log.story_awards_lost.map(item => item.name)].join(", ")
		}));
	}, [logs]);

	useEffect(() => {
		if (indexed.length) logSearch.addAll(indexed);
		return () => logSearch.removeAll();
	}, [indexed]);

	const toggleDescriptions = useCallback(() => {
		setCookie(cookie.name, { ...cookie.value, descriptions: !descriptions });
		setDescriptions(!descriptions);
	}, [descriptions, cookie]);

	useEffect(() => {
		setCookie(cookie.name, cookie.value);
	}, [cookie]);

	const results = useMemo(() => {
		if (logs.length) {
			if (search.length > 1) {
				const results = logSearch.search(search);
				return logs
					.filter(log => results.find(result => result.id === log.id))
					.map(log => ({
						...log,
						score: results.find(result => result.id === log.id)?.score || 0 - log.date.getTime()
					}))
					.sort((a, b) => sorter(a.date, b.date));
			} else {
				return logs.sort((a, b) => sorter(a.date, b.date));
			}
		} else {
			return [];
		}
	}, [search, logs]);

	return (
		<>
			<div className="mt-4 flex flex-wrap gap-2">
				<div className="flex w-full gap-2 print:hidden sm:max-w-md">
					{myCharacter && (
						<Link href={`/characters/${character.id}/log/new`} className="btn-primary btn hidden sm:btn-sm sm:inline-flex sm:px-3" aria-label="New Log">
							New Log
						</Link>
					)}
					{logs.length > 0 && (
						<input
							type="text"
							placeholder="Search"
							onChange={e => setSearch(e.target.value)}
							className="input-bordered input min-w-0 flex-1 sm:input-sm sm:max-w-xs"
						/>
					)}
					{myCharacter && (
						<>
							<Link href={`/characters/${character.id}/log/new`} className="btn-primary btn sm:btn-sm sm:hidden sm:px-3" aria-label="New Log">
								<Icon path={mdiPlus} className="w-6" />
							</Link>
							<button
								className={twMerge("btn sm:hidden", descriptions && "btn-primary")}
								onClick={toggleDescriptions}
								onKeyPress={() => {}}
								role="button"
								aria-label="Toggle Notes"
								tabIndex={0}>
								<Icon path={descriptions ? mdiEye : mdiEyeOff} className="w-6" />
							</button>
						</>
					)}
				</div>
				{logs.length > 0 && (
					<>
						<div className="hidden flex-1 sm:block" />
						<button
							className={twMerge("btn hidden sm:btn-sm sm:inline-flex", descriptions && "btn-primary")}
							onClick={toggleDescriptions}
							onKeyPress={() => {}}
							role="button"
							aria-label="Toggle Notes"
							tabIndex={0}>
							<Icon path={descriptions ? mdiEye : mdiEyeOff} className="w-6" />
							<span className="hidden sm:inline-flex">Notes</span>
						</button>
					</>
				)}
			</div>

			<section className="mt-4">
				<div className="w-full overflow-x-auto rounded-lg bg-base-100">
					<table className="table w-full">
						<thead>
							<tr className="bg-base-300">
								<td className="print:p-2">Log Entry</td>
								<td className="hidden print:table-cell print:p-2 sm:table-cell">Advancement</td>
								<td className="hidden print:table-cell print:p-2 sm:table-cell">Treasure</td>
								<td className="hidden print:!hidden md:table-cell">Story Awards</td>
								{myCharacter && <td className="print:hidden" />}
							</tr>
						</thead>
						<tbody>
							{results.map(log => (
								<CharacterLogRow
									log={log}
									search={search}
									characterUserId={character.userId}
									userId={userId}
									descriptions={descriptions}
									deleteLog={deleteLog}
									key={log.id}
									triggerModal={() =>
										log.description &&
										!descriptions &&
										setModal({
											name: log.name,
											description: log.description,
											date: log.date
										})
									}
								/>
							))}
						</tbody>
					</table>
				</div>
			</section>

			<div className={twMerge("modal cursor-pointer", modal && "modal-open")} onClick={() => setModal(null)}>
				{modal && (
					<div className="modal-box relative cursor-default drop-shadow-lg" onClick={e => e.stopPropagation()}>
						<h3 className="cursor-text text-lg font-bold text-accent-content">{modal.name}</h3>
						{modal.date && (
							<p className="cursor-text text-xs" suppressHydrationWarning>
								{modal.date.toLocaleString()}
							</p>
						)}
						<Markdown className="cursor-text whitespace-pre-wrap pt-4 text-xs sm:text-sm">{modal.description}</Markdown>
					</div>
				)}
			</div>
		</>
	);
}

const CharacterLogRow = ({
	log,
	characterUserId,
	userId,
	descriptions,
	deleteLog,
	search,
	triggerModal
}: {
	log: CharacterData["logs"][0] & { level_gained: number; total_level: number };
	characterUserId: string;
	userId: string;
	descriptions: boolean;
	deleteLog: (logId: string) => DeleteLogResult;
	search: string;
	triggerModal: () => void;
}) => {
	const [isPending, startTransition] = useTransition();
	const [deleting, setDeleting] = useState(false);
	const myCharacter = characterUserId === userId;

	useEffect(() => {
		if (!isPending && deleting) {
			setTimeout(() => setDeleting(false), 1000);
		}
	}, [deleting, isPending]);

	return (
		<>
			<tr className={twMerge("border-b-0 border-t-2 border-t-base-200 print:text-sm", deleting && "hidden", (log.saving || isPending) && "opacity-40")}>
				<td
					className={twMerge(
						"!static pb-0 align-top print:p-2 sm:pb-3",
						(!descriptions || !log.description) && "pb-3",
						log.saving && "bg-neutral-focus",
						(log.description?.trim() || log.story_awards_gained.length > 0 || log.story_awards_lost.length > 0) && "border-b-0"
					)}>
					<div
						className="whitespace-pre-wrap font-semibold text-accent-content"
						onClick={() => triggerModal()}
						onKeyPress={() => {}}
						role="button"
						tabIndex={0}>
						<SearchResults text={log.name} search={search} />
					</div>
					<p className="text-netural-content mb-2 whitespace-nowrap text-xs font-normal">
						{new Date(log.is_dm_log && log.applied_date ? log.applied_date : log.date).toLocaleString()}
					</p>
					{log.dm && log.type === "game" && log.dm.uid !== userId && (
						<p className="text-sm font-normal">
							<span className="font-semibold">DM:</span>{" "}
							{myCharacter ? (
								<Link href="/dms/{log.dm.id}" className="text-secondary">
									{log.dm.name}
								</Link>
							) : (
								log.dm.name
							)}
						</p>
					)}
					<div className="table-cell font-normal print:hidden sm:hidden">
						{log.type === "game" && (
							<>
								{log.experience > 0 && (
									<p>
										<span className="font-semibold">Experience:</span>&nbsp;{log.experience}
									</p>
								)}
								{log.acp > 0 && (
									<p>
										<span className="font-semibold">ACP:</span> {log.acp}
									</p>
								)}
								<p>
									<span className="font-semibold">Levels:</span>&nbsp;{log.level_gained}&nbsp;({log.total_level})
								</p>
							</>
						)}
						{log.dtd !== 0 && (
							<p>
								<span className="font-semibold">Downtime&nbsp;Days:</span>&nbsp;{log.dtd}
							</p>
						)}
						{log.tcp !== 0 && (
							<p>
								<span className="font-semibold">TCP:</span> {log.tcp}
							</p>
						)}
						{log.gold !== 0 && (
							<p>
								<span className="font-semibold">Gold:</span> {log.gold.toLocaleString("en-US")}
							</p>
						)}
					</div>
				</td>
				<td
					className={twMerge(
						"hidden align-top print:table-cell print:p-2 sm:table-cell",
						log.saving && "bg-neutral-focus",
						(log.description?.trim() || log.story_awards_gained.length > 0 || log.story_awards_lost.length > 0) && "border-b-0"
					)}>
					{log.experience > 0 && (
						<p>
							<span className="font-semibold">Experience:</span>&nbsp;{log.experience}
						</p>
					)}
					{log.acp > 0 && (
						<p>
							<span className="font-semibold">ACP:</span> {log.acp}
						</p>
					)}
					{log.level_gained > 0 && (
						<p>
							<span className="font-semibold">Levels:</span>&nbsp;{log.level_gained}&nbsp;({log.total_level})
						</p>
					)}
					{log.dtd !== 0 && (
						<p>
							<span className="text-sm font-semibold">Downtime&nbsp;Days:</span>&nbsp;{log.dtd}
						</p>
					)}
				</td>
				<td
					className={twMerge(
						"hidden align-top print:table-cell print:p-2 sm:table-cell",
						log.saving && "bg-neutral-focus",
						(log.description?.trim() || log.story_awards_gained.length > 0 || log.story_awards_lost.length > 0) && "border-b-0"
					)}>
					{log.tcp !== 0 && (
						<p>
							<span className="font-semibold">TCP:</span> {log.tcp}
						</p>
					)}
					{log.gold !== 0 && (
						<p>
							<span className="font-semibold">Gold:</span> {log.gold.toLocaleString("en-US")}
						</p>
					)}
					{(log.magic_items_gained.length > 0 || log.magic_items_lost.length > 0) && (
						<div>
							<Items title="Magic Items" items={log.magic_items_gained} search={search} />
							<div className="whitespace-pre-wrap text-sm line-through">
								<SearchResults text={log.magic_items_lost.map(mi => mi.name).join(" | ")} search={search} />
							</div>
						</div>
					)}
				</td>
				<td
					className={twMerge(
						"hidden align-top print:!hidden md:table-cell",
						log.saving && "bg-neutral-focus",
						(log.description?.trim() || log.story_awards_gained.length > 0 || log.story_awards_lost.length > 0) && "border-b-0"
					)}>
					{(log.story_awards_gained.length > 0 || log.story_awards_lost.length > 0) && (
						<div>
							<Items items={log.story_awards_gained} search={search} />
							<div className="whitespace-pre-wrap text-sm line-through">
								<SearchResults text={log.story_awards_lost.map(mi => mi.name).join(" | ")} search={search} />
							</div>
						</div>
					)}
				</td>
				{myCharacter && (
					<td
						className={twMerge(
							"w-8 align-top print:hidden",
							log.saving && "bg-neutral-focus",
							(log.description?.trim() || log.story_awards_gained.length > 0 || log.story_awards_lost.length > 0) && "border-b-0"
						)}>
						<div className="flex flex-col justify-center gap-2">
							<Link
								href={`/characters/${log.characterId}/log/${log.id}`}
								className={twMerge("btn-primary btn sm:btn-sm", log.saving && "btn-disabled")}
								aria-label="Edit Log">
								<Icon path={mdiPencil} size={0.8} />
							</Link>
							<button
								className="btn-delete btn sm:btn-sm"
								disabled={isPending}
								type="button"
								aria-label="Delete Log"
								onClick={() => {
									if (confirm(`Are you sure you want to delete ${log.name}? This action cannot be reversed.`)) {
										setDeleting(true);
										startTransition(async () => {
											try {
												const result = await deleteLog(log.id);
												if (result.error) throw new Error(result.error);
											} catch (error) {
												if (error instanceof Error) alert(error.message);
												else alert("Something went wrong while deleting the log.");
											}
										});
									}
								}}>
								<Icon path={mdiTrashCan} size={0.8} />
							</button>
						</div>
					</td>
				)}
			</tr>
			{(log.description?.trim() || log.story_awards_gained.length > 0 || log.story_awards_lost.length > 0) && (
				<tr className={twMerge(!descriptions && "hidden print:table-row")}>
					<td
						colSpan={100}
						className={twMerge("max-w-[calc(100vw_-_50px)] whitespace-pre-wrap pt-0 text-sm print:p-2 print:text-xs", log.saving && "bg-neutral-focus")}>
						<h4 className="text-base font-semibold">Notes:</h4>
						<Markdown>{log.description || ""}</Markdown>
						{(log.story_awards_gained.length > 0 || log.story_awards_lost.length > 0) && (
							<div>
								{log.story_awards_gained.map(mi => (
									<div key={mi.id} className="whitespace-pre-wrap text-sm">
										<span className="pr-2 font-semibold print:block">
											{mi.name}
											{mi.description ? ":" : ""}
										</span>
										<Markdown>{mi.description || ""}</Markdown>
									</div>
								))}
								<p className="whitespace-pre-wrap text-sm line-through">{log.story_awards_lost.map(mi => mi.name).join(" | ")}</p>
							</div>
						)}
					</td>
				</tr>
			)}
		</>
	);
};

const dmLogSearch = new MiniSearch({
	fields: ["logName", "characterName", "magicItems", "storyAwards"],
	idField: "logId",
	searchOptions: {
		boost: { logName: 2 },
		prefix: true
	}
});

export function DMLogTable({ logs, deleteLog }: { logs: (DMLogData[0] & { dateString: string })[]; deleteLog: (log: DMLogData[0]) => DeleteLogResult }) {
	const [search, setSearch] = useState("");
	const [modal, setModal] = useState<{ name: string; description: string; date?: Date } | null>(null);

	const indexed = useMemo(() => {
		return logs
			? logs.map(log => ({
					logId: log.id,
					logName: log.name,
					characterName: log.character?.name || "",
					magicItems: [...log.magic_items_gained.map(item => item.name), ...log.magic_items_lost.map(item => item.name)].join(", "),
					storyAwards: [...log.story_awards_gained.map(item => item.name), ...log.story_awards_lost.map(item => item.name)].join(", ")
			  }))
			: [];
	}, [logs]);

	useEffect(() => {
		if (indexed.length) dmLogSearch.addAll(indexed);
		return () => dmLogSearch.removeAll();
	}, [indexed]);

	const results = useMemo(() => {
		if (logs.length) {
			if (search.length > 1) {
				const results = dmLogSearch.search(search);
				return logs
					.filter(log => results.find(result => result.id === log.id))
					.map(log => ({
						...log,
						score: results.find(result => result.id === log.id)?.score || 0 - log.date.getTime()
					}))
					.sort((a, b) => a.date.getTime() - b.date.getTime());
			} else {
				return logs.sort((a, b) => a.date.getTime() - b.date.getTime());
			}
		} else {
			return [];
		}
	}, [search, logs]);

	return (
		<>
			<div className="flex gap-4">
				<input type="text" placeholder="Search" onChange={e => setSearch(e.target.value)} className="input-bordered input input-sm w-full sm:max-w-xs" />
			</div>

			<section>
				<div className="w-full overflow-x-auto rounded-lg bg-base-100">
					<table className="table w-full">
						<thead>
							<tr className="bg-base-300">
								<th className="table-cell print:hidden sm:hidden">Game</th>
								<th className="hidden print:table-cell sm:table-cell">Title</th>
								<th className="hidden print:table-cell sm:table-cell">Advancement</th>
								<th className="hidden print:table-cell sm:table-cell">Treasure</th>
								<th className="hidden print:!hidden sm:table-cell">Story Awards</th>
								<th className="print:hidden"></th>
							</tr>
						</thead>
						<tbody>
							{logs.length == 0 ? (
								<tr>
									<td colSpan={5} className="py-20 text-center">
										<p className="mb-4">You have no DM logs.</p>
										<p>
											<Link href="/dm-logs/new" className="btn-primary btn">
												Create one now
											</Link>
										</p>
									</td>
								</tr>
							) : (
								results.map(log => (
									<DMLogRow
										key={log.id}
										log={log}
										search={search}
										triggerModal={() => log.description && setModal({ name: log.name, description: log.description, date: log.date })}
										deleteLog={deleteLog}
									/>
								))
							)}
						</tbody>
					</table>
				</div>

				<label className={twMerge("modal cursor-pointer", modal && "modal-open")} onClick={() => setModal(null)}>
					{modal && (
						<label className="modal-box relative">
							<h3 className="text-lg font-bold text-accent-content">{modal.name}</h3>
							{modal.date && <p className="text-xs">{modal.date.toLocaleString()}</p>}
							<Markdown className="whitespace-pre-wrap pt-4 text-xs sm:text-sm">{modal.description}</Markdown>
						</label>
					)}
				</label>
			</section>
		</>
	);
}

const DMLogRow = ({
	log,
	deleteLog,
	search,
	triggerModal
}: {
	log: DMLogData[0] & { dateString: string };
	deleteLog: (log: DMLogData[0]) => DeleteLogResult;
	search: string;
	triggerModal: () => void;
}) => {
	const [isPending, startTransition] = useTransition();
	const [deleting, setDeleting] = useState(false);

	useEffect(() => {
		if (!isPending && deleting) {
			setTimeout(() => setDeleting(false), 1000);
		}
	}, [deleting, isPending]);

	return (
		<>
			<tr className={twMerge(deleting && "hidden", isPending && "opacity-40")}>
				<th
					className={twMerge(
						"!static align-top",
						(log.description?.trim() || log.story_awards_gained.length > 0 || log.story_awards_lost.length > 0) && "print:border-b-0"
					)}>
					<p className="whitespace-pre-wrap font-semibold text-accent-content" onClick={() => triggerModal()}>
						<SearchResults text={log.name} search={search} />
					</p>
					<p className="text-netural-content text-xs font-normal">{log.dateString}</p>
					{log.character && (
						<p className="text-sm font-normal">
							<span className="font-semibold">Character:</span>{" "}
							<Link href={`/characters/${log.character.id}`} className="text-secondary">
								<SearchResults text={log.character.name} search={search} />
							</Link>
						</p>
					)}
					<div className="table-cell font-normal print:hidden sm:hidden">
						{log.type === "game" && (
							<>
								{log.experience > 0 && (
									<p>
										<span className="font-semibold">Experience:</span> {log.experience}
									</p>
								)}
								{log.acp > 0 && (
									<p>
										<span className="font-semibold">ACP:</span> {log.acp}
									</p>
								)}
								{log.level > 0 && (
									<p>
										<span className="font-semibold">Level:</span> {log.level}
									</p>
								)}
							</>
						)}
						{log.dtd !== 0 && (
							<p>
								<span className="font-semibold">Downtime Days:</span> {log.dtd}
							</p>
						)}
						{log.tcp !== 0 && (
							<p>
								<span className="font-semibold">TCP:</span> {log.tcp}
							</p>
						)}
						{log.gold !== 0 && (
							<p>
								<span className="font-semibold">Gold:</span> {log.gold.toLocaleString("en-US")}
							</p>
						)}
						<div>
							<Items title="Magic Items" items={log.magic_items_gained} search={search} />
						</div>
					</div>
				</th>
				<td
					className={twMerge(
						"hidden align-top print:table-cell sm:table-cell",
						(log.description?.trim() || log.story_awards_gained.length > 0 || log.story_awards_lost.length > 0) && "print:border-b-0"
					)}>
					{log.type === "game" && (
						<>
							{log.experience > 0 && (
								<p>
									<span className="font-semibold">Experience:</span> {log.experience}
								</p>
							)}
							{log.acp > 0 && (
								<p>
									<span className="font-semibold">ACP:</span> {log.acp}
								</p>
							)}
							{log.level > 0 && (
								<p>
									<span className="font-semibold">Level:</span> {log.level}
								</p>
							)}
							{log.dtd !== 0 && (
								<p>
									<span className="text-sm font-semibold">Downtime Days:</span> {log.dtd}
								</p>
							)}
						</>
					)}
				</td>
				<td
					className={twMerge(
						"hidden align-top print:table-cell sm:table-cell",
						(log.description?.trim() || log.story_awards_gained.length > 0 || log.story_awards_lost.length > 0) && "print:border-b-0"
					)}>
					{log.tcp !== 0 && (
						<p>
							<span className="font-semibold">TCP:</span> {log.tcp}
						</p>
					)}
					{log.gold !== 0 && (
						<p>
							<span className="font-semibold">Gold:</span> {log.gold.toLocaleString("en-US")}
						</p>
					)}
					{log.magic_items_gained.length > 0 && (
						<div>
							<Items title="Magic Items" items={log.magic_items_gained} search={search} />
						</div>
					)}
				</td>
				<td
					className={twMerge(
						"hidden align-top print:!hidden md:table-cell",
						(log.description?.trim() || log.story_awards_gained.length > 0) && "print:border-b-0"
					)}>
					{log.story_awards_gained.length > 0 && (
						<div>
							<Items items={log.story_awards_gained} search={search} />
						</div>
					)}
				</td>
				<td className="w-8 print:hidden">
					<div className="flex flex-col justify-center gap-2">
						<Link href={`/dm-logs/${log.id}`} className="btn-primary btn-sm btn">
							<Icon path={mdiPencil} size={0.8} />
						</Link>
						<button
							className="btn-sm btn"
							onClick={e => {
								if (confirm(`Are you sure you want to delete ${log.name}? This action cannot be reversed.`)) {
									setDeleting(true);
									startTransition(async () => {
										try {
											const result = await deleteLog(log);
											if (result.error) throw new Error(result.error);
										} catch (error) {
											if (error instanceof Error) alert(error.message);
											else alert("Something went wrong while deleting the log.");
										}
									});
								}
							}}>
							<Icon path={mdiTrashCan} size={0.8} />
						</button>
					</div>
				</td>
			</tr>
			{(log.description?.trim() || log.story_awards_gained.length > 0 || log.story_awards_lost.length > 0) && (
				<tr className={twMerge("hidden print:table-row", deleting && "hidden", isPending && "opacity-40")}>
					<td colSpan={3} className="pt-0">
						<p className="text-sm">
							<span className="font-semibold">Notes:</span> {log.description}
						</p>
						{log.story_awards_gained.length > 0 && (
							<div>
								{log.story_awards_gained.map(mi => (
									<p key={mi.id} className="text-sm">
										<span className="font-semibold">
											{mi.name}
											{mi.description ? ":" : ""}
										</span>{" "}
										{mi.description}
									</p>
								))}
							</div>
						)}
					</td>
				</tr>
			)}
		</>
	);
};

export function DMTable({ dms, deleteDM }: { dms: UserDMsWithLogs; deleteDM: (dm: UserDMsWithLogs[0]) => DeleteDMResult }) {
	return (
		<div className="flex flex-col gap-4">
			<section>
				<div className="w-full overflow-x-auto rounded-lg bg-base-100">
					<table className="table w-full">
						<thead>
							<tr className="bg-base-300">
								<th className="">Name</th>
								<th className="">DCI</th>
								<th className="">Logs</th>
								<th className="print:hidden"></th>
							</tr>
						</thead>
						<tbody>
							{!dms || dms.length == 0 ? (
								<tr>
									<td colSpan={4} className="py-20 text-center">
										<p className="mb-4">You have no DMs.</p>
									</td>
								</tr>
							) : (
								dms.map(dm => <DMTableRow key={dm.id} dm={dm} deleteDM={deleteDM} />)
							)}
						</tbody>
					</table>
				</div>
			</section>
		</div>
	);
}

const DMTableRow = ({ dm, deleteDM }: { dm: UserDMsWithLogs[0]; deleteDM: (dm: UserDMsWithLogs[0]) => DeleteDMResult }) => {
	const [isPending, startTransition] = useTransition();
	const [deleting, setDeleting] = useState(false);

	useEffect(() => {
		if (!isPending && deleting) {
			setTimeout(() => setDeleting(false), 1000);
		}
	}, [deleting, isPending]);

	return (
		<tr key={dm.id} className={twMerge(deleting && "hidden", isPending && "opacity-40")}>
			<td>{dm.name}</td>
			<td>{dm.DCI}</td>
			<td>{dm.logs.length}</td>
			<td className="w-16 print:hidden">
				<div className="flex flex-row justify-center gap-2">
					<Link href={`/dms/${dm.id}`} className="btn-primary btn-sm btn">
						<Icon path={mdiPencil} size={0.8} />
					</Link>
					{dm.logs.length == 0 && (
						<button
							className="btn-sm btn"
							onClick={async () => {
								if (confirm(`Are you sure you want to delete ${dm.name}? This action cannot be reversed.`)) {
									setDeleting(true);
									startTransition(async () => {
										const result = await deleteDM(dm);
										if (result.error) {
											alert(result.error);
											setDeleting(false);
										}
									});
								}
							}}>
							<Icon path={mdiTrashCan} size={0.8} />
						</button>
					)}
				</div>
			</td>
		</tr>
	);
};
