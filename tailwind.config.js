/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        accent: "#00E5FF",
        primary: "#00E5FF",
      },
      fontFamily: {
        inter: ["Inter", "ui-sans-serif", "system-ui"],
      },
      boxShadow: {
        soft: "0 10px 30px rgba(0,0,0,0.35)",
        "glow-primary": "0 0 40px -10px rgba(0,229,255,0.4)",
      },
      borderRadius: {
        card: "24px",
      },
    },
  },
  plugins: [],
};