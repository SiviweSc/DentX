import { Card, CardContent } from "./ui/card";
import { MapPin, Phone, Mail, Clock, Instagram } from "lucide-react";

export function Contact() {
  return (
    <section id="contact" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <p className="text-[#9A7B1D] uppercase tracking-wide text-sm mb-2">
            Contact Us
          </p>
          <h2 className="text-4xl mb-4">Visit Us</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            At DentX, we're here to assist you with all your dentistry needs.
            Whether you have questions, need consultation, or require our expert
            services, our team is at your service.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-[#E8E2D5]">
            <CardContent className="p-6">
              <div className="w-12 h-12 rounded-lg bg-[#F5F1E8] flex items-center justify-center mb-4">
                <MapPin className="w-6 h-6 text-[#9A7B1D]" />
              </div>
              <h3 className="text-lg mb-2">Our Address</h3>
              <p className="text-gray-600 text-sm">
                <a
                  href="https://www.google.com/maps/search/?api=1&query=Shop+F1A+City+Centre+Shopping+Centre+5+Andrew+Street+Nelspruit+Extension+7+1200"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#9A7B1D] transition-colors"
                >
                  Shop F1A
                  <br />
                  City Centre Shopping Centre
                  <br />
                  5 Andrew Street
                  <br />
                  Nelspruit Extension 7
                  <br />
                  1200
                </a>
              </p>
              <a
                href="https://waze.com/ul?q=Shop+F1A+City+Centre+Shopping+Centre+5+Andrew+Street+Nelspruit+Extension+7+1200&navigate=yes"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-gray-500 hover:text-[#9A7B1D] transition-colors inline-block mt-2"
              >
                Open in Waze
              </a>
            </CardContent>
          </Card>

          <Card className="border-[#E8E2D5]">
            <CardContent className="p-6">
              <div className="w-12 h-12 rounded-lg bg-[#F5F1E8] flex items-center justify-center mb-4">
                <Phone className="w-6 h-6 text-[#9A7B1D]" />
              </div>
              <h3 className="text-lg mb-2">Our Number</h3>
              <p className="text-gray-600 text-sm mb-2">
                <a
                  href="tel:+27685340763"
                  className="hover:text-[#9A7B1D] transition-colors"
                >
                  +27 68 534 0763
                </a>
              </p>
              <p className="text-xs text-gray-500">
                Same-day call-backs (Mon-Sat)
              </p>
            </CardContent>
          </Card>

          <Card className="border-[#E8E2D5]">
            <CardContent className="p-6">
              <div className="w-12 h-12 rounded-lg bg-[#F5F1E8] flex items-center justify-center mb-4">
                <Mail className="w-6 h-6 text-[#9A7B1D]" />
              </div>
              <h3 className="text-lg mb-2">Our Email</h3>
              <p className="text-gray-600 text-sm">
                <a
                  href="mailto:admin@dentxquarters.co.za"
                  className="hover:text-[#9A7B1D] transition-colors block mb-1"
                >
                  admin@dentxquarters.co.za
                </a>
                <a
                  href="mailto:info@dentxquarters.co.za"
                  className="hover:text-[#9A7B1D] transition-colors block"
                >
                  info@dentxquarters.co.za
                </a>
              </p>
            </CardContent>
          </Card>

          <Card className="border-[#E8E2D5]">
            <CardContent className="p-6">
              <div className="w-12 h-12 rounded-lg bg-[#F5F1E8] flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-[#9A7B1D]" />
              </div>
              <h3 className="text-lg mb-2">Our Open Hours</h3>
              <p className="text-gray-600 text-sm">
                <span className="block mb-1">Monday to Friday</span>
                <span className="block mb-2">8:30 AM - 16:30 PM</span>
                <span className="block mb-1">Saturday</span>
                <span className="block mb-2">9 AM - 13:30 PM</span>
                <span className="block">Sunday: Closed</span>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
