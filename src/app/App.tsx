import { useState, useEffect } from "react";
import { Header } from "./components/header";
import { Hero } from "./components/hero";
import { Services } from "./components/services";
import { About } from "./components/about";
import { Team } from "./components/team";
import { Testimonials } from "./components/testimonials";
import { Contact } from "./components/contact";
import { Footer } from "./components/footer";
import { BookingForm } from "./components/booking-form";
import { AdminDashboard } from "./components/admin-dashboard-new";
import { DatabaseTest } from "./components/database-test";
import { AccessPortal } from "./components/access-portal";
import { Toaster } from "./components/ui/sonner";
import {
  normalizeUserRole,
  sanitizeRolePermissions,
  type RolePermissions,
  type UserRole,
} from "./lib/roles";

interface AdminSession {
  token: string;
  username: string;
  role: UserRole;
  roleLabel: string;
  permissions: RolePermissions;
}

export default function App() {
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [showAccessPortal, setShowAccessPortal] = useState(false);
  const [adminSession, setAdminSession] = useState<AdminSession | null>(null);
  const [showDatabaseTest, setShowDatabaseTest] = useState(false);

  // Check for ?test-db URL parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("test-db") === "true") {
      setShowDatabaseTest(true);
    }
  }, []);

  const handleBookNow = () => {
    setShowBookingForm(true);
    window.scrollTo(0, 0);
  };

  const handleCloseBooking = () => {
    setShowBookingForm(false);
    window.scrollTo(0, 0);
  };

  const handleAdminLogin = () => {
    setShowAccessPortal(true);
    window.scrollTo(0, 0);
  };

  const handleLoginSuccess = (session: {
    token: string;
    username: string;
    role: UserRole;
    roleLabel?: string;
    permissions?: Partial<RolePermissions>;
  }) => {
    const normalizedRole = normalizeUserRole(session.role);
    setAdminSession({
      token: session.token,
      username: session.username,
      role: normalizedRole,
      roleLabel: session.roleLabel || normalizedRole,
      permissions: sanitizeRolePermissions(session.permissions),
    });
    setShowAccessPortal(false);
  };

  const handleAdminLogout = () => {
    setAdminSession(null);
    window.scrollTo(0, 0);
  };

  // Show admin dashboard if logged in
  if (adminSession) {
    return (
      <>
        <AdminDashboard
          onClose={handleAdminLogout}
          authToken={adminSession.token}
          currentUserName={adminSession.username}
          currentUserRole={adminSession.role}
          currentUserRoleLabel={adminSession.roleLabel}
          currentUserPermissions={adminSession.permissions}
        />
        <Toaster />
      </>
    );
  }

  // Show database test tool
  if (showDatabaseTest) {
    return (
      <>
        <DatabaseTest />
        <Toaster />
      </>
    );
  }

  // Show access portal as full page
  if (showAccessPortal) {
    return (
      <>
        <AccessPortal
          onClose={() => setShowAccessPortal(false)}
          onLoginSuccess={handleLoginSuccess}
        />
        <Toaster />
      </>
    );
  }

  // Show booking form as full page
  if (showBookingForm) {
    return (
      <>
        <BookingForm onClose={handleCloseBooking} />
        <Toaster />
      </>
    );
  }

  // Show main website
  return (
    <>
      <div className="min-h-screen bg-white">
        <Header onBookNow={handleBookNow} />
        <Hero onBookNow={handleBookNow} />
        <Services onBookNow={handleBookNow} />
        <About />
        <Team />
        <Testimonials />
        <Contact />
        <Footer onAdminLogin={handleAdminLogin} />
      </div>
      <Toaster />
    </>
  );
}
