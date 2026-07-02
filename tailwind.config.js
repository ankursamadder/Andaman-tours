/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        lagoon: {
          50: "#EAF6F3",
          100: "#CFEDE6",
          400: "#1E8C7F",
          600: "#0E5C56",
          700: "#0B4F4A",
          900: "#0A2420",
        },
        sand: {
          50: "#FBF7EF",
          100: "#F3EAD8",
          200: "#E9DCC0",
        },
        coral: {
          400: "#FF9270",
          500: "#FF7A59",
          600: "#E85F3D",
        },
        driftwood: "#6B4F3A",
      },
      fontFamily: {
        display: ["'Fraunces'", "serif"],
        body: ["'Work Sans'", "sans-serif"],
      },
      backgroundImage: {
        "grain": "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
};
