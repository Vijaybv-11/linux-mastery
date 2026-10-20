/**
 * Static export, same as GitMastery: `next build` writes a fully static site to `out/`.
 * `server.py` serves that folder and adds the optional local-account API on top.
 */

/** @type {import("next").NextConfig} */
const config = {
    output: "export",
    trailingSlash: true,
    images: {
        unoptimized: true,
    },
};

export default config;
