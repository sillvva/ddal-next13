import { authOptions } from "$src/lib/auth";
import { appMeta } from "$src/lib/meta";
import { getServerSession } from "next-auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import type { Metadata } from "next";

export default async function Page() {
	const session = await getServerSession(authOptions);
	if (!session) throw redirect("/");

	return <>DM Logs</>;
}

export async function generateMetadata(): Promise<Metadata> {
	const session = await getServerSession(authOptions);
	const headersList = headers();
	const domain = headersList.get("host") || "";
	const fullUrl = headersList.get("referer") || "";
	const path = fullUrl.replace(domain, "").replace(/^https?:\/\//, "");

	return appMeta(path, `${session?.user?.name}'s DM Logs`);
}
