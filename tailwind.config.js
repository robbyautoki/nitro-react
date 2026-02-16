/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/components/catalog/**/*.{ts,tsx}",
    "./src/components/ui/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  corePlugins: {
    preflight: false,
  },
}
