import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import {
  Sparkles,
  Shield,
  Smile,
  Stethoscope,
  Scissors,
  Zap,
  Heart,
  Star,
} from "lucide-react";

interface ServicesProps {
  onBookNow: () => void;
}

const services = [
  {
    icon: Shield,
    title: "Dental Care",
    description: "Comprehensive oral health services including checkups, cleanings, fillings, root canals, and extractions.",
    color: "text-[#9A7B1D]",
  },
  {
    icon: Stethoscope,
    title: "General Medicine",
    description: "Primary healthcare services for your overall wellbeing and health management.",
    color: "text-[#9A7B1D]",
  },
  {
    icon: Zap,
    title: "IV Drip Therapy",
    description: "Wellness and recovery treatments including hydration, vitamin boosts, and immunity support.",
    color: "text-[#9A7B1D]",
  },
  {
    icon: Heart,
    title: "Physiotherapy",
    description: "Professional rehabilitation and treatment for injuries, pain management, and mobility improvement.",
    color: "text-[#9A7B1D]",
  },
];

export function Services({ onBookNow }: ServicesProps) {
  return (
    <section id="services" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <p className="text-[#9A7B1D] uppercase tracking-wide text-sm mb-2">Our Services</p>
          <h2 className="text-4xl mb-4">Integrated Health Care</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            We're more than a clinic – we are a health ecosystem that promotes healing, prevention, and performance.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow border-[#E8E2D5]">
                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg bg-[#F5F1E8] flex items-center justify-center mb-4 ${service.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <CardTitle className="text-xl">{service.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600">{service.description}</CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center">
          <Button size="lg" onClick={onBookNow} className="bg-[#9A7B1D] hover:bg-[#7d6418]">
            Schedule Your Visit Today
          </Button>
        </div>
      </div>
    </section>
  );
}