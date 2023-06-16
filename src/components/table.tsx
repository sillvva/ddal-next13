"use client";

import type { DeleteLogResult } from "$src/server/actions/log";
import { setCookie } from "$src/lib/misc";
import { DeleteDMResult } from "$src/server/actions/dm";
import { UserDMsWithLogs } from "$src/server/db/dms";
import { DMLogData } from "$src/server/db/log";
import MiniSearch from "minisearch";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CSSProperties, useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { twMerge } from "tailwind-merge";
import { mdiPencil, mdiPlus, mdiTrashCan } from "@mdi/js";
import Icon from "@mdi/react";
import { Items } from "./items";
import { Markdown } from "./markdown";
import { SearchResults } from "./search";

import type { CharacterData, CharactersData } from "$src/server/db/characters";
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
	revalidate
}: {
	characters: CharactersData;
	cookie: { name: string; value: CharactersCookie };
	revalidate: () => Promise<void>;
}) {
	const [search, setSearch] = useState("");
	const [magicItems, setMagicItems] = useState(cookie.value.magicItems);
	const router = useRouter();

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

	const results = useMemo(() => {
		if (characters && indexed.length) {
			if (search.length > 1) {
				const results = charactersSearch.search(search);
				return characters
					.filter(character => results.find(result => result.id === character.id))
					.map(character => ({
						...character,
						score: results.find(result => result.id === character.id)?.score || character.name,
						match: Object.entries(results.find(result => result.id === character.id)?.match || {})
							.map(([, value]) => value[0] || "")
							.filter(v => !!v)
					}))
					.sort((a, b) => a.total_level - b.total_level || a.name.localeCompare(b.name));
			} else {
				return characters
					.sort((a, b) => a.total_level - b.total_level || a.name.localeCompare(b.name))
					.map(character => ({ ...character, score: 0, match: [] }));
			}
		} else {
			return [];
		}
	}, [indexed, search, characters]);

	const toggleMagicItems = useCallback(() => {
		setCookie(cookie.name, { ...cookie.value, magicItems: !magicItems });
		setMagicItems(!magicItems);
		revalidate();
	}, [magicItems, cookie, revalidate]);

	useEffect(() => {
		setCookie(cookie.name, cookie.value);
	}, [cookie]);

	return (
		<>
			<div className="flex gap-4">
				<input
					type="text"
					placeholder="Search by name, race, class, items, etc."
					onChange={e => setSearch(e.target.value)}
					className="input-bordered input input-sm w-full max-w-xs"
				/>
				<div className="form-control">
					<label className="label cursor-pointer py-1">
						<span className="label-text hidden pr-4 sm:inline">Items</span>
						<input type="checkbox" className="toggle-primary toggle" checked={magicItems} onChange={toggleMagicItems} />
					</label>
				</div>
			</div>

			<div className="w-full overflow-x-auto rounded-lg">
				<table className="table-compact table w-full">
					<thead className="hidden sm:table-header-group">
						<tr className="bg-base-200">
							<th className="w-12"></th>
							<th>Name</th>
							<th>Campaign</th>
							<th className="text-center">Tier</th>
							<th className="text-center">Level</th>
						</tr>
					</thead>
					<tbody>
						{!characters || characters.length == 0 ? (
							<tr className="bg-base-100">
								<td colSpan={5} className="py-20 text-center">
									<p className="mb-4">You have no log sheets.</p>
									<p>
										<Link href="/characters/new" className="btn-primary btn">
											Create one now
										</Link>
									</p>
								</td>
							</tr>
						) : (
							results.map(character => (
								<tr key={character.id} className="img-grow hover cursor-pointer bg-base-100" onClick={() => router.push(`/characters/${character.id}`)}>
									<td className="w-12 pr-0 transition-colors sm:pr-2">
										<div className="avatar">
											<div className="mask mask-squircle h-12 w-12 bg-primary">
												{/* eslint-disable-next-line @next/next/no-img-element */}
												<img
													src={character.image_url || ""}
													width={48}
													height={48}
													className="h-full w-full object-cover object-top transition-all hover:scale-125"
													alt={character.name}
												/>
											</div>
										</div>
									</td>
									<td className="transition-colors">
										<div className="flex flex-col">
											<Link href={`/characters/${character.id}`} className="whitespace-pre-wrap text-base font-bold text-accent-content sm:text-xl">
												<SearchResults text={character.name} search={search} />
											</Link>
											<div className="whitespace-pre-wrap text-xs sm:text-sm">
												<span className="inline pr-1 sm:hidden">Level {character.total_level}</span>
												<SearchResults text={character.race} search={search} /> <SearchResults text={character.class} search={search} />
											</div>
											<div className="mb-2 block text-xs sm:hidden">
												<p>
													<SearchResults text={character.campaign} search={search} />
												</p>
											</div>
											{(character.match.includes("magicItems") || magicItems) && !!character.magic_items.length && (
												<div className=" mb-2 whitespace-pre-wrap">
													<p className="font-semibold">Magic Items:</p>
													<SearchResults text={character.magic_items.map(item => item.name).join(" | ")} search={search} />
												</div>
											)}
										</div>
									</td>
									<td className="hidden transition-colors sm:table-cell">
										<SearchResults text={character.campaign} search={search} />
									</td>
									<td className="hidden text-center transition-colors sm:table-cell">{character.tier}</td>
									<td className="hidden text-center transition-colors sm:table-cell">{character.total_level}</td>
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>
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
	deleteLog,
	revalidate
}: {
	character: CharacterData;
	userId: string;
	cookie: { name: string; value: CharacterCookie };
	deleteLog: (logId: string) => DeleteLogResult;
	revalidate: () => Promise<void>;
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
		revalidate();
	}, [descriptions, cookie, revalidate]);

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
			<div className="mt-4 flex">
				<div className="flex gap-4 print:hidden">
					{myCharacter && (
						<Link href={`/characters/${character.id}/log/new`} className="btn-primary btn-sm btn px-2 sm:px-3">
							<span className="hidden sm:inline">New Log</span>
							<Icon path={mdiPlus} size={1} className="inline sm:hidden" />
						</Link>
					)}
					{logs && (
						<>
							<input type="text" placeholder="Search" onChange={e => setSearch(e.target.value)} className="input-bordered input input-sm w-full sm:max-w-xs" />
							{myCharacter && (
								<div className="form-control">
									<label className="label cursor-pointer py-1">
										<span className="label-text hidden pr-4 sm:inline">Notes</span>
										<input type="checkbox" className="toggle-primary toggle" checked={descriptions} onChange={toggleDescriptions} />
									</label>
								</div>
							)}
						</>
					)}
				</div>
			</div>
			{logs ? (
				<section className="mt-4">
					<div className="w-full overflow-x-auto rounded-lg bg-base-100">
						<table className="table w-full">
							<thead>
								<tr className="bg-base-300">
									<td className="print:p-2">Log Entry</td>
									<td className="hidden print:table-cell print:p-2 sm:table-cell">Advancement</td>
									<td className="hidden print:table-cell print:p-2 sm:table-cell">Treasure</td>
									<td className="hidden print:!hidden md:table-cell">Story Awards</td>
									{myCharacter && <td className="print:hidden"></td>}
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
			) : (
				<div className="flex h-96 w-full items-center justify-center">
					<div className="radial-progress animate-spin text-secondary" style={{ "--value": 20 } as CSSProperties} />
				</div>
			)}

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
						"!static align-top print:p-2",
						log.saving && "bg-neutral-focus",
						(log.description?.trim() || log.story_awards_gained.length > 0 || log.story_awards_lost.length > 0) && "border-b-0"
					)}>
					<p className="whitespace-pre-wrap font-semibold text-accent-content" onClick={triggerModal}>
						<SearchResults text={log.name} search={search} />
					</p>
					<p className="text-netural-content mb-2 text-xs font-normal" suppressHydrationWarning>
						{new Date(log.is_dm_log && log.applied_date ? log.applied_date : log.date).toLocaleString()}
					</p>
					{log.dm && log.type === "game" && log.dm.uid !== characterUserId && (
						<p className="text-sm font-normal">
							<span className="font-semibold">DM:</span> {log.dm.name}
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
						<div>
							<Items title="Magic Items" items={log.magic_items_gained} search={search} />
							<p className="whitespace-pre-wrap text-sm line-through">
								<SearchResults text={log.magic_items_lost.map(mi => mi.name).join(" | ")} search={search} />
							</p>
						</div>
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
							<Link href={`/characters/${log.characterId}/log/${log.id}`} className={twMerge("btn-primary btn-sm btn", log.saving && "btn-disabled")}>
								<Icon path={mdiPencil} size={0.8} />
							</Link>
							<button
								className="btn-sm btn"
								disabled={isPending}
								type="button"
								onClick={e => {
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
