import fs from "node:fs";
import path from "node:path";

const SITE_ORIGIN = "https://dentxquarters.co.za";
const ROUTES = [
  "/",
  "/services",
  "/about",
  "/team",
  "/testimonials",
  "/contact",
  "/book",
];

const today = new Date().toISOString().slice(0, 10);

const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${ROUTES.map(
  (route) =>
    `  <url>\n    <loc>${SITE_ORIGIN}${route}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>${route === "/" ? "1.0" : "0.8"}</priority>\n  </url>`,
).join("\n")}\n</urlset>\n`;

const robotsTxt = `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /portal\n\nSitemap: ${SITE_ORIGIN}/sitemap.xml\n`;

const publicDir = path.join(process.cwd(), "public");
fs.mkdirSync(publicDir, { recursive: true });

fs.writeFileSync(path.join(publicDir, "sitemap.xml"), sitemapXml, "utf8");
fs.writeFileSync(path.join(publicDir, "robots.txt"), robotsTxt, "utf8");

console.log("SEO files generated: public/sitemap.xml and public/robots.txt");
