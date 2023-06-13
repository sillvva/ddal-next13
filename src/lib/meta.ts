import { CharacterData } from "$src/server/db/characters";

export const appMeta = (path: string, title: string) => {
	const openGraph = !path.match(/^\/characters\/[^\/]+\/?$/i)
		? {
				title: title,
				description: "A log sheet made for Adventurers League characters",
				url: `https://ddal.dekok.app${path}`,
				siteName: "Adventurers League Log",
				images: [
					{
						url: "https://ddal.dekok.app/images/barovia-gate.jpg",
						width: 800,
						height: 600
					}
				],
				locale: "en_US",
				type: "website"
		  }
		: {};
	const twitter = !path.match(/^\/characters\/[^\/]+\/?$/i)
		? {
				card: "summary_large_image",
				title: title,
				description: "A log sheet made for Adventurers League characters",
				creator: "@sillvvasensei",
				creatorId: "1006748654391169029",
				images: ["https://ddal.dekok.app/images/barovia-gate.jpg"],
				url: `https://ddal.dekok.app${path}`
		  }
		: {};

	return {
		title,
		openGraph,
		twitter
	};
};

export const characterMeta = (character: CharacterData, path: string) => {
	const title = `${character.name} - Adventurers League Log Sheet`;
	const openGraph = !path.match(/^\/characters\/[^\/]+\/?$/i)
		? {
				title: title,
				description: "A log sheet made for Adventurers League characters",
				url: `https://ddal.dekok.app/characters/${character.id}`,
				siteName: "Adventurers League Log",
				images: [
					{
						url: character.image_url || "https://ddal.dekok.app/images/barovia-gate.jpg",
						width: 800,
						height: 600
					}
				],
				locale: "en_US",
				type: "website"
		  }
		: {};
	const twitter = !path.match(/^\/characters\/[^\/]+\/?$/i)
		? {
				card: "summary_large_image",
				title: title,
				description: "A log sheet made for Adventurers League characters",
				creator: "@sillvvasensei",
				creatorId: "1006748654391169029",
				images: [character.image_url || "https://ddal.dekok.app/images/barovia-gate.jpg"],
				url: `https://ddal.dekok.app/characters/${character.id}`
		  }
		: {};

	return {
		title,
		openGraph,
		twitter
	};
};
