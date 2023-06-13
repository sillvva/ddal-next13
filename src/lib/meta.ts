export const appMeta = (path: string, title: string) => {
	const openGraph = !path.match(/^\/characters\/[^\/]+\/?$/i)
		? {
				title: "Adventurers League Log",
				description: "An online log sheet made for Adventurers League characters",
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
				title: "Adventurers League Log",
				description: "An online log sheet made for Adventurers League characters",
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
