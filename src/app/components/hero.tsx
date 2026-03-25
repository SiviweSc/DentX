import { Button } from "./ui/button";
import { Calendar, Phone, Check } from "lucide-react";

interface HeroProps {
  onBookNow: () => void;
}

export function Hero({ onBookNow }: HeroProps) {
  const scrollToContact = () => {
    const element = document.getElementById('contact');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative">
      {/* Hero Image Section */}
      <div className="relative h-[70vh] min-h-[500px] flex items-center justify-center">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1762625570087-6d98fca29531?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBkZW50YWwlMjBjbGluaWMlMjBpbnRlcmlvcnxlbnwxfHx8fDE3NzEzMjc1Mzl8MA&ixlib=rb-4.1.0&q=80&w=1080')`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-[#1A1A1A]/80 via-[#1A1A1A]/70 to-[#1A1A1A]/90" />
        </div>

        <div className="relative z-10 container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl text-white mb-6 max-w-4xl mx-auto">
            Providing <span className="relative inline-block">
              <span className="relative z-10">YOU</span>
              <span className="absolute bottom-2 left-0 right-0 h-3 bg-[#9A7B1D] -z-0"></span>
            </span> with integrated health care
          </h1>
          <p className="text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
            Zero-judgement, modern treatment and a friendly team committed to your wellbeing.
          </p>
        </div>
      </div>

      {/* Action Cards */}
      <div className="relative z-20 -mt-20 pb-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={onBookNow}
              className="bg-white/95 backdrop-blur-sm hover:bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all group text-left border border-[#E8E2D5]"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-[#F5F1E8] flex items-center justify-center flex-shrink-0 group-hover:bg-[#9A7B1D] transition-colors">
                  <Calendar className="w-6 h-6 text-[#9A7B1D] group-hover:text-white transition-colors" />
                </div>
                <div>
                  <h3 className="text-lg mb-1 text-[#1A1A1A] group-hover:text-[#9A7B1D] transition-colors">
                    Book your appointment
                  </h3>
                  <p className="text-sm text-gray-600">Schedule your visit today</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => window.open('https://wa.me/27685340763', '_blank')}
              className="bg-white/95 backdrop-blur-sm hover:bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all group text-left border border-[#E8E2D5]"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-[#F5F1E8] flex items-center justify-center flex-shrink-0 group-hover:bg-[#9A7B1D] transition-colors">
                  <Phone className="w-6 h-6 text-[#9A7B1D] group-hover:text-white transition-colors" />
                </div>
                <div>
                  <h3 className="text-lg mb-1 text-[#1A1A1A] group-hover:text-[#9A7B1D] transition-colors">
                    Chat with us
                  </h3>
                  <p className="text-sm text-gray-600">Quick WhatsApp support</p>
                </div>
              </div>
            </button>

            <button
              onClick={scrollToContact}
              className="bg-white/95 backdrop-blur-sm hover:bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all group text-left border border-[#E8E2D5]"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-[#F5F1E8] flex items-center justify-center flex-shrink-0 group-hover:bg-[#9A7B1D] transition-colors">
                  <Check className="w-6 h-6 text-[#9A7B1D] group-hover:text-white transition-colors" />
                </div>
                <div>
                  <h3 className="text-lg mb-1 text-[#1A1A1A] group-hover:text-[#9A7B1D] transition-colors">
                    Find our location
                  </h3>
                  <p className="text-sm text-gray-600">Visit us in Nelspruit</p>
                </div>
              </div>
            </button>

            <button
              onClick={onBookNow}
              className="bg-white/95 backdrop-blur-sm hover:bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all group text-left border border-[#E8E2D5]"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-[#F5F1E8] flex items-center justify-center flex-shrink-0 group-hover:bg-[#9A7B1D] transition-colors">
                  <Phone className="w-6 h-6 text-[#9A7B1D] group-hover:text-white transition-colors" />
                </div>
                <div>
                  <h3 className="text-lg mb-1 text-[#1A1A1A] group-hover:text-[#9A7B1D] transition-colors">
                    Request a call-back
                  </h3>
                  <p className="text-sm text-gray-600">We'll call you back</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-[#F5F1E8] py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-12 text-center">
            <div>
              <div className="text-4xl text-[#9A7B1D] mb-2">2</div>
              <div className="text-gray-700">Locations</div>
            </div>
            <div>
              <div className="text-4xl text-[#9A7B1D] mb-2">13+</div>
              <div className="text-gray-700">Team Members</div>
            </div>
            <div>
              <div className="text-4xl text-[#9A7B1D] mb-2">500+</div>
              <div className="text-gray-700">Consultations/Month</div>
            </div>
            <div>
              <div className="text-4xl text-[#9A7B1D] mb-2">4</div>
              <div className="text-gray-700">Health Services</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}