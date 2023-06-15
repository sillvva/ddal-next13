import { DMTable } from "$src/components/table";
import { authOptions } from "$src/lib/auth";
import { appMeta } from "$src/lib/meta";
import { deleteDM } from "$src/server/actions/dm";
import { getUserDMsWithLogs, UserDMsWithLogs } from "$src/server/db/dms";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { mdiHome } from "@mdi/js";
import Icon from "@mdi/react";

import type { Metadata } from "next";

export default async function Page() {
	const session = await getServerSession(authOptions);
	if (!session?.user) throw redirect("/");

	const dms = (await getUserDMsWithLogs(session.user.id))
		.sort((a, b) => (a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1))
		.filter(dm => dm.name != session?.user?.name);

	const actionDeleteDM = async (dm: UserDMsWithLogs[0]) => {
		"use server";
		const result = await deleteDM(dm.id, session.user?.id);
		if (result.id) {
			revalidatePath(`/dms/${result.id}`);
			revalidatePath("/dms");
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
						<li className="dark:drop-shadow-md">DMs</li>
					</ul>
				</div>
			</div>

			<DMTable dms={dms} deleteDM={actionDeleteDM} />
		</div>
	);
}

export async function generateMetadata(): Promise<Metadata> {
	const session = await getServerSession(authOptions);
	const headersList = headers();
	const domain = headersList.get("host") || "";
	const fullUrl = headersList.get("referer") || "";
	const path = fullUrl.replace(domain, "").replace(/^https?:\/\//, "");

	return appMeta(path, `${session?.user?.name}'s DMs`);
}
