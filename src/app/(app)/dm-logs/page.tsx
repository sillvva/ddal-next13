import { appHead } from "$src/lib/app-head";
import { authOptions } from "$src/lib/auth";
import { getServerSession } from "next-auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function Page() {
	const session = await getServerSession(authOptions);
	if (!session) throw redirect("/");

	return <>DM Logs</>;
}

import type { Metadata } from "next";
export async function generateMetadata(): Promise<Metadata> {
	const session = await getServerSession(authOptions);
	const headersList = headers();
	const domain = headersList.get("host") || "";
	const fullUrl = headersList.get("referer") || "";
	const path = fullUrl.replace(domain, "").replace(/^https?:\/\//, "");

	return appHead(path, `${session?.user?.name}'s DM Logs`);
}
