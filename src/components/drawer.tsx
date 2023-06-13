"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { twMerge } from "tailwind-merge";

import { mdiMenu } from "@mdi/js";
import Icon from "@mdi/react";

export const Drawer = () => {
	const [drawer, setDrawer] = useState(false);
	const [backdrop, setBackdrop] = useState(false);

	const toggleDrawer = useCallback((to: boolean) => {
		if (!to) {
			setDrawer(false);
			setTimeout(() => setBackdrop(false), 150);
		} else {
			setBackdrop(true);
			setDrawer(true);
		}
	}, []);

	return (
		<>
			<button className="flex py-3 pr-4 print:hidden md:hidden" onClick={() => toggleDrawer(true)}>
				<Icon path={mdiMenu} size={1} />
			</button>
			<div className={twMerge("fixed -left-72 bottom-0 top-0 z-50 w-72 bg-neutral px-4 py-4 transition-all", drawer && "left-0")}>
				<ul className="menu w-full" onClick={() => toggleDrawer(false)}>
					<li>
						<Link href="/characters">Character Logs</Link>
					</li>
					<li>
						<Link href="/dm-logs">DM Logs</Link>
					</li>
					<li>
						<Link href="/dms">DMs</Link>
					</li>
				</ul>
				<div className="divider"></div>
				<ul className="menu w-full">
					<li>
						<a href="https://github.com/sillvva/adventurers-league-log" target="_blank" rel="noreferrer noopener" className="items-center sm:hidden">
							Github
						</a>
					</li>
					<li>
						<a href="http://paypal.me/Sillvva" target="_blank" rel="noreferrer noopener">
							Contribute
						</a>
					</li>
				</ul>
			</div>
			<div
				className={twMerge("fixed inset-0 bg-black/50 transition-all", backdrop ? "block" : "hidden", drawer ? "z-40 opacity-100" : "-z-10 opacity-0")}
				onClick={() => toggleDrawer(false)}
			/>
		</>
	);
};
