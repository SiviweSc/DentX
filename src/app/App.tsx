import {
  Suspense,
  lazy,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { Header } from "./components/header";
import { Hero } from "./components/hero";
import { Services } from "./components/services";
import { About } from "./components/about";
import { Team } from "./components/team";
import { Testimonials } from "./components/testimonials";
import { Contact } from "./components/contact";
import { Footer } from "./components/footer";
import { Toaster } from "./components/ui/sonner";
import {
  normalizeUserRole,
  sanitizeRolePermissions,
  type RolePermissions,
  type UserRole,
} from "./lib/roles";
import { Breadcrumbs } from "../seo/Breadcrumbs";
import { SeoHead } from "../seo/SeoHead";
import {
  DEFAULT_OG_IMAGE,
  SEO_ROUTE_MAP,
  SITE_ORIGIN,
  type SeoConfig,
} from "../seo/seo-config";

const BookingForm = lazy(() =>
  import("./components/booking-form").then((module) => ({
    default: module.BookingForm,
  })),
);

const AdminDashboard = lazy(() =>
  import("./components/admin-dashboard-new").then((module) => ({
    default: module.AdminDashboard,
  })),
);

const DatabaseTest = lazy(() =>
  import("./components/database-test").then((module) => ({
    default: module.DatabaseTest,
  })),
);

const AccessPortal = lazy(() =>
  import("./components/access-portal").then((module) => ({
    default: module.AccessPortal,
  })),
);

interface AdminSession {
  id: number;
  token: string;
  username: string;
  role: UserRole;
  roleLabel: string;
  permissions: RolePermissions;
}

function PageShell({
  seo,
  children,
  onBookNow,
  onAdminLogin,
}: {
  seo: SeoConfig;
  children: ReactNode;
  onBookNow: () => void;
  onAdminLogin: () => void;
}) {
  return (
    <>
      <SeoHead config={seo} />
      <Header onBookNow={onBookNow} />
      <Breadcrumbs items={seo.breadcrumbs} />
      <main>{children}</main>
      <Footer onAdminLogin={onAdminLogin} />
    </>
  );
}

function HomePage({
  onBookNow,
  onAdminLogin,
}: {
  onBookNow: () => void;
  onAdminLogin: () => void;
}) {
  return (
    <PageShell
      seo={SEO_ROUTE_MAP["/"]}
      onBookNow={onBookNow}
      onAdminLogin={onAdminLogin}
    >
      <div className="min-h-screen bg-white">
        <Hero onBookNow={onBookNow} />
        <Services onBookNow={onBookNow} />
        <About />
        <Team />
        <Testimonials />
        <Contact />
      </div>
    </PageShell>
  );
}

function ServicesPage({
  onBookNow,
  onAdminLogin,
}: {
  onBookNow: () => void;
  onAdminLogin: () => void;
}) {
  return (
    <PageShell
      seo={SEO_ROUTE_MAP["/services"]}
      onBookNow={onBookNow}
      onAdminLogin={onAdminLogin}
    >
      <section className="bg-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl text-gray-900 mb-4">
            Dental and Medical Services in Nelspruit
          </h1>
          <p className="text-gray-600 max-w-3xl">
            Browse our integrated services and choose the right care pathway for
            your oral health, medical wellness, and physical recovery goals.
          </p>
        </div>
      </section>
      <Services onBookNow={onBookNow} />
      <Contact />
    </PageShell>
  );
}

function AboutPage({
  onBookNow,
  onAdminLogin,
}: {
  onBookNow: () => void;
  onAdminLogin: () => void;
}) {
  return (
    <PageShell
      seo={SEO_ROUTE_MAP["/about"]}
      onBookNow={onBookNow}
      onAdminLogin={onAdminLogin}
    >
      <section className="bg-[#F8F5EE] py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl text-gray-900 mb-4">About DentX Quarters</h1>
          <p className="text-gray-700 max-w-3xl">
            We combine modern dentistry, clinical medicine, and allied therapy
            under one patient-centered healthcare model.
          </p>
        </div>
      </section>
      <About />
      <Team />
      <Contact />
    </PageShell>
  );
}

function TeamPage({
  onBookNow,
  onAdminLogin,
}: {
  onBookNow: () => void;
  onAdminLogin: () => void;
}) {
  return (
    <PageShell
      seo={SEO_ROUTE_MAP["/team"]}
      onBookNow={onBookNow}
      onAdminLogin={onAdminLogin}
    >
      <section className="bg-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl text-gray-900 mb-4">
            Meet Our Clinical Team
          </h1>
          <p className="text-gray-700 max-w-3xl">
            Our dentists, doctors, and healthcare practitioners collaborate to
            deliver complete care plans from consultation to follow-up.
          </p>
        </div>
      </section>
      <Team />
      <Contact />
    </PageShell>
  );
}

function TestimonialsPage({
  onBookNow,
  onAdminLogin,
}: {
  onBookNow: () => void;
  onAdminLogin: () => void;
}) {
  return (
    <PageShell
      seo={SEO_ROUTE_MAP["/testimonials"]}
      onBookNow={onBookNow}
      onAdminLogin={onAdminLogin}
    >
      <section className="bg-[#F8F5EE] py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl text-gray-900 mb-4">Patient Testimonials</h1>
          <p className="text-gray-700 max-w-3xl">
            Read real patient feedback and experiences from dental and medical
            visits at DentX Quarters.
          </p>
        </div>
      </section>
      <Testimonials />
      <Contact />
    </PageShell>
  );
}

function ContactPage({
  onBookNow,
  onAdminLogin,
}: {
  onBookNow: () => void;
  onAdminLogin: () => void;
}) {
  return (
    <PageShell
      seo={SEO_ROUTE_MAP["/contact"]}
      onBookNow={onBookNow}
      onAdminLogin={onAdminLogin}
    >
      <section className="bg-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl text-gray-900 mb-4">
            Contact DentX Quarters
          </h1>
          <p className="text-gray-700 max-w-3xl">
            Reach our team by phone, email, or in-person visit for bookings,
            referrals, and general patient support.
          </p>
        </div>
      </section>
      <Contact />
    </PageShell>
  );
}

function BookingPage({
  onClose,
  onAdminLogin,
}: {
  onClose: () => void;
  onAdminLogin: () => void;
}) {
  return (
    <>
      <SeoHead config={SEO_ROUTE_MAP["/book"]} />
      <Header onBookNow={() => undefined} />
      <Breadcrumbs items={SEO_ROUTE_MAP["/book"].breadcrumbs} />
      <Suspense fallback={<div className="p-8">Loading booking form...</div>}>
        <BookingForm onClose={onClose} />
      </Suspense>
      <Footer onAdminLogin={onAdminLogin} />
    </>
  );
}

function PortalPage({
  onClose,
  onLoginSuccess,
}: {
  onClose: () => void;
  onLoginSuccess: (session: {
    id: number;
    token: string;
    username: string;
    role: UserRole;
    roleLabel?: string;
    permissions?: Partial<RolePermissions>;
  }) => void;
}) {
  return (
    <>
      <SeoHead config={SEO_ROUTE_MAP["/portal"]} />
      <Suspense fallback={<div className="p-8">Loading access portal...</div>}>
        <AccessPortal onClose={onClose} onLoginSuccess={onLoginSuccess} />
      </Suspense>
    </>
  );
}

function NotFoundPage() {
  const notFoundSeo = useMemo<SeoConfig>(
    () => ({
      path: "/404",
      title: "Page Not Found | DentX Quarters",
      description: "The page you requested could not be found.",
      keywords: "404 dentx quarters",
      breadcrumbs: [
        { name: "Home", path: "/" },
        { name: "404", path: "/404" },
      ],
      noindex: true,
      image: DEFAULT_OG_IMAGE,
      extraSchema: {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: "404",
        isPartOf: SITE_ORIGIN,
      },
    }),
    [],
  );

  return (
    <>
      <SeoHead config={notFoundSeo} />
      <main className="min-h-screen bg-white flex items-center">
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-5xl text-gray-900 mb-4">404</h1>
          <p className="text-gray-600 mb-8">This page does not exist.</p>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md bg-[#9A7B1D] px-6 py-3 text-white hover:bg-[#7d6418] transition-colors"
          >
            Back to home page
          </a>
        </div>
      </main>
    </>
  );
}

export default function App() {
  const [adminSession, setAdminSession] = useState<AdminSession | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("test-db") === "true") {
      navigate("/database-test", { replace: true });
    }
  }, [navigate]);

  const handleBookNow = () => {
    navigate("/book");
    window.scrollTo(0, 0);
  };

  const handleCloseBooking = () => {
    navigate("/");
    window.scrollTo(0, 0);
  };

  const handleAdminLogin = () => {
    navigate("/portal");
    window.scrollTo(0, 0);
  };

  const handleLoginSuccess = (session: {
    id: number;
    token: string;
    username: string;
    role: UserRole;
    roleLabel?: string;
    permissions?: Partial<RolePermissions>;
  }) => {
    const normalizedRole = normalizeUserRole(session.role);
    setAdminSession({
      id: session.id,
      token: session.token,
      username: session.username,
      role: normalizedRole,
      roleLabel: session.roleLabel || normalizedRole,
      permissions: sanitizeRolePermissions(session.permissions),
    });
    navigate("/admin", { replace: true });
  };

  const handleAdminLogout = () => {
    setAdminSession(null);
    navigate("/", { replace: true });
    window.scrollTo(0, 0);
  };

  return (
    <>
      <Routes>
        <Route
          path="/"
          element={
            <HomePage
              onBookNow={handleBookNow}
              onAdminLogin={handleAdminLogin}
            />
          }
        />
        <Route
          path="/services"
          element={
            <ServicesPage
              onBookNow={handleBookNow}
              onAdminLogin={handleAdminLogin}
            />
          }
        />
        <Route
          path="/about"
          element={
            <AboutPage
              onBookNow={handleBookNow}
              onAdminLogin={handleAdminLogin}
            />
          }
        />
        <Route
          path="/team"
          element={
            <TeamPage
              onBookNow={handleBookNow}
              onAdminLogin={handleAdminLogin}
            />
          }
        />
        <Route
          path="/testimonials"
          element={
            <TestimonialsPage
              onBookNow={handleBookNow}
              onAdminLogin={handleAdminLogin}
            />
          }
        />
        <Route
          path="/contact"
          element={
            <ContactPage
              onBookNow={handleBookNow}
              onAdminLogin={handleAdminLogin}
            />
          }
        />
        <Route
          path="/book"
          element={
            <BookingPage
              onClose={handleCloseBooking}
              onAdminLogin={handleAdminLogin}
            />
          }
        />
        <Route
          path="/portal"
          element={
            <PortalPage
              onClose={() => navigate("/")}
              onLoginSuccess={handleLoginSuccess}
            />
          }
        />
        <Route
          path="/admin"
          element={
            adminSession ? (
              <>
                <SeoHead config={SEO_ROUTE_MAP["/admin"]} />
                <Suspense
                  fallback={<div className="p-8">Loading dashboard...</div>}
                >
                  <AdminDashboard
                    onClose={handleAdminLogout}
                    authToken={adminSession.token}
                    currentUserId={adminSession.id}
                    currentUserName={adminSession.username}
                    currentUserRole={adminSession.role}
                    currentUserRoleLabel={adminSession.roleLabel}
                    currentUserPermissions={adminSession.permissions}
                  />
                </Suspense>
              </>
            ) : (
              <Navigate to="/portal" replace />
            )
          }
        />
        <Route
          path="/database-test"
          element={
            <>
              <SeoHead
                config={{
                  ...SEO_ROUTE_MAP["/admin"],
                  path: "/database-test",
                  title: "Database Test | DentX Quarters",
                }}
              />
              <Suspense
                fallback={<div className="p-8">Loading test utility...</div>}
              >
                <DatabaseTest />
              </Suspense>
            </>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Toaster />
    </>
  );
}
