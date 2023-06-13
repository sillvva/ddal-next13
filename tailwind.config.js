const themes = require('daisyui/src/theming/themes');
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        draconis: ["Draconis"],
        vecna: ["Vecna"]
      }
    }
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        light: {
          ...themes["[data-theme=light]"],
          secondary: "#570DF8",
        },
        dark: {
          ...themes["[data-theme=dark]"],
          secondary: "#c881ff",
        }
      }
    ]
  }
}
