"use client";

import { stopWords } from "$src/lib/utils";

export function SearchResults({
	text = "",
	search = "",
	filtered = false,
	separator = " | "
}: {
	text: string | string[] | null;
	search: string;
	filtered?: boolean;
	separator?: string;
}) {
	const terms = getSearchTerms(search);
	const regexes = getRegexesFromTerms(terms);
	const regex = getJoinedRegexFromTerms(terms);
	const items = getTextItems(text, filtered, regexes);
	const match = getMatchedItems(items, regex);
	const parts = getPartionedItems(items, match, regex);

	function getSearchTerms(search: string): string[] {
		return (search.length > 1 ? search : "")
			.replace(new RegExp(` ?\\b(${[...Array.from(stopWords)].join("|")})\\b ?`, "gi"), " ")
			.replace(/([^ a-z0-9])/gi, "\\$1")
			.trim()
			.split(" ")
			.filter(Boolean);
	}

	function getRegexesFromTerms(terms: string[]) {
		return terms.map(term => new RegExp(term, "gi"));
	}

	function getJoinedRegexFromTerms(terms: string[]) {
		return terms.length ? new RegExp(terms.join("|"), "gi") : null;
	}

	function getTextItems(text: string | string[] | null, filtered: boolean, regexes: RegExp[]) {
		return (Array.isArray(text) ? text : text?.split(separator) || []).filter(item => !filtered || regexes.every(regex => item.match(regex))).join(separator);
	}

	function getMatchedItems(items: string, regex: RegExp | null) {
		return regex && items.match(regex);
	}

	function getPartionedItems(items: string, match: RegExpMatchArray | null, regex: RegExp | null) {
		if (!match) return [];

		const splittedItems = regex ? items.split(regex) : [];

		for (let i = 1; i < splittedItems.length; i += 2) {
			splittedItems.splice(i, 0, match[(i - 1) / 2] || "");
		}

		return splittedItems;
	}

	if (!(parts.length && regex)) return items;

	return parts.map(part => (regex.test(part) ? <span className="bg-secondary px-1 text-black">{part}</span> : part));
}
