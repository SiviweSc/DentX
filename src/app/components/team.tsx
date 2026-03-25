import { Card, CardContent } from "./ui/card";
import { Stethoscope, Heart, Activity, Briefcase, Users, ClipboardList, UserCircle } from "lucide-react";

const team = [
  {
    name: "Dr. Lonwabo Magadla",
    role: "Lead Dentist",
    specialization: "BChD (UP), BMedSci (WSU)",
    icon: Stethoscope,
  },
  {
    name: "Dr. Banele Mhlongo",
    role: "General Practitioner",
    specialization: "MBChB (UCT)",
    icon: Stethoscope,
  },
  {
    name: "Vuyiswa Zwane",
    role: "Dental Therapist",
    specialization: "Preventive & Restorative Care",
    icon: Heart,
  },
  {
    name: "Yoliswa Nibe",
    role: "Physiotherapist",
    specialization: "Rehabilitation & Pain Management",
    icon: Activity,
  },
  {
    name: "Lloyd Masiya",
    role: "Practice Manager & Marketing",
    specialization: "Operations & Patient Care",
    icon: Briefcase,
  },
  {
    name: "Zinhle Maseko",
    role: "HR & Administration Manager",
    specialization: "Team Support",
    icon: Users,
  },
  {
    name: "Nombuso Nyalunga",
    role: "Dental Therapist",
    specialization: "Patient Care",
    icon: Heart,
  },
  {
    name: "Bianca Khumalo",
    role: "Clinical Associate",
    specialization: "Medical Services",
    icon: ClipboardList,
  },
];

export function Team() {
  return (
    <section id="team" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <p className="text-[#9A7B1D] uppercase tracking-wide text-sm mb-2">Our People</p>
          <h2 className="text-4xl mb-4">Meet the DentX Quarters team.</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Behind every patient story is a team of dedicated professionals – dentists, doctors, therapists, and support staff – working together to deliver a seamless, human-centred experience.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {team.map((member, index) => {
            const Icon = member.icon;
            return (
              <Card key={index} className="overflow-hidden hover:shadow-xl transition-shadow border-[#E8E2D5]">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 bg-[#F5F1E8] rounded-full flex items-center justify-center flex-shrink-0">
                      <Icon className="w-8 h-8 text-[#9A7B1D]" strokeWidth={1.5} />
                    </div>
                    <div>
                      <h3 className="text-xl mb-1">{member.name}</h3>
                      <p className="text-[#9A7B1D] text-sm font-medium">{member.role}</p>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm">{member.specialization}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}