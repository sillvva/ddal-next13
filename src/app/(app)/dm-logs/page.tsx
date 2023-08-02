import { BreadCrumbs } from "$src/components/breadcrumbs";
import { DMLogTable } from "$src/components/table";
import { authOptions } from "$src/lib/auth";
import { appMeta } from "$src/lib/meta";
import { deleteLog } from "$src/server/actions/log";
import { DMLogData, getDMLogsCache } from "$src/server/db/log";
import { getServerSession } from "next-auth";
import { revalidateTag } from "next/cache";
import Link from "next/link";
import { redirect } from "next/navigation";
import { mdiDotsHorizontal } from "@mdi/js";
import Icon from "@mdi/react";

import type { Metadata } from "next";
export default async function Page() {
	const session = await getServerSession(authOptions);
	if (!session?.user) throw redirect("/");

	const logs = (await getDMLogsCache(session.user.id, session.user.name || "")).map(log => ({
		...log,
		dateString: new Date(log.date).toLocaleString("en-US")
	}));

	const actionDeleteLog = async (log: DMLogData[0]) => {
		"use server";
		const result = await deleteLog(log.id, session?.user?.id);
		if (result.id) {
			revalidateTag(`dm-logs-${session?.user?.id}`);
			revalidateTag(`log-${result.id}`);
			if (log.characterId) {
				revalidateTag(`character-${log.characterId}`);
			}
		}
		return result;
	};

	return (
		<div className="flex flex-col gap-4">
			<div className="flex gap-4 print:hidden">
				<BreadCrumbs crumbs={[{ name: "DM Logs" }]} />
				{logs && logs.length > 0 && (
					<div className="flex flex-1 justify-end">
						<Link href="/dm-logs/new" className="btn-primary btn-sm btn">
							New Log
						</Link>
					</div>
				)}
				<div className="dropdown-end dropdown">
					<label tabIndex={1} className="btn-sm btn">
						<Icon path={mdiDotsHorizontal} size={1} />
					</label>
					<ul tabIndex={1} className="dropdown-content menu rounded-box w-52 bg-base-100 p-2 shadow">
						<li>
							<a download={`dm.json`} href={`/api/exports/dm`} target="_blank" rel="noreferrer noopener">
								Export
							</a>
						</li>
					</ul>
				</div>
			</div>

			<DMLogTable logs={logs} deleteLog={actionDeleteLog} />
		</div>
	);
}

export async function generateMetadata(): Promise<Metadata> {
	const session = await getServerSession(authOptions);
	return appMeta(`${session?.user?.name}'s DM Logs`);
}
