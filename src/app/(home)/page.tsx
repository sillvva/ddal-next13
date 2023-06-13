import { HomeLogin } from "$src/components/buttons";
import { authOptions } from "$src/lib/auth";
import { getServerSession } from "next-auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function Home() {
	const session = await getServerSession(authOptions);
	if (session) throw redirect("/characters");

	const headersList = headers();
	const domain = headersList.get("host") || "";

	return (
		<main className="container relative mx-auto flex min-h-screen flex-col items-center justify-center p-4">
			<h1 className="mb-20 text-center font-draconis text-4xl text-base-content dark:text-white lg:text-6xl">
				Adventurers League
				<br />
				Log Sheet
			</h1>
			<HomeLogin domain={domain} />
		</main>
	);
}
