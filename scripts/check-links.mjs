import fs from "node:fs";
import path from "node:path";

const distDir = path.join(process.cwd(), "dist");
const requiredRoutes = [
  "index.html",
  "services/index.html",
  "about/index.html",
  "team/index.html",
  "testimonials/index.html",
  "contact/index.html",
  "book/index.html",
];

const missing = requiredRoutes.filter(
  (relativePath) => !fs.existsSync(path.join(distDir, relativePath)),
);

if (missing.length > 0) {
  console.error("Missing prerendered route files:\n" + missing.join("\n"));
  process.exit(1);
}

console.log("Route file checks passed.");
