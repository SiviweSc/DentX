import { Facebook, Instagram, Twitter, Linkedin } from "lucide-react";
import logo from "../../assets/cadae8615ee9587c8f09fa141332814475e43e29.png";

export function Footer() {
  return (
    <footer className="bg-[#1A1A1A] text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <img src={logo} alt="DentX Quarters Logo" className="h-16 mb-4" />
            <p className="text-gray-400 text-sm mb-4">
              Perfection meets Dentistry. Your integrated health ecosystem
              promoting healing, prevention, and performance.
            </p>
            <div className="flex gap-4">
              <a
                href="#"
                className="text-gray-400 hover:text-[#9A7B1D] transition-colors"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-[#9A7B1D] transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-[#9A7B1D] transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-[#9A7B1D] transition-colors"
              >
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg mb-4 text-[#9A7B1D]">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="#services"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Services
                </a>
              </li>
              <li>
                <a
                  href="#about"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  About Us
                </a>
              </li>
              <li>
                <a
                  href="#team"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Our Team
                </a>
              </li>
              <li>
                <a
                  href="#testimonials"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Testimonials
                </a>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-lg mb-4 text-[#9A7B1D]">Our Services</h4>
            <ul className="space-y-2 text-sm">
              <li className="text-gray-400">Dental Care</li>
              <li className="text-gray-400">General Medicine</li>
              <li className="text-gray-400">IV Drip Therapy</li>
              <li className="text-gray-400">Physiotherapy</li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg mb-4 text-[#9A7B1D]">Contact</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>Shop F1A, City Centre</li>
              <li>5 Andrew Street</li>
              <li>Nelspruit Extension 7, 1200</li>
              <li>
                <a
                  href="tel:+27685340763"
                  className="hover:text-white transition-colors"
                >
                  +27 68 534 0763
                </a>
              </li>
              <li>
                <a
                  href="mailto:info@dentxquarters.co.za"
                  className="hover:text-white transition-colors"
                >
                  info@dentxquarters.co.za
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
          <p>
            &copy; {new Date().getFullYear()} DentX Quarters. All rights
            reserved. | Perfection meets Dentistry
          </p>
        </div>
      </div>
    </footer>
  );
}
