import { CharacterData } from "$src/server/db/characters";

export const appMeta = (path: string, title: string) => {
	const openGraph = {
		title: title,
		description: "A log sheet made for Adventurers League characters",
		url: path,
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
		url: path
	};

	return {
		metadataBase: new URL("https://ddal.dekok.app"),
		title,
		openGraph,
		twitter,
		icons: {
			icon: "/favicon.png"
		}
	};
};

export const characterMeta = (character: CharacterData, path: string) => {
	const title = `${character.name} - Adventurers League Log Sheet`;
	const openGraph = {
		title: title,
		description: `A level ${character.total_level} ${character.race} ${character.class}`,
		url: `https://ddal.dekok.app/characters/${character.id}`,
		siteName: "Adventurers League Log",
		images: [
			{
				url: character.image_url || "https://ddal.dekok.app/images/barovia-gate.jpg"
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
		images: [character.image_url || "https://ddal.dekok.app/images/barovia-gate.jpg"],
		url: `https://ddal.dekok.app/characters/${character.id}`
	};

	return {
		title,
		openGraph,
		twitter,
		icons: {
			icon: "/favicon.png"
		}
	};
};
