/** @type {import('prettier').Config & import('prettier-plugin-tailwindcss').PluginOptions} */
const config = {
    tabWidth: 4,
    printWidth: 120,
    arrowParens: "avoid",
    plugins: ["prettier-plugin-tailwindcss"],
};

export default config;
