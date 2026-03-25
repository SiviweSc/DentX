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
import { AdminLogin } from "./components/admin-login";
import { AdminDashboard } from "./components/admin-dashboard";
import { DatabaseTest } from "./components/database-test";
import { Toaster } from "./components/ui/sonner";

export default function App() {
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminToken, setAdminToken] = useState<string | null>(null);
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
    setShowAdminLogin(true);
  };

  const handleLoginSuccess = (token: string) => {
    setAdminToken(token);
  };

  const handleAdminLogout = () => {
    setAdminToken(null);
    window.scrollTo(0, 0);
  };

  // Show admin dashboard if logged in
  if (adminToken) {
    return (
      <>
        <AdminDashboard onClose={handleAdminLogout} authToken={adminToken} />
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
      <AdminLogin
        open={showAdminLogin}
        onOpenChange={setShowAdminLogin}
        onLoginSuccess={handleLoginSuccess}
      />
      <Toaster />
    </>
  );
}
