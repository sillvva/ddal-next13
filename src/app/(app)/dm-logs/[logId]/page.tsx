import { EditDMLogForm } from "$src/components/forms";
import { authOptions } from "$src/lib/auth";
import { appMeta } from "$src/lib/meta";
import { saveLog } from "$src/server/actions/log";
import { getCharactersCache } from "$src/server/db/characters";
import { getLogCache } from "$src/server/db/log";
import { logSchema } from "$src/types/zod-schema";
import { getServerSession } from "next-auth";
import { revalidateTag } from "next/cache";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { z } from "zod";
import { mdiHome } from "@mdi/js";
import Icon from "@mdi/react";

import type { LogType } from "@prisma/client";
import type { Metadata } from "next";

export default async function Page({ params: { logId } }: { params: { logId: string } }) {
	const session = await getServerSession(authOptions);
	if (!session?.user) throw redirect("/");

	let log = await getLogCache(logId, true);
	if (logId !== "new" && !log) throw redirect(`/dm-logs`);

	log = log
		? {
				...log,
				date: new Date(log.date),
				created_at: new Date(log.created_at),
				applied_date: log.applied_date !== null ? new Date(log.applied_date) : null
		  }
		: {
				characterId: null,
				id: "",
				name: "",
				description: "",
				date: new Date(),
				type: "game" as LogType,
				created_at: new Date(),
				experience: 0,
				acp: 0,
				tcp: 0,
				level: 0,
				gold: 0,
				dtd: 0,
				dungeonMasterId: "",
				dm: {
					id: "",
					name: session.user.name || "",
					DCI: null,
					uid: session.user.id || ""
				},
				applied_date: null,
				is_dm_log: true,
				magic_items_gained: [],
				magic_items_lost: [],
				story_awards_gained: [],
				story_awards_lost: []
		  };

	const characters = await getCharactersCache(session.user.id);

	const actionSaveLog = async (data: z.infer<typeof logSchema>) => {
		"use server";
		const characterId = data.characterId;
		const result = await saveLog(characterId, logId, data, session?.user);
		if (result?.id) {
			revalidateTag(`dm-logs-${session?.user?.id}`);
			revalidateTag(`dm-log-${result.id}`);
			if (characterId) {
				revalidateTag(`characters-${session?.user?.id}`);
				revalidateTag(`character-${characterId}`);
			}
			redirect(`/dm-logs`);
		}
		return result;
	};

	return (
		<>
			<div className="breadcrumbs mb-4 text-sm">
				<ul>
					<li>
						<Icon path={mdiHome} className="w-4" />
					</li>
					<li>
						<Link href="/dm-logs" className="text-secondary">
							DM Logs
						</Link>
					</li>
					{logId !== "new" ? (
						<li className="overflow-hidden text-ellipsis whitespace-nowrap dark:drop-shadow-md">{log.name}</li>
					) : (
						<li className="dark:drop-shadow-md">New Log</li>
					)}
				</ul>
			</div>

			<EditDMLogForm id={logId} log={log} characters={characters} saveLog={actionSaveLog} />
		</>
	);
}

export async function generateMetadata({ params: { logId } }: { params: { logId: string } }): Promise<Metadata> {
	const headersList = headers();
	const domain = headersList.get("host") || "";
	const fullUrl = headersList.get("referer") || "";
	const path = fullUrl.replace(domain, "").replace(/^https?:\/\//, "");

	return appMeta(path, `${logId === "new" ? "New" : "Edit"} Log - Adventurers League Log Sheet`);
}
