import "$src/app/globals.css";
import { Inter } from "next/font/google";
import Image from "next/image";
import { twMerge } from "tailwind-merge";
import background from "../../../public/images/barovia-gate.jpg";

const inter = Inter({ subsets: ["latin"] });

export default async function RootLayout({ children }: { children: React.ReactNode }) {
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
					<div className="container relative z-10 mx-auto max-w-5xl flex-1 p-4">{children}</div>
				</div>
			</body>
		</html>
	);
}
