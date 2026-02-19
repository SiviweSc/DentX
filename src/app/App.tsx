import { useState } from "react";
import { Header } from "./components/header";
import { Hero } from "./components/hero";
import { Services } from "./components/services";
import { About } from "./components/about";
import { Team } from "./components/team";
import { Testimonials } from "./components/testimonials";
import { Contact } from "./components/contact";
import { Footer } from "./components/footer";
import { BookingFormNew } from "./components/booking-form-new";

export default function App() {
  const [showBookingForm, setShowBookingForm] = useState(false);

  const handleBookNow = () => {
    setShowBookingForm(true);
    window.scrollTo(0, 0);
  };

  const handleCloseBooking = () => {
    setShowBookingForm(false);
    window.scrollTo(0, 0);
  };

  // Show booking form as full page
  if (showBookingForm) {
    return <BookingFormNew onClose={handleCloseBooking} />;
  }

  // Show main website
  return (
    <div className="min-h-screen bg-white">
      <Header onBookNow={handleBookNow} />
      <Hero onBookNow={handleBookNow} />
      <Services onBookNow={handleBookNow} />
      <About />
      <Team />
      <Testimonials />
      <Contact />
      <Footer />
    </div>
  );
}
