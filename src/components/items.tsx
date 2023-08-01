"use client";

import { Markdown } from "$src/components/markdown";
import { sorter } from "$src/lib/utils";
import { useCallback, useMemo, useState } from "react";
import { twMerge } from "tailwind-merge";
import { mdiChevronDown, mdiChevronUp } from "@mdi/js";
import Icon from "@mdi/react";
import { SearchResults } from "./search";

import type { MagicItem, StoryAward } from "@prisma/client";
export function Items({
	items,
	title = "",
	formatting = false,
	search = "",
	collapsible = false,
	sort = false
}: {
	title?: string;
	items: (MagicItem | StoryAward)[];
	formatting?: boolean;
	search?: string;
	collapsible?: boolean;
	sort?: boolean;
}) {
	const [modal, setModal] = useState<{ name: string; description: string; date?: Date } | null>(null);
	const [collapsed, setCollapsed] = useState(collapsible);

	const itemsMap = useMemo(() => new Map<string, number>(), []);

	const sorterName = useCallback(
		(name: string) =>
			sort
				? name
						.replace(/^\d+x? ?/, "")
						.replace("Spell Scroll", "Scroll")
						.replace(/^(\w+)s/, "$1")
						.replace(/^(A|An|The) /, "")
				: name,
		[sort]
	);
	const isConsumable = useCallback((name: string) => name.trim().match(/^(\d+x? )?((Potion|Scroll|Spell Scroll|Charm|Elixir)s? of)/), []);
	const itemQty = useCallback((item: { name: string }) => parseInt(item.name.match(/^(\d+)x? /)?.[1] || "1"), []);
	const clearQty = useCallback((name: string) => name.replace(/^\d+x? ?/, ""), []);

	const clonedItems = useMemo(() => structuredClone(items), [items]);

	const consolidatedItems = useMemo(
		() =>
			clonedItems
				.map((item, index) => {
					const name = clearQty(item.name);
					const desc = item.description?.trim();
					const key = `${name}_${desc}`;
					const qty = itemQty(item);
					const cons = isConsumable(sorterName(name));

					return {
						name,
						desc,
						qty,
						index,
						cons,
						key
					};
				})
				.reduce((acc, { name, qty, key, index, cons }) => {
					const existingIndex = itemsMap.get(key);
					if (existingIndex && existingIndex >= 0) {
						const existingQty = itemQty(acc[existingIndex]);

						const newQty = existingQty + qty;
						let newName = name;
						if (cons) newName = newName.replace(/^(\w+)s/, "$1");

						if (newQty > 1) {
							if (cons) newName = newName.replace(/^(\w+)( .+)$/, "$1s$2");
							acc[existingIndex].name = `${newQty} ${newName}`;
						} else {
							acc[existingIndex].name = newName;
						}
					} else {
						acc.push(clonedItems[index]);
						itemsMap.set(key, acc.length - 1);
					}

					return acc;
				}, [] as typeof items),
		[clonedItems, itemsMap, sorterName, itemQty, isConsumable, clearQty]
	);

	const sortedItems = useMemo(
		() => (sort ? consolidatedItems.sort((a, b) => sorter(sorterName(a.name), sorterName(b.name))) : consolidatedItems),
		[consolidatedItems, sort, sorterName]
	);

	return (
		<>
			<div className={twMerge("flex-1 flex-col", collapsible && !items.length ? "hidden md:flex" : "flex")}>
				{title && (
					<div role="presentation" onClick={collapsible ? () => setCollapsed(!collapsed) : () => {}} onKeyPress={() => {}}>
						<h4 className="flex text-left font-semibold">
							<span className="flex-1">{title}</span>
							{collapsible && <Icon path={collapsed ? mdiChevronUp : mdiChevronDown} className="ml-2 inline w-4 justify-self-end print:hidden md:hidden" />}
						</h4>
					</div>
				)}
				<p className={twMerge("divide-x divide-black/50 text-sm dark:divide-white/50 print:text-xs", collapsed ? "hidden print:inline md:inline" : "")}>
					{items.length
						? sortedItems.map(mi => (
								<span
									role={mi.description ? "button" : "presentation"}
									key={mi.id}
									className={twMerge("inline px-2 first:pl-0", mi.description && "text-secondary", formatting && isConsumable(mi.name) && "italic")}
									onClick={() => {
										if (mi.description) {
											setModal({ name: mi.name, description: mi.description });
										}
									}}
									onKeyPress={() => null}>
									<SearchResults text={mi.name} search={search || ""} />
								</span>
						  ))
						: "None"}
				</p>
			</div>
			<div className={twMerge("modal cursor-pointer", modal && "modal-open")} onClick={() => setModal(null)}>
				{modal && (
					<div className="modal-box relative cursor-default drop-shadow-lg" onClick={e => e.stopPropagation()}>
						<h3 className="cursor-text text-lg font-bold text-accent-content">{modal.name}</h3>
						{modal.date && <p className="text-xs">{modal.date.toLocaleString()}</p>}
						<Markdown className="cursor-text whitespace-pre-wrap pt-4 text-xs sm:text-sm">{modal.description}</Markdown>
					</div>
				)}
			</div>
		</>
	);
}
