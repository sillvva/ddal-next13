import { env } from "$src/env/server.mjs";
import { CharacterData } from "$src/server/db/characters";
import { ReadonlyHeaders } from "next/dist/server/web/spec-extension/adapters/headers";
import { headers } from "next/headers";

export const appMeta = (title: string) => {
	const openGraph = {
		title: title,
		description: "A log sheet made for Adventurers League characters",
		url: env.NEXTAUTH_URL,
		siteName: "Adventurers League Log",
		images: [
			{
				url: "/images/barovia-gate.jpg"
			}
		],
		locale: "en_US",
		type: "website"
	};
	const twitter = {
		card: "summary_large_image",
		title: title,
		description: "A log sheet made for Adventurers League characters",
		creator: "@sillvvasensei",
		creatorId: "1006748654391169029",
		images: ["/images/barovia-gate.jpg"],
		url: env.NEXTAUTH_URL
	};

	return {
		metadataBase: new URL(env.NEXTAUTH_URL),
		manifest: "/manifest.json",
		title,
		openGraph,
		twitter,
		icons: {
			icon: "/favicon.png"
		}
	};
};

export const characterMeta = (character: CharacterData) => {
	const title = `${character.name} - Adventurers League Log Sheet`;
	const openGraph = {
		title: title,
		description: `A level ${character.total_level} ${character.race} ${character.class}`,
		url: `${env.NEXTAUTH_URL}/characters/${character.id}`,
		siteName: "Adventurers League Log",
		images: [
			{
				url: character.image_url || "${env.NEXTAUTH_URL}/images/barovia-gate.jpg"
			}
		],
		locale: "en_US",
		type: "website"
	};
	const twitter = {
		card: "summary_large_image",
		title: title,
		description: `A level ${character.total_level} ${character.race} ${character.class}`,
		creator: "@sillvvasensei",
		creatorId: "1006748654391169029",
		images: [character.image_url || "${env.NEXTAUTH_URL}/images/barovia-gate.jpg"],
		url: `${env.NEXTAUTH_URL}/characters/${character.id}`
	};

	return {
		metadataBase: new URL(env.NEXTAUTH_URL),
		manifest: "/manifest.json",
		title,
		openGraph,
		twitter,
		icons: {
			icon: "/favicon.png"
		}
	};
};

export function isMobile(headersList?: ReadonlyHeaders) {
	if (!headersList) headersList = headers();
	return !!headersList
		.get("user-agent")
		?.match(
			/Mobile|iP(hone|od|ad)|Android|BlackBerry|IEMobile|Kindle|NetFront|Silk-Accelerated|(hpw|web)OS|Fennec|Minimo|Opera M(obi|ini)|Blazer|Dolfin|Dolphin|Skyfire|Zune/
		);
}
