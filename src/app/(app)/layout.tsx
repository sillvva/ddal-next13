import "../globals.css";

import { HeaderLogin, MenuLogout } from "$src/components/buttons";
import { authOptions } from "$src/lib/auth";
import { getServerSession } from "next-auth";
import { Inter } from "next/font/google";
import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { twMerge } from "tailwind-merge";

import { mdiGithub, mdiMenu } from "@mdi/js";
import Icon from "@mdi/react";

import background from "../../../public/images/barovia-gate.jpg";

const inter = Inter({ subsets: ["latin"] });

export default async function RootLayout({ children }: { children: React.ReactNode }) {
	const session = await getServerSession(authOptions);
	const headersList = headers();
	const domain = headersList.get("host") || "";

	return (
		<html lang="en">
			<body className={twMerge("min-h-screen bg-gray-300 text-base-content dark:bg-gray-800", inter.className)}>
				<Image
					src={background}
					alt="Background"
					priority
					fill
					className="!fixed z-0 min-h-screen min-w-full object-cover object-center opacity-40 dark:opacity-20 print:hidden"
				/>
				<div className="relative flex min-h-screen flex-col">
					<header className="relative z-20 w-full border-b-[1px] border-slate-500">
						<nav className="container mx-auto flex max-w-5xl gap-2 p-4">
							{/* <button className="flex py-3 pr-4 print:hidden md:hidden" onClick={() => setDrawer(true)}>
							<Icon path={mdiMenu} size={1} />
						</button> */}
							<Link href={session?.user ? "/characters" : "/"} className="mr-8 flex flex-col text-center font-draconis">
								<h1 className="text-base leading-4 text-accent-content">Adventurers League</h1>
								<h2 className="text-3xl leading-7">Log Sheet</h2>
							</Link>
							<Link href="/characters" className="hidden items-center p-2 md:flex">
								Character Logs
							</Link>
							<Link href="/dm-logs" className="hidden items-center p-2 md:flex">
								DM Logs
							</Link>
							<Link href="/dms" className="hidden items-center p-2 md:flex">
								DMs
							</Link>
							<div className="flex-1">&nbsp;</div>
							<a href="https://github.com/sillvva/adventurers-league-log" target="_blank" rel="noreferrer noopener" className="hidden items-center p-2 sm:flex">
								<Icon path={mdiGithub} size={1} />
							</a>
							<a href="http://paypal.me/Sillvva" target="_blank" rel="noreferrer noopener" className="hidden items-center p-2 sm:flex">
								Contribute
							</a>
							{session?.user ? (
								<>
									<div className="dropdown-end dropdown">
										<label tabIndex={0} className="flex cursor-pointer">
											<div className="hidden items-center px-4 text-accent-content print:flex sm:flex">{session?.user.name}</div>
											<div className="avatar">
												<div className="relative w-11 overflow-hidden rounded-full ring ring-primary ring-offset-2 ring-offset-base-100">
													<Image
														src={session.user.image || ""}
														alt={session.user.name as string}
														width={48}
														height={48}
														className="rounded-full object-cover object-center"
													/>
												</div>
											</div>
										</label>
										<ul tabIndex={0} className="dropdown-content menu rounded-box w-52 bg-base-100 p-2 shadow">
											<li className="sm:hidden">
												<a>{session.user.name}</a>
											</li>
											<li className="sm:hidden">
												<Link href="/dms">DMs</Link>
											</li>
											<li>
												<a href="http://paypal.me/Sillvva" target="_blank" rel="noreferrer noopener" className="items-center sm:hidden">
													Contribute
												</a>
											</li>
											<li>
												<a
													href="https://github.com/sillvva/adventurers-league-log"
													target="_blank"
													rel="noreferrer noopener"
													className="items-center sm:hidden">
													Github
												</a>
											</li>
											<li>
												<MenuLogout />
											</li>
										</ul>
									</div>
								</>
							) : (
								<>
									<HeaderLogin domain={domain} />
								</>
							)}
						</nav>
					</header>
					<div className="container relative z-10 mx-auto max-w-5xl flex-1 p-4">{children}</div>
					<footer className="z-16 footer footer-center relative bg-base-300/50 p-4 text-base-content print:hidden">
						<div>
							<p>
								All{" "}
								<a
									href="https://www.dndbeyond.com/sources/cos/the-lands-of-barovia#BGatesofBarovia"
									target="_blank"
									rel="noreferrer noopener"
									className="text-secondary">
									images
								</a>{" "}
								and the name{" "}
								<a href="https://dnd.wizards.com/adventurers-league" target="_blank" rel="noreferrer noopener" className="text-secondary">
									Adventurers League
								</a>{" "}
								are property of Hasbro and{" "}
								<a href="https://dnd.wizards.com/adventurers-league" target="_blank" rel="noreferrer noopener" className="text-secondary">
									Wizards of the Coast
								</a>
								. This website is affiliated with neither.
							</p>
						</div>
					</footer>
				</div>
			</body>
		</html>
	);
}
