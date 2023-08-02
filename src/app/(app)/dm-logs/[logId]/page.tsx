import { BreadCrumbs } from "$src/components/breadcrumbs";
import { EditDMLogForm } from "$src/components/forms";
import { authOptions } from "$src/lib/auth";
import { appMeta } from "$src/lib/meta";
import { saveLog } from "$src/server/actions/log";
import { getCharactersCache } from "$src/server/db/characters";
import { getLogCache } from "$src/server/db/log";
import { getServerSession } from "next-auth";
import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";

import type { LogSchema } from "$src/types/schemas";
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

	const actionSaveLog = async (data: LogSchema) => {
		"use server";
		const characterId = data.characterId;
		const result = await saveLog(data, session?.user);
		if (result?.id) {
			revalidateTag(`dm-logs-${session?.user?.id}`);
			if (characterId) {
				revalidateTag(`character-${characterId}`);
			}
			redirect(`/dm-logs`);
		}
		return result;
	};

	return (
		<>
			<BreadCrumbs crumbs={[{ name: "DM Logs", href: "/dm-logs" }, { name: logId === "new" ? "New Log" : log.name }]} />
			<EditDMLogForm id={logId} log={log} characters={characters} saveLog={actionSaveLog} />
		</>
	);
}

export async function generateMetadata({ params: { logId } }: { params: { logId: string } }): Promise<Metadata> {
	return appMeta(`${logId === "new" ? "New" : "Edit"} Log - Adventurers League Log Sheet`);
}
