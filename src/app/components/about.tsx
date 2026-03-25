import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Check } from "lucide-react";
import lonwaboImage from "../../assets/843025586d10285069acad2c3cbf7e6f04613d51.png";

export function About() {
  return (
    <section id="about" className="py-20 bg-[#F5F1E8]">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <p className="text-[#9A7B1D] uppercase tracking-wide text-sm mb-2">
            About DentX Quarters
          </p>
          <h2 className="text-4xl mb-4">
            Integrated health care, crafted around every patient.
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-12">
          {/* Image */}
          <div className="order-2 lg:order-1">
            <div className="relative">
              <img
                src={lonwaboImage}
                alt="Professional dental care"
                className="rounded-2xl shadow-2xl w-full"
              />
            </div>
          </div>

          {/* Content */}
          <div className="order-1 lg:order-2">
            <p className="text-lg text-gray-700 mb-6">
              We're more than a clinic – we are a health ecosystem that promotes
              healing, prevention, and performance.
            </p>
            <p className="text-lg text-gray-700 mb-6">
              At DentX Quarters, we're a premier healthcare destination
              integrating exceptional dental and medical services under one
              roof. Our state-of-the-art facility provides a comfortable
              environment for comprehensive care, addressing oral and overall
              health needs through services like Dental Care, General Medicine,
              IV Therapy, and Physiotherapy.
            </p>
            <p className="text-lg text-gray-700 mb-8">
              With experienced professionals dedicated to personalised care, we
              listen to our patients' concerns and provide tailored solutions.
              Believing that good health starts with a healthy smile, our
              integrated approach empowers patients to achieve optimal health
              and wellness.
            </p>
          </div>
        </div>

        {/* Value Proposition & Goals */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="border-[#E8E2D5]">
            <CardHeader>
              <p className="text-[#9A7B1D] uppercase tracking-wide text-sm mb-2">
                Our Value Proposition
              </p>
              <CardTitle className="text-2xl">
                DentX Quarters is your integrated health ecosystem.
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-6">
                DentX Quarters is more than a clinic—it's a health ecosystem
                that promotes healing, prevention, and performance.
              </p>
              <div className="space-y-4">
                <div>
                  <h4 className="mb-2">Key Differentiators:</h4>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-[#9A7B1D] flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-medium">
                          Integrated Multispecialty Care:
                        </span>
                        <span className="text-gray-600">
                          {" "}
                          All core services in one location to ensure continuity
                          and ease.
                        </span>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-[#9A7B1D] flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-medium">
                          Patient-Centred Model:
                        </span>
                        <span className="text-gray-600">
                          {" "}
                          Personalised treatment plans and collaborative care
                          across departments.
                        </span>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-[#9A7B1D] flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-medium">Hybrid Approach:</span>
                        <span className="text-gray-600">
                          {" "}
                          Bridging clinical care with wellness services like IV
                          therapy for holistic healing.
                        </span>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-[#9A7B1D] flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-medium">Experienced Team:</span>
                        <span className="text-gray-600">
                          {" "}
                          Certified professionals, advanced technology, and
                          evidence-based care.
                        </span>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#E8E2D5]">
            <CardHeader>
              <p className="text-[#9A7B1D] uppercase tracking-wide text-sm mb-2">
                Strategic Goals
              </p>
              <CardTitle className="text-2xl">
                Building healthier communities, one patient at a time.
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#9A7B1D] text-white flex items-center justify-center flex-shrink-0 text-sm">
                    •
                  </div>
                  <div>
                    <span className="font-medium">
                      Improve Access to Integrated Care:
                    </span>
                    <span className="text-gray-600">
                      {" "}
                      Reduce fragmentation by offering cross-functional
                      services.
                    </span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#9A7B1D] text-white flex items-center justify-center flex-shrink-0 text-sm">
                    •
                  </div>
                  <div>
                    <span className="font-medium">
                      Enhance Patient Experience:
                    </span>
                    <span className="text-gray-600">
                      {" "}
                      Provide seamless transitions between departments with a
                      unified patient record.
                    </span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#9A7B1D] text-white flex items-center justify-center flex-shrink-0 text-sm">
                    •
                  </div>
                  <div>
                    <span className="font-medium">
                      Promote Preventive Health:
                    </span>
                    <span className="text-gray-600">
                      {" "}
                      Focus on wellness and prevention through education and
                      proactive services.
                    </span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#9A7B1D] text-white flex items-center justify-center flex-shrink-0 text-sm">
                    •
                  </div>
                  <div>
                    <span className="font-medium">
                      Support Community Health:
                    </span>
                    <span className="text-gray-600">
                      {" "}
                      Drive outreach, partnerships, and health awareness
                      initiatives.
                    </span>
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
