/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	theme: {
		fontFamily: {
			'sans': ['Quicksand']
		},
		extend: {
			colors: {
				'cccccc': "#cccccc",
				'333333': "#333333",
				'555555': "#555555"
			}
		},
	},
	plugins: [],
}
