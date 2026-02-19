import { useState } from "react";
import { Button } from "./ui/button";
import { Menu, X, Phone, Calendar } from "lucide-react";
import logo from "../../assets/cadae8615ee9587c8f09fa141332814475e43e29.png";

interface HeaderProps {
  onBookNow: () => void;
}

export function Header({ onBookNow }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setMobileMenuOpen(false);
    }
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50 border-b border-[#E8E2D5]">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex-shrink-0">
            <img
              src={logo}
              alt="DentX Quarters Logo"
              className="h-16 sm:h-20"
            />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="text-gray-700 hover:text-[#9A7B1D] transition-colors"
            >
              Home
            </button>
            <button
              onClick={() => scrollToSection("services")}
              className="text-gray-700 hover:text-[#9A7B1D] transition-colors"
            >
              Services
            </button>
            <button
              onClick={() => scrollToSection("about")}
              className="text-gray-700 hover:text-[#9A7B1D] transition-colors"
            >
              About
            </button>
            <button
              onClick={() => scrollToSection("team")}
              className="text-gray-700 hover:text-[#9A7B1D] transition-colors"
            >
              Team
            </button>
            <button
              onClick={() => scrollToSection("testimonials")}
              className="text-gray-700 hover:text-[#9A7B1D] transition-colors"
            >
              Testimonials
            </button>
            <button
              onClick={() => scrollToSection("contact")}
              className="text-gray-700 hover:text-[#9A7B1D] transition-colors"
            >
              Contact
            </button>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            <a
              href="tel:+27685340763"
              className="text-gray-700 hover:text-[#9A7B1D] transition-colors"
            >
              <Phone className="w-5 h-5" />
            </a>
            <Button
              onClick={onBookNow}
              className="bg-[#9A7B1D] hover:bg-[#7d6418]"
            >
              <Calendar className="mr-2 h-4 w-4" />
              Book Appointment
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-[#E8E2D5]">
            <nav className="flex flex-col gap-4">
              <button
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: "smooth" });
                  setMobileMenuOpen(false);
                }}
                className="text-gray-700 hover:text-[#9A7B1D] transition-colors text-left"
              >
                Home
              </button>
              <button
                onClick={() => scrollToSection("services")}
                className="text-gray-700 hover:text-[#9A7B1D] transition-colors text-left"
              >
                Services
              </button>
              <button
                onClick={() => scrollToSection("about")}
                className="text-gray-700 hover:text-[#9A7B1D] transition-colors text-left"
              >
                About
              </button>
              <button
                onClick={() => scrollToSection("team")}
                className="text-gray-700 hover:text-[#9A7B1D] transition-colors text-left"
              >
                Team
              </button>
              <button
                onClick={() => scrollToSection("testimonials")}
                className="text-gray-700 hover:text-[#9A7B1D] transition-colors text-left"
              >
                Testimonials
              </button>
              <button
                onClick={() => scrollToSection("contact")}
                className="text-gray-700 hover:text-[#9A7B1D] transition-colors text-left"
              >
                Contact
              </button>
              <Button
                onClick={onBookNow}
                className="w-full mt-4 bg-[#9A7B1D] hover:bg-[#7d6418]"
              >
                <Calendar className="mr-2 h-4 w-4" />
                Book Appointment
              </Button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
