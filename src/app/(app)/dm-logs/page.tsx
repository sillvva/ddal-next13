import { DMLogTable } from "$src/components/table";
import { authOptions } from "$src/lib/auth";
import { appMeta } from "$src/lib/meta";
import { deleteLog } from "$src/server/actions/log";
import { DMLogData, getDMLogs } from "$src/server/db/log";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { mdiDotsHorizontal, mdiHome } from "@mdi/js";
import Icon from "@mdi/react";

import type { Metadata } from "next";
export default async function Page() {
	const session = await getServerSession(authOptions);
	if (!session?.user) throw redirect("/");

	const logs = (await getDMLogs(session.user.id, session.user.name || "")).map(log => ({
		...log,
		dateString: new Date(log.date).toLocaleString("en-US")
	}));

	const actionDeleteLog = async (log: DMLogData[0]) => {
		"use server";
		const result = await deleteLog(log.id, session?.user?.id);
		if (result.id) {
			revalidatePath(`/dm-logs/${result.id}`);
			revalidatePath("/dm-logs");
			if (log.characterId) {
				revalidatePath(`/characters/${log.characterId}`);
				revalidatePath("/characters");
			}
		}
		return result;
	};

	return (
		<div className="flex flex-col gap-4">
			<div className="flex gap-4 print:hidden">
				<div className="breadcrumbs flex-1 text-sm">
					<ul>
						<li>
							<Icon path={mdiHome} className="w-4" />
						</li>
						<li className="dark:drop-shadow-md">DM Logs</li>
					</ul>
				</div>
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

			<Suspense>
				<DMLogTable logs={logs} deleteLog={actionDeleteLog} />
			</Suspense>
		</div>
	);
}

export async function generateMetadata(): Promise<Metadata> {
	const session = await getServerSession(authOptions);
	const headersList = headers();
	const domain = headersList.get("host") || "";
	const fullUrl = headersList.get("referer") || "";
	const path = fullUrl.replace(domain, "").replace(/^https?:\/\//, "");

	return appMeta(path, `${session?.user?.name}'s DM Logs`);
}
