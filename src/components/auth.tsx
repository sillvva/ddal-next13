"use client";

import { signIn, signOut } from "next-auth/react";
import Image from "next/image";

import google from "../../public/images/google.svg";

export const HomeLogin = ({ domain }: { domain: string }) => {
	const protocol = domain.includes("localhost") ? "http://" : "https://";

	return (
		<button
			className="items-centers flex h-16 gap-4 rounded-lg bg-base-200/50 px-8 py-4 text-base-content transition-colors hover:bg-base-300"
			onClick={() =>
				signIn("google", {
					callbackUrl: `${protocol}${domain}/characters`
				})
			}>
			<Image src={google} width={32} height={32} alt="Google" />
			<span className="flex h-full flex-1 items-center justify-center text-xl font-semibold">Sign In</span>
		</button>
	);
};

export const HeaderLogin = ({ domain }: { domain: string }) => {
	const protocol = domain.includes("localhost") ? "http://" : "https://";

	return (
		<button
			className="flex h-12 items-center gap-2 rounded-lg bg-base-200/50 p-2 text-base-content transition-colors hover:bg-base-300"
			onClick={() =>
				signIn("google", {
					callbackUrl: `${protocol}${domain}/characters`
				})
			}>
			<Image src={google} width={24} height={24} alt="Google" />
			<span className="flex h-full flex-1 items-center justify-center font-semibold">Sign In</span>
		</button>
	);
};

export const MenuLogout = () => {
	return <a onClick={() => signOut()}>Logout</a>;
};
