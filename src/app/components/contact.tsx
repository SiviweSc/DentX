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
                Shop F1A
                <br />
                City Centre Shopping Centre
                <br />
                5 Andrew Street
                <br />
                Nelspruit Extension 7<br />
                1200
              </p>
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

        {/* Instagram Feed */}
        <div className="mt-12">
          {/* <div className="text-center mb-8">
            <h3 className="text-2xl mb-2">Follow Us on Instagram</h3>
            <p className="text-gray-600">@dentxquarters</p>
          </div> */}

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {/* Instagram Post 1 */}
            {/* <a
              href="https://www.instagram.com/reel/DHnq23nMKIk/"
              target="_blank"
              rel="noopener noreferrer"
              className="relative aspect-square rounded-lg overflow-hidden group cursor-pointer bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500"
            >
              <iframe
                src="https://www.instagram.com/reel/DHnq23nMKIk/embed"
                className="w-full h-full border-0"
                title="Instagram post"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center pointer-events-none">
                <Instagram className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </a> */}

            {/* Instagram Post 2 */}
            {/* <a
              href="https://www.instagram.com/reel/DHnq23nMKIk/"
              target="_blank"
              rel="noopener noreferrer"
              className="relative aspect-square rounded-lg overflow-hidden group cursor-pointer bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500"
            >
              <iframe
                src="https://www.instagram.com/reel/DRB8dtSjXCX/?igsh=dmZvYTMyMTUwMnMx"
                className="w-full h-full border-0"
                title="Instagram post"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center pointer-events-none">
                <Instagram className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </a> */}

            {/* Instagram Post 3 */}
            {/* <a
              href="https://www.instagram.com/dentxquarters/"
              target="_blank"
              rel="noopener noreferrer"
              className="relative aspect-square rounded-lg overflow-hidden group cursor-pointer bg-[#F5F1E8] flex items-center justify-center"
            >
              <div className="text-center p-6">
                <Instagram className="w-12 h-12 text-[#9A7B1D] mx-auto mb-3" />
                <p className="text-sm text-gray-600">View More on Instagram</p>
              </div>
            </a> */}

            {/* Instagram Post 4 */}
            {/* <a
              href="https://www.instagram.com/dentxquarters/"
              target="_blank"
              rel="noopener noreferrer"
              className="relative aspect-square rounded-lg overflow-hidden group cursor-pointer bg-[#F5F1E8] flex items-center justify-center"
            >
              <div className="text-center p-6">
                <Instagram className="w-12 h-12 text-[#9A7B1D] mx-auto mb-3" />
                <p className="text-sm text-gray-600">View More on Instagram</p>
              </div>
            </a> */}

            {/* Instagram Post 5 */}
            {/* <a
              href="https://www.instagram.com/dentxquarters/"
              target="_blank"
              rel="noopener noreferrer"
              className="relative aspect-square rounded-lg overflow-hidden group cursor-pointer bg-[#F5F1E8] flex items-center justify-center"
            >
              <div className="text-center p-6">
                <Instagram className="w-12 h-12 text-[#9A7B1D] mx-auto mb-3" />
                <p className="text-sm text-gray-600">View More on Instagram</p>
              </div>
            </a> */}

            {/* Instagram Post 6 */}
            {/* <a
              href="https://www.instagram.com/dentxquarters/"
              target="_blank"
              rel="noopener noreferrer"
              className="relative aspect-square rounded-lg overflow-hidden group cursor-pointer bg-[#F5F1E8] flex items-center justify-center"
            >
              <div className="text-center p-6">
                <Instagram className="w-12 h-12 text-[#9A7B1D] mx-auto mb-3" />
                <p className="text-sm text-gray-600">View More on Instagram</p>
              </div>
            </a> */}
          </div>

          <div className="text-center mt-8">
            <a
              href="https://www.instagram.com/dentxquarters/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 text-white rounded-lg hover:shadow-lg transition-all"
            >
              <Instagram className="w-5 h-5" />
              Follow Us on Instagram
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
