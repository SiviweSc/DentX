import { Helmet } from "react-helmet-async";
import {
  DEFAULT_OG_IMAGE,
  SITE_ORIGIN,
  type BreadcrumbItem,
  type SeoConfig,
} from "./seo-config";

const getCanonicalUrl = (path: string) => {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_ORIGIN}${cleanPath}`;
};

const buildOrganizationSchema = () => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "DentX Quarters",
  url: SITE_ORIGIN,
  logo: `${SITE_ORIGIN}/favicon.png`,
  contactPoint: [
    {
      "@type": "ContactPoint",
      telephone: "+27 68 534 0763",
      contactType: "customer service",
      areaServed: "ZA",
      availableLanguage: ["English"],
    },
  ],
});

const buildLocalBusinessSchema = () => ({
  "@context": "https://schema.org",
  "@type": ["LocalBusiness", "MedicalClinic", "Dentist"],
  name: "DentX Quarters",
  url: SITE_ORIGIN,
  image: `${SITE_ORIGIN}/favicon.png`,
  telephone: "+27 68 534 0763",
  areaServed: ["Nelspruit", "Mbombela"],
  address: {
    "@type": "PostalAddress",
    streetAddress: "Shop F1A, City Centre Shopping Centre, 5 Andrew Street",
    addressLocality: "Nelspruit",
    addressRegion: "Mpumalanga",
    postalCode: "1200",
    addressCountry: "ZA",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: -25.4753,
    longitude: 30.9703,
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "08:30",
      closes: "16:30",
    },
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: "Saturday",
      opens: "09:00",
      closes: "13:30",
    },
  ],
});

const buildBreadcrumbSchema = (items: BreadcrumbItem[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    item: getCanonicalUrl(item.path),
  })),
});

interface SeoHeadProps {
  config: SeoConfig;
}

export function SeoHead({ config }: SeoHeadProps) {
  const canonicalUrl = getCanonicalUrl(config.path);
  const ogImage = config.image || DEFAULT_OG_IMAGE;
  const gscVerification = import.meta.env.VITE_GSC_VERIFICATION;
  const gaMeasurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;

  const schemas = [
    buildOrganizationSchema(),
    buildLocalBusinessSchema(),
    buildBreadcrumbSchema(config.breadcrumbs),
    config.extraSchema,
  ].filter(Boolean);

  return (
    <Helmet>
      <title>{config.title}</title>
      <meta name="description" content={config.description} />
      <meta name="keywords" content={config.keywords} />
      <meta
        name="robots"
        content={config.noindex ? "noindex, nofollow" : "index, follow"}
      />
      <link rel="canonical" href={canonicalUrl} />

      <meta property="og:title" content={config.title} />
      <meta property="og:description" content={config.description} />
      <meta property="og:type" content={config.type || "website"} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content="DentX Quarters" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={config.title} />
      <meta name="twitter:description" content={config.description} />
      <meta name="twitter:image" content={ogImage} />

      {gscVerification ? (
        <meta name="google-site-verification" content={gscVerification} />
      ) : null}

      {gaMeasurementId ? (
        <>
          <script
            async
            src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`}
          />
          <script>
            {`window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', '${gaMeasurementId}');`}
          </script>
        </>
      ) : null}

      {schemas.map((schema, index) => (
        <script key={index} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
}
