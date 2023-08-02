import { BreadCrumbs } from "$src/components/breadcrumbs";
import { EditCharacterLogForm } from "$src/components/forms";
import { authOptions } from "$src/lib/auth";
import { appMeta } from "$src/lib/meta";
import { saveLog } from "$src/server/actions/log";
import { getCharacterCache } from "$src/server/db/characters";
import { getUserDMsCache } from "$src/server/db/dms";
import { getServerSession } from "next-auth";
import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";

import type { LogSchema } from "$src/types/schemas";
import type { Metadata } from "next";

export default async function Page({ params: { characterId, logId } }: { params: { characterId: string; logId: string } }) {
	const session = await getServerSession(authOptions);
	if (!session?.user) throw redirect("/");

	const character = await getCharacterCache(characterId);
	if (character?.userId !== session?.user?.id) throw redirect("/characters");

	let log = character.logs.find(log => log.id === logId);
	if (logId !== "new" && !log) throw redirect(`/characters/${characterId}`);

	const dms = await getUserDMsCache(session.user.id);

	const actionSaveLog = async (data: LogSchema) => {
		"use server";
		const result = await saveLog(data, session?.user);
		if (result?.id) {
			revalidateTag(`character-${characterId}`);
			redirect(`/characters/${characterId}`);
		}
		return result;
	};

	return (
		<>
			<BreadCrumbs
				crumbs={[{ name: "Characters", href: "/characters" }, { name: character.name, href: `/characters/${characterId}` }, { name: log?.name || "New Log" }]}
			/>
			<EditCharacterLogForm id={logId} log={log} dms={dms} character={character} saveLog={actionSaveLog} />
		</>
	);
}

export async function generateMetadata({ params: { logId } }: { params: { logId: string } }): Promise<Metadata> {
	return appMeta(`${logId === "new" ? "New" : "Edit"} Log - Adventurers League Log Sheet`);
}
