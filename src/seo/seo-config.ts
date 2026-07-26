export interface BreadcrumbItem {
  name: string;
  path: string;
}

export interface SeoConfig {
  title: string;
  description: string;
  keywords: string;
  path: string;
  type?: "website" | "article";
  noindex?: boolean;
  image?: string;
  breadcrumbs: BreadcrumbItem[];
  extraSchema?: Record<string, unknown>;
}

export const SITE_ORIGIN = "https://dentxquarters.co.za";
export const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/favicon.png`;

export const SEO_ROUTES: SeoConfig[] = [
  {
    path: "/",
    title:
      "DentX Quarters Dental and Medical Clinic in Nelspruit | Book Appointments",
    description:
      "DentX Quarters offers dental care, general medicine, IV therapy, and physiotherapy in Nelspruit. Book your appointment online in minutes.",
    keywords:
      "dentist nelspruit, dental clinic nelspruit, medical clinic nelspruit, iv therapy nelspruit, physiotherapy nelspruit",
    breadcrumbs: [{ name: "Home", path: "/" }],
  },
  {
    path: "/services",
    title:
      "Dental, Medical, IV Therapy and Physiotherapy Services | DentX Quarters",
    description:
      "Explore integrated healthcare services at DentX Quarters, including modern dental treatment, GP consultations, IV wellness therapy, and physiotherapy.",
    keywords:
      "dental services nelspruit, gp consultation nelspruit, iv drip therapy, physiotherapy treatment",
    breadcrumbs: [
      { name: "Home", path: "/" },
      { name: "Services", path: "/services" },
    ],
    extraSchema: {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "DentX Quarters Services",
      itemListElement: [
        {
          "@type": "Service",
          name: "Dental Care",
          areaServed: "Mbombela",
        },
        {
          "@type": "Service",
          name: "General Medicine",
          areaServed: "Mbombela",
        },
        {
          "@type": "Service",
          name: "IV Drip Therapy",
          areaServed: "Mbombela",
        },
        {
          "@type": "Service",
          name: "Physiotherapy",
          areaServed: "Mbombela",
        },
      ],
    },
  },
  {
    path: "/about",
    title: "About DentX Quarters | Integrated Dental and Medical Care",
    description:
      "Learn about DentX Quarters, our patient-centered approach, and our mission to deliver integrated healthcare with modern dentistry and medical services.",
    keywords:
      "about dentx quarters, integrated healthcare clinic, dental and medical team",
    breadcrumbs: [
      { name: "Home", path: "/" },
      { name: "About", path: "/about" },
    ],
    type: "article",
  },
  {
    path: "/team",
    title: "Meet Our Doctors and Clinical Team | DentX Quarters",
    description:
      "Meet our experienced dentists, doctors, therapists, and healthcare professionals dedicated to high-quality patient care in Nelspruit.",
    keywords:
      "dentist team nelspruit, healthcare professionals mbombela, clinic staff",
    breadcrumbs: [
      { name: "Home", path: "/" },
      { name: "Team", path: "/team" },
    ],
  },
  {
    path: "/testimonials",
    title: "Patient Testimonials and Reviews | DentX Quarters",
    description:
      "Read patient testimonials and reviews about DentX Quarters dental and medical services in Nelspruit.",
    keywords:
      "dentist reviews nelspruit, clinic testimonials, patient feedback",
    breadcrumbs: [
      { name: "Home", path: "/" },
      { name: "Testimonials", path: "/testimonials" },
    ],
  },
  {
    path: "/contact",
    title: "Contact DentX Quarters in Nelspruit | Address, Hours, Phone",
    description:
      "Contact DentX Quarters for appointments, directions, and clinic hours. Find our address, phone number, and email details.",
    keywords:
      "contact dentist nelspruit, clinic address mbombela, dental appointment phone",
    breadcrumbs: [
      { name: "Home", path: "/" },
      { name: "Contact", path: "/contact" },
    ],
  },
  {
    path: "/book",
    title: "Book a Dental or Medical Appointment Online | DentX Quarters",
    description:
      "Schedule your dental or medical appointment online with DentX Quarters. Choose your service, date, and preferred time slot.",
    keywords:
      "book dentist appointment nelspruit, online clinic booking, medical appointment booking",
    breadcrumbs: [
      { name: "Home", path: "/" },
      { name: "Book Appointment", path: "/book" },
    ],
  },
  {
    path: "/portal",
    title: "Staff and Admin Portal | DentX Quarters",
    description:
      "Secure portal for authorized DentX Quarters staff and admin users.",
    keywords: "dentx portal",
    breadcrumbs: [
      { name: "Home", path: "/" },
      { name: "Portal", path: "/portal" },
    ],
    noindex: true,
  },
  {
    path: "/admin",
    title: "Admin Dashboard | DentX Quarters",
    description: "DentX Quarters administration dashboard.",
    keywords: "dentx admin",
    breadcrumbs: [
      { name: "Home", path: "/" },
      { name: "Admin", path: "/admin" },
    ],
    noindex: true,
  },
];

export const SEO_ROUTE_MAP = Object.fromEntries(
  SEO_ROUTES.map((route) => [route.path, route]),
);
