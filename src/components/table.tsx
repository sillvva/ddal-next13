"use client";

import { getLocal, setLocal } from "$src/lib/store";
import { CharactersData } from "$src/server/db/characters";
import MiniSearch from "minisearch";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { SearchResults } from "./search";

let stopWords = new Set(["and", "or", "to", "in", "a", "the"]);
const minisearch = new MiniSearch({
	fields: ["characterName", "campaign", "race", "class", "magicItems", "tier", "level"],
	idField: "characterId",
	processTerm: term => (stopWords.has(term) ? null : term.toLowerCase()),
	searchOptions: {
		prefix: true
	}
});

export const CharactersTable = ({ characters }: { characters: CharactersData }) => {
	const [search, setSearch] = useState("");
	const [magicItems, setMagicItems] = useState(Boolean(getLocal("characters", "magicItems")));
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
		if (indexed.length) minisearch.addAll(indexed);
		return () => minisearch.removeAll();
	}, [indexed]);

	const results = useMemo(() => {
		if (characters && indexed.length) {
			if (search.length > 1) {
				const results = minisearch.search(search);
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
		setLocal("characters", "magicItems", !magicItems);
		setMagicItems(!magicItems);
	}, [magicItems]);

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
											{(character.match.includes("magicItems") || magicItems) && (
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
};
