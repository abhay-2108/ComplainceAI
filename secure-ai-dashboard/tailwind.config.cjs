/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: "#1E3A8A", // Deep Blue
                secondary: "#0F172A", // Dark Slate
                accent: "#2563EB", // Blue
                success: "#16A34A", // Green
                warning: "#F59E0B", // Amber
                danger: "#DC2626", // Red
            },
            fontFamily: {
                sans: ['Inter', 'Roboto', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
