import "../globals.css";

import { Inter } from "next/font/google";
import Head from "next/head";
import Image from "next/image";
import { twMerge } from "tailwind-merge";

import background from "../../../public/images/barovia-gate.jpg";

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <Head>
				<title>Adventurers League Log Sheet</title>
				<meta name="description" content="An online log sheet made for Adventurers League characters" />
				<link rel="icon" type="image/x-icon" href="/favicon.png" />
			</Head>
      <body className={twMerge("min-h-screen bg-gray-300 text-base-content dark:bg-gray-800", inter.className)}>
        <Image src={background} alt="Background" priority fill className="z-0 object-cover object-center opacity-40 dark:opacity-20 print:hidden" />
        <div className="relative z-10">
          {children}
        </div>
      </body>
    </html>
  )
}
