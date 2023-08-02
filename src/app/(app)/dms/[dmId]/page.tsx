import { DeleteDM } from "$src/components/actions";
import { BreadCrumbs } from "$src/components/breadcrumbs";
import { EditDMForm } from "$src/components/forms";
import { authOptions } from "$src/lib/auth";
import { appMeta } from "$src/lib/meta";
import { deleteDM, saveDM } from "$src/server/actions/dm";
import { getUserDMWithLogs, getUserDMWithLogsCache } from "$src/server/db/dms";
import { getServerSession } from "next-auth";
import { revalidateTag } from "next/cache";
import Link from "next/link";
import { redirect } from "next/navigation";
import { mdiPencil } from "@mdi/js";
import Icon from "@mdi/react";

import type { DungeonMasterSchema } from "$src/types/schemas";
import type { Metadata } from "next";

let dm: Awaited<ReturnType<typeof getUserDMWithLogs>>;

export default async function Page({ params: { dmId } }: { params: { dmId: string } }) {
	const session = await getServerSession(authOptions);
	if (!session?.user) throw redirect("/");

	dm = await getUserDMWithLogsCache(session.user.id, dmId);
	if (!dm) throw redirect("/dms");

	const actionSaveDM = async (dm: DungeonMasterSchema) => {
		"use server";
		const result = await saveDM(dm.id, session.user?.id || "", dm);
		if (result.id) {
			revalidateTag(`dm-wlogs-${result.id}`);
			revalidateTag(`dms-wlogs-${session.user?.id}`);
			revalidateTag(`dms-${session.user?.id}`);
			redirect(`/dms`);
		}
		return result;
	};

	const actionDeleteDM = async (dmId: string) => {
		"use server";
		const result = await deleteDM(dmId, session.user?.id || "");
		if (result.id) {
			revalidateTag(`dms-wlogs-${session.user?.id}`);
			revalidateTag(`dms-${session.user?.id}`);
			redirect(`/dms`);
		}
		return result;
	};

	return (
		<div className="flex flex-col gap-4">
			<BreadCrumbs crumbs={[{ name: "DMs" }, { name: dm.name, href: `/dms/${dm.id}` }, { name: "Edit" }]} />
			<EditDMForm dm={dm} saveDM={actionSaveDM} />

			<div className="mt-8 flex flex-col gap-4">
				<section>
					<h2 className="mb-2 text-2xl">Logs</h2>
					<div className="w-full overflow-x-auto rounded-lg bg-base-100">
						<table className="table w-full">
							<thead>
								<tr className="bg-base-300">
									<th className="">Date</th>
									<th className="">Adventure</th>
									<th className="">Character</th>
									<th className="print:hidden"></th>
								</tr>
							</thead>
							<tbody>
								{dm.logs.length == 0 ? (
									<tr>
										<td colSpan={4} className="py-20 text-center">
											<p className="mb-4">This DM has no logs.</p>
											<DeleteDM dmId={dmId} deleteDM={actionDeleteDM} />
										</td>
									</tr>
								) : (
									dm.logs
										.sort((a, b) => (a.date > b.date ? 1 : -1))
										.map(log => (
											<tr key={log.id}>
												<td>{log.date.toLocaleString()}</td>
												<td>{log.name}</td>
												<td>
													<Link href={`/characters/${log.character?.id}`} className="text-secondary">
														{log.character?.name}
													</Link>
												</td>
												<td className="w-8 print:hidden">
													<div className="flex flex-row justify-center gap-2">
														<Link href={`/characters/${log.character?.id}/log/${log.id}`} className="btn-primary btn-sm btn">
															<Icon path={mdiPencil} size={0.8} />
														</Link>
													</div>
												</td>
											</tr>
										))
								)}
							</tbody>
						</table>
					</div>
				</section>
			</div>
		</div>
	);
}

export async function generateMetadata({ params: { dmId } }: { params: { dmId: string } }): Promise<Metadata> {
	const session = await getServerSession(authOptions);
	if (!dm) dm = await getUserDMWithLogsCache(session?.user?.id || "", dmId);
	return appMeta(`Edit ${dm?.name}`);
}
