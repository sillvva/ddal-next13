export const getLocal = (store: string, key: string) => {
	const storeData = JSON.parse(localStorage.getItem(store) || "{}");
	return storeData[key];
};

export const setLocal = (store: string, key: string, value: any) => {
	localStorage.setItem(store, JSON.stringify({ ...JSON.parse(localStorage.getItem(store) || "{}"), [key]: value }));
};
