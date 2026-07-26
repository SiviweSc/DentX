import fs from "node:fs";
import path from "node:path";

const distDir = path.join(process.cwd(), "dist");
const indexPath = path.join(distDir, "index.html");
const siteOrigin = "https://dentxquarters.co.za";

if (!fs.existsSync(indexPath)) {
  console.error("dist/index.html was not found. Run build first.");
  process.exit(1);
}

const indexHtml = fs.readFileSync(indexPath, "utf8");

const ROUTES = [
  {
    path: "/",
    title:
      "DentX Quarters Dental and Medical Clinic in Nelspruit | Book Appointments",
    description:
      "DentX Quarters offers dental care, general medicine, IV therapy, and physiotherapy in Nelspruit.",
    keywords:
      "dentist nelspruit, dental clinic nelspruit, medical clinic nelspruit",
    robots: "index, follow",
    heading: "DentX Quarters Integrated Healthcare",
  },
  {
    path: "/services",
    title:
      "Dental, Medical, IV Therapy and Physiotherapy Services | DentX Quarters",
    description: "Explore integrated healthcare services at DentX Quarters.",
    keywords: "dental services nelspruit, iv therapy, physiotherapy",
    robots: "index, follow",
    heading: "DentX Quarters Services",
  },
  {
    path: "/about",
    title: "About DentX Quarters | Integrated Dental and Medical Care",
    description: "Learn about DentX Quarters and our integrated care approach.",
    keywords: "about dentx quarters, healthcare clinic nelspruit",
    robots: "index, follow",
    heading: "About DentX Quarters",
  },
  {
    path: "/team",
    title: "Meet Our Doctors and Clinical Team | DentX Quarters",
    description: "Meet the DentX Quarters doctors and healthcare team.",
    keywords: "dentist team nelspruit, healthcare professionals",
    robots: "index, follow",
    heading: "DentX Quarters Team",
  },
  {
    path: "/testimonials",
    title: "Patient Testimonials and Reviews | DentX Quarters",
    description: "Read patient testimonials and clinic reviews.",
    keywords: "dentist reviews nelspruit, patient testimonials",
    robots: "index, follow",
    heading: "DentX Quarters Testimonials",
  },
  {
    path: "/contact",
    title: "Contact DentX Quarters in Nelspruit | Address, Hours, Phone",
    description: "Contact details and clinic location for DentX Quarters.",
    keywords: "contact dentist nelspruit, clinic address",
    robots: "index, follow",
    heading: "Contact DentX Quarters",
  },
  {
    path: "/book",
    title: "Book a Dental or Medical Appointment Online | DentX Quarters",
    description: "Book your DentX Quarters appointment online.",
    keywords: "book dentist appointment nelspruit",
    robots: "index, follow",
    heading: "Book an Appointment",
  },
  {
    path: "/portal",
    title: "Staff and Admin Portal | DentX Quarters",
    description: "Secure portal for authorized staff.",
    keywords: "dentx portal",
    robots: "noindex, nofollow",
    heading: "DentX Quarters Portal",
  },
  {
    path: "/admin",
    title: "Admin Dashboard | DentX Quarters",
    description: "DentX Quarters administration dashboard.",
    keywords: "dentx admin",
    robots: "noindex, nofollow",
    heading: "DentX Quarters Admin",
  },
];

const injectMetadata = (html, route) => {
  const canonical = `${siteOrigin}${route.path}`;
  const fallbackBody = `<section style="max-width:840px;margin:40px auto;padding:0 16px;font-family:Arial,sans-serif;line-height:1.5;color:#1f2937"><h1>${route.heading}</h1><p>${route.description}</p><p>Explore more pages: <a href="/services">Services</a> | <a href="/about">About</a> | <a href="/contact">Contact</a> | <a href="/book">Book Appointment</a></p></section>`;

  let nextHtml = html
    .replace(/<title>[^<]*<\/title>/i, `<title>${route.title}</title>`)
    .replace(
      /<meta name="description"[^>]*>/i,
      `<meta name="description" content="${route.description}" />`,
    )
    .replace(
      /<meta name="keywords"[^>]*>/i,
      `<meta name="keywords" content="${route.keywords}" />`,
    )
    .replace(
      /<meta name="robots"[^>]*>/i,
      `<meta name="robots" content="${route.robots}" />`,
    )
    .replace(
      /<link rel="canonical"[^>]*>/i,
      `<link rel="canonical" href="${canonical}" />`,
    );

  const marker = `<noscript><p>This page works best with JavaScript enabled.</p></noscript>`;
  if (nextHtml.includes(marker)) {
    nextHtml = nextHtml.replace(
      marker,
      `${marker}\n    <noscript>${fallbackBody}</noscript>`,
    );
  } else {
    nextHtml = nextHtml.replace(
      '<div id="root"></div>',
      `<div id=\"root\"></div>\n    <noscript>${fallbackBody}</noscript>`,
    );
  }

  return nextHtml;
};

for (const route of ROUTES) {
  const outputDir =
    route.path === "/"
      ? distDir
      : path.join(distDir, route.path.replace(/^\//, ""));
  fs.mkdirSync(outputDir, { recursive: true });

  const html = injectMetadata(indexHtml, route);
  fs.writeFileSync(path.join(outputDir, "index.html"), html, "utf8");
}

console.log("Static route files generated under dist/*/index.html");
