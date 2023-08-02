const themes = require("daisyui/src/theming/themes");
/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ["./src/pages/**/*.{js,ts,jsx,tsx,mdx}", "./src/components/**/*.{js,ts,jsx,tsx,mdx}", "./src/app/**/*.{js,ts,jsx,tsx,mdx}"],
	theme: {
		extend: {
			fontFamily: {
				draconis: ["Draconis"],
				vecna: ["Vecna"]
			}
		},
		screens: {
			xs: "500px",
			sm: "640px",
			md: "768px",
			lg: "1024px",
			xl: "1280px",
			"2xl": "1440px"
		}
	},
	plugins: [require("daisyui")],
	daisyui: {
		themes: [
			{
				light: {
					...themes["[data-theme=light]"],
					primary: "#1b5be4",
					secondary: "#2F83FF",
					accent: "#6b6b6b"
				},
				dark: {
					...themes["[data-theme=dark]"],
					secondary: "#c881ff"
				}
			}
		]
	}
};
