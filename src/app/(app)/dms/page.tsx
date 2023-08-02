import { BreadCrumbs } from "$src/components/breadcrumbs";
import { DMTable } from "$src/components/table";
import { authOptions } from "$src/lib/auth";
import { appMeta } from "$src/lib/meta";
import { deleteDM } from "$src/server/actions/dm";
import { getUserDMsWithLogsCache, UserDMsWithLogs } from "$src/server/db/dms";
import { getServerSession } from "next-auth";
import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";

import type { Metadata } from "next";

export default async function Page() {
	const session = await getServerSession(authOptions);
	if (!session?.user) throw redirect("/");

	const dms = (await getUserDMsWithLogsCache(session.user.id))
		.sort((a, b) => (a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1))
		.filter(dm => dm.name != session?.user?.name);

	const actionDeleteDM = async (dm: UserDMsWithLogs[0]) => {
		"use server";
		const result = await deleteDM(dm.id, session.user?.id);
		if (result.id) {
			revalidateTag(`dms-${session?.user?.id}`);
		}
		return result;
	};

	return (
		<div className="flex flex-col gap-4">
			<BreadCrumbs crumbs={[{ name: "DMs" }]} />
			<DMTable dms={dms} deleteDM={actionDeleteDM} />
		</div>
	);
}

export async function generateMetadata(): Promise<Metadata> {
	const session = await getServerSession(authOptions);
	return appMeta(`${session?.user?.name}'s DMs`);
}
