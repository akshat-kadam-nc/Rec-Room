import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Rec Room",
    short_name: "Rec Room",
    description: "A configurable digital room for personal collections and recommendations.",
    start_url: "/",
    display: "standalone",
    background_color: "#f3f0e8",
    theme_color: "#111111",
    icons: [
      {
        src: "/favicon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/favicon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
