import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Shield, Stethoscope, Zap, Heart } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  DEFAULT_AVAILABILITY_CONFIG,
  fetchAvailabilityConfig,
  fetchServiceCatalog,
  isServiceEnabled,
  SERVICE_CATALOG,
} from "../lib/availability";

interface ServicesProps {
  onBookNow: () => void;
}

const SERVICE_PRESENTATION: Record<
  string,
  { icon: LucideIcon; description: string; color: string }
> = {
  dental: {
    icon: Shield,
    description:
      "Comprehensive oral health services including checkups, cleanings, fillings, root canals, and extractions.",
    color: "text-[#9A7B1D]",
  },
  medical: {
    icon: Stethoscope,
    description:
      "Primary healthcare services for your overall wellbeing and health management.",
    color: "text-[#9A7B1D]",
  },
  "iv-therapy": {
    icon: Zap,
    description:
      "Wellness and recovery treatments including hydration, vitamin boosts, and immunity support.",
    color: "text-[#9A7B1D]",
  },
  physiotherapy: {
    icon: Heart,
    description:
      "Professional rehabilitation and treatment for injuries, pain management, and mobility improvement.",
    color: "text-[#9A7B1D]",
  },
};

export function Services({ onBookNow }: ServicesProps) {
  const [availabilityConfig, setAvailabilityConfig] = useState(
    DEFAULT_AVAILABILITY_CONFIG,
  );
  const [serviceCatalog, setServiceCatalog] = useState(SERVICE_CATALOG);
  const [availabilityLoading, setAvailabilityLoading] = useState(true);

  useEffect(() => {
    const loadAvailability = async () => {
      setAvailabilityLoading(true);
      setAvailabilityConfig(await fetchAvailabilityConfig());
      setAvailabilityLoading(false);
    };

    loadAvailability();
  }, []);

  useEffect(() => {
    const loadServiceCatalog = async () => {
      setServiceCatalog(await fetchServiceCatalog());
    };

    void loadServiceCatalog();
  }, []);

  const activeServices = serviceCatalog
    .filter((service) => isServiceEnabled(availabilityConfig, service.id))
    .map((service) => {
      const meta = SERVICE_PRESENTATION[service.id] || {
        icon: Stethoscope,
        description: "Integrated healthcare service tailored to your needs.",
        color: "text-[#9A7B1D]",
      };

      return {
        ...service,
        ...meta,
      };
    });

  return (
    <section id="services" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <p className="text-[#9A7B1D] uppercase tracking-wide text-sm mb-2">
            Our Services
          </p>
          <h2 className="text-4xl mb-4">Integrated Health Care</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            We're more than a clinic – we are a health ecosystem that promotes
            healing, prevention, and performance.
          </p>
        </div>

        {availabilityLoading ? (
          <div className="text-center py-12 text-gray-500">
            Loading services...
          </div>
        ) : activeServices.length === 0 ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center text-amber-800 mb-12">
            Online bookings are currently unavailable. Please contact the
            practice directly.
          </div>
        ) : (
          <div
            className={`grid gap-6 mb-12 ${
              activeServices.length === 1
                ? "grid-cols-1 justify-items-center"
                : activeServices.length === 2
                  ? "grid-cols-1 md:grid-cols-2 justify-items-center"
                  : "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
            }`}
          >
            {activeServices.map((service, index) => {
              const Icon = service.icon;
              const isSingleItem = activeServices.length === 1;
              return (
                <Card
                  key={index}
                  className={`hover:shadow-lg transition-shadow border-[#E8E2D5] ${
                    isSingleItem ? "w-full max-w-sm" : ""
                  }`}
                >
                  <CardHeader className="text-center">
                    <div
                      className={`w-12 h-12 rounded-lg bg-[#F5F1E8] flex items-center justify-center mb-4 mx-auto ${service.color}`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <CardTitle className="text-xl">{service.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <CardDescription className="text-gray-600">
                      {service.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <div className="text-center">
          <Button
            size="lg"
            onClick={onBookNow}
            disabled={!availabilityLoading && activeServices.length === 0}
            className="bg-[#9A7B1D] hover:bg-[#7d6418]"
          >
            Schedule Your Visit Today
          </Button>
        </div>
      </div>
    </section>
  );
}
