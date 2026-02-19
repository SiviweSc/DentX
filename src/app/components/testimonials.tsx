import { Card, CardContent } from "./ui/card";
import { Star } from "lucide-react";
import { useState } from "react";

const testimonials = [
  {
    name: "Phumla Nkosi",
    rating: 5,
    text: "I'm one who's always been petrified of visiting the dentist, but that's a thing of the past. Dr. Magadla really makes each visit a cheerful one, especially with the music he plays!",
    date: "18 weeks ago",
  },
  {
    name: "Madikiza Aphelele",
    rating: 5,
    text: "Great service. I got my braces at Dentx Quarters and I have to say the Doctor is super kind, professional with great time management and his work is phenomenal which puts me at ease. The front line staff are also very friendly and have great communication.",
    date: "18 weeks ago",
  },
  {
    name: "Makaziwe Lubisi",
    rating: 5,
    text: "Dr Magadla is amaziiing. Love the staff, the service & cute space 😁",
    date: "18 weeks ago",
  },
  {
    name: "Winepress TV",
    rating: 5,
    text: "I had an amazing experience at Dent Quarters. From the moment I walked in, Dr Lonwabo Magadla and the entire team were welcoming, knowledgeable, and went above and beyond to make me feel comfortable. The service I received was outstanding — their attention to detail, teamwork, and the high quality of their equipment truly impressed me.",
    date: "18 weeks ago",
  },
  {
    name: "LadyNK Ntokozo",
    rating: 5,
    text: "The place is absolutely stunning, very professional service with such gentleness",
    date: "18 weeks ago",
  },
  {
    name: "Panashe Mutepfa",
    rating: 5,
    text: "Very modern and sleek practice.... Highly recommend the team at DentX 😁😁😁",
    date: "18 weeks ago",
  },
  {
    name: "Nosipho Fakude",
    rating: 5,
    text: "What a beautiful space. Staff is very friendly and helpful. The dentist and dental therapist are kind, gentle and very efficient. Waiting time is not too long. I've personally visited the practise several times for cleaning, fillings and extractions and I've always left happy. Highly recommend this place to everyone who is looking for a very good dentist in nelspruit.",
    date: "18 weeks ago",
  },
];

function TestimonialCard({ testimonial }: { testimonial: typeof testimonials[0] }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const maxLength = 120;
  const shouldTruncate = testimonial.text.length > maxLength;
  const displayText = isExpanded || !shouldTruncate 
    ? testimonial.text 
    : testimonial.text.slice(0, maxLength) + "...";

  return (
    <Card className="flex-shrink-0 w-80 h-full hover:shadow-lg transition-shadow border-[#E8E2D5]">
      <CardContent className="p-6 flex flex-col h-full">
        <div className="flex gap-1 mb-4">
          {[...Array(testimonial.rating)].map((_, i) => (
            <Star key={i} className="w-4 h-4 fill-[#9A7B1D] text-[#9A7B1D]" />
          ))}
        </div>
        <div className="flex-1 mb-4">
          <p className="text-gray-700 text-sm leading-relaxed">
            {displayText}
          </p>
          {shouldTruncate && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-[#9A7B1D] text-xs font-medium mt-2 hover:underline"
            >
              {isExpanded ? "Read less" : "Read more"}
            </button>
          )}
        </div>
        <div className="border-t border-[#E8E2D5] pt-4">
          <p className="text-sm font-medium">{testimonial.name}</p>
          <p className="text-xs text-gray-500">{testimonial.date}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function Testimonials() {
  return (
    <section id="testimonials" className="py-20 bg-[#F5F1E8] overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <p className="text-[#9A7B1D] uppercase tracking-wide text-sm mb-2">Testimonials</p>
          <h2 className="text-4xl mb-4">What Our Patients Say</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Don't just take our word for it - hear from our satisfied patients
          </p>
        </div>

        {/* Horizontal Scrolling Container */}
        <div className="relative">
          <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory" 
               style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {testimonials.map((testimonial, index) => (
              <TestimonialCard key={index} testimonial={testimonial} />
            ))}
          </div>
          
          {/* Scroll Hint for Mobile */}
          <div className="text-center mt-4 text-sm text-gray-500 md:hidden">
            ← Swipe to see more reviews →
          </div>
        </div>
      </div>
    </section>
  );
}