import { EditCharacterLogForm } from "$src/components/forms";
import { authOptions } from "$src/lib/auth";
import { appMeta } from "$src/lib/meta";
import { saveCharacterLog } from "$src/server/actions/log";
import { getCharacter } from "$src/server/db/characters";
import { getUserDMs } from "$src/server/db/dms";
import { logSchema } from "$src/types/zod-schema";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { z } from "zod";

import { mdiHome } from "@mdi/js";
import Icon from "@mdi/react";
import { LogType } from "@prisma/client";

import type { CharacterData } from "$src/server/db/characters";
import type { Metadata } from "next";

export default async function Page({ params: { characterId, logId } }: { params: { characterId: string; logId: string } }) {
	const session = await getServerSession(authOptions);
	if (!session?.user) throw redirect("/");

	const character = await getCharacter(characterId);
	if (character?.userId !== session?.user?.id) throw redirect("/characters");

	const dms = await getUserDMs(session.user.id);

	let log = character.logs.find(log => log.id === logId);
	if (logId !== "new" && !log) throw redirect(`/characters/${characterId}`);

	if (!log)
		log = {
			saving: true,
			characterId: characterId,
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
				name: "",
				DCI: null,
				uid: ""
			},
			applied_date: new Date(),
			is_dm_log: false,
			magic_items_gained: [],
			magic_items_lost: [],
			story_awards_gained: [],
			story_awards_lost: []
		};

	const actionSaveLog = async (data: z.infer<typeof logSchema>) => {
		"use server";
		const result = await saveCharacterLog(characterId, logId, data, session?.user);
		if (result?.id) {
			revalidatePath(`/characters/${result.id}`);
			redirect(`/characters/${result.id}`);
		}
		return { id: null, error: "test" };
	};

	return (
		<>
			<div className="breadcrumbs mb-4 text-sm">
				<ul>
					<li>
						<Icon path={mdiHome} className="w-4" />
					</li>
					<li>
						<Link href="/characters" className="text-secondary">
							Characters
						</Link>
					</li>
					<li>
						<Link href={`/characters/${characterId}`} className="text-secondary">
							{character.name}
						</Link>
					</li>
					{log.name ? (
						<li className="overflow-hidden text-ellipsis whitespace-nowrap dark:drop-shadow-md">{log.name}</li>
					) : (
						<li className="dark:drop-shadow-md">New Log</li>
					)}
				</ul>
			</div>

			<EditCharacterLogForm id={log.id} log={log} dms={dms} character={character} saveLog={actionSaveLog} />
		</>
	);
}

export async function generateMetadata(): Promise<Metadata> {
	const headersList = headers();
	const domain = headersList.get("host") || "";
	const fullUrl = headersList.get("referer") || "";
	const path = fullUrl.replace(domain, "").replace(/^https?:\/\//, "");

	return appMeta(path, `Edit Log - Adventurers League Log Sheet`);
}
