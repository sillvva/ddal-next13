import { LoginButton, LogoutButton } from "$src/components/buttons";
import { authOptions } from "$src/lib/auth";
import { getServerSession } from "next-auth";

export default async function Home() {
  const session = await getServerSession(authOptions);

  return (
    <main className="flex min-h-screen flex-col items-center gap-4 p-24">
      {session?.user ? <LogoutButton /> : <LoginButton />}
      <pre>{JSON.stringify(session, null, 2)}</pre>
    </main>
  )
}