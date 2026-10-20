import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

// eslint-config-next v16 ships native flat configs. Wrapping them in FlatCompat
// (`compat.extends("next/...")`) crashes with a circular `react` plugin reference.
const eslintConfig = [
    { ignores: [".next/**", "out/**", "dist/**", "node_modules/**", "coverage/**", "next-env.d.ts"] },
    ...nextCoreWebVitals,
    ...nextTypescript,
    {
        files: ["**/*.ts", "**/*.tsx"],
        rules: {
            "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
            "@typescript-eslint/consistent-type-imports": [
                "warn",
                { prefer: "type-imports", fixStyle: "inline-type-imports" },
            ],
        },
    },
    {
        files: ["**/*.{js,jsx,mjs,ts,tsx,mts,cts}"],
        rules: {
            "react-hooks/exhaustive-deps": "warn",
            // Static export: state is hydrated from localStorage (and demo timers start) in effects on purpose.
            "react-hooks/set-state-in-effect": "warn",
            "react/no-unescaped-entities": "off",
            "react/prop-types": "off",
        },
    },
];

export default eslintConfig;
