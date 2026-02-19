import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Calendar } from "./ui/calendar";
import {
  Check,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  Stethoscope,
  Activity,
  Zap,
  Heart,
  X,
  ArrowLeft,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { format } from "date-fns";
import logo from "../../assets/cadae8615ee9587c8f09fa141332814475e43e29.png";

interface BookingFormNewProps {
  onClose: () => void;
}

interface FormData {
  // Service Selection
  serviceType: string;
  practitionerType: string;

  // Appointment Details
  date: Date | undefined;
  time: string;
  reason: string;

  // Personal Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  idNumber: string;
  medicalAid: string;
  medicalAidNumber: string;
}

const SERVICES = [
  {
    id: "dental",
    title: "Dental Care",
    description: "Checkups, cleanings, fillings & more",
    icon: Activity,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    id: "medical",
    title: "General Medicine",
    description: "Primary healthcare services",
    icon: Stethoscope,
    color: "text-red-600",
    bgColor: "bg-red-50",
  },
  {
    id: "iv-therapy",
    title: "IV Drip Therapy",
    description: "Wellness & recovery treatments",
    icon: Zap,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
  },
  {
    id: "physiotherapy",
    title: "Physiotherapy",
    description: "Rehabilitation & pain management",
    icon: Heart,
    color: "text-green-600",
    bgColor: "bg-green-50",
  },
];

const PRACTITIONERS = {
  dental: [
    {
      id: "general-dentist",
      title: "General Dentist",
      icon: Activity,
      description: "Regular dental care",
    },
    {
      id: "dental-therapist",
      title: "Dental Therapist",
      icon: Activity,
      description: "Preventive care",
    },
    {
      id: "emergency",
      title: "Emergency Dental",
      icon: Zap,
      description: "Urgent care",
    },
    {
      id: "not-sure",
      title: "I'm not sure",
      icon: Stethoscope,
      description: "We'll help you decide",
    },
  ],
  medical: [
    {
      id: "general-practitioner",
      title: "General Practitioner",
      icon: Stethoscope,
      description: "Primary care doctor",
    },
    {
      id: "clinical-associate",
      title: "Clinical Associate",
      icon: Stethoscope,
      description: "Medical professional",
    },
    {
      id: "not-sure",
      title: "I'm not sure",
      icon: Stethoscope,
      description: "We'll help you decide",
    },
  ],
  "iv-therapy": [
    {
      id: "hydration",
      title: "Hydration Therapy",
      icon: Zap,
      description: "Rehydration treatment",
    },
    {
      id: "vitamin-boost",
      title: "Vitamin Boost",
      icon: Zap,
      description: "Energy & wellness",
    },
    {
      id: "immunity",
      title: "Immunity Support",
      icon: Heart,
      description: "Strengthen immune system",
    },
    {
      id: "consultation",
      title: "General Consultation",
      icon: Stethoscope,
      description: "Discuss options",
    },
  ],
  physiotherapy: [
    {
      id: "sports-injury",
      title: "Sports Injury",
      icon: Heart,
      description: "Athletic recovery",
    },
    {
      id: "pain-management",
      title: "Pain Management",
      icon: Heart,
      description: "Chronic pain relief",
    },
    {
      id: "rehabilitation",
      title: "Rehabilitation",
      icon: Activity,
      description: "Recovery therapy",
    },
    {
      id: "not-sure",
      title: "I'm not sure",
      icon: Stethoscope,
      description: "We'll help you decide",
    },
  ],
};

const TIME_SLOTS = [
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
];

export function BookingFormNew({ onClose }: BookingFormNewProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    serviceType: "",
    practitionerType: "",
    date: undefined,
    time: "",
    reason: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    idNumber: "",
    medicalAid: "",
    medicalAidNumber: "",
  });

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    // Get service and practitioner details
    const service = SERVICES.find((s) => s.id === formData.serviceType);
    const practitioner = PRACTITIONERS[
      formData.serviceType as keyof typeof PRACTITIONERS
    ]?.find((p) => p.id === formData.practitionerType);

    // Format the date
    const formattedDate = formData.date
      ? format(formData.date, "PPP")
      : "Not selected";

    // Create WhatsApp message
    const message = `*🦷 NEW APPOINTMENT REQUEST - DentX Quarters*

*Service Details:*
Service Type: ${service?.title || "N/A"}
Practitioner: ${practitioner?.title || "N/A"}

*Appointment Date & Time:*
Date: ${formattedDate}
Time: ${formData.time || "Not selected"}

*Patient Information:*
Name: ${formData.firstName} ${formData.lastName}
Phone: ${formData.phone}
Email: ${formData.email}
ID Number: ${formData.idNumber}

*Medical Aid:*
Provider: ${formData.medicalAid || "None"}
Member Number: ${formData.medicalAidNumber || "N/A"}

*Reason for Visit:*
${formData.reason || "Not provided"}

---
This is an automated appointment request from dentxquarters.co.za`;

    // WhatsApp business number (remove spaces and format)
    const whatsappNumber = "27685340763";

    // Encode the message for URL
    const encodedMessage = encodeURIComponent(message);

    // Create WhatsApp link
    const whatsappLink = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;

    // Open WhatsApp
    window.open(whatsappLink, "_blank");

    // Show success message
    alert(
      "Redirecting to WhatsApp to send your appointment request. We'll contact you shortly to confirm!",
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-gray-600 hover:text-[#9A7B1D] transition-colors"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-sm sm:text-base font-medium hidden sm:inline">
              Back to Website
            </span>
            <span className="text-sm font-medium sm:hidden">Back</span>
          </button>
          <img src={logo} alt="DentX Quarters Logo" className="h-12 sm:h-16" />
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white">
        {/* Header */}
        <div className="bg-[#2C3E50] text-white px-4 sm:px-8 lg:px-20 py-8 sm:py-12">
          <div className="container mx-auto max-w-7xl">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl mb-3 sm:mb-4">
              Appointments made easy
            </h2>
            <p className="text-gray-200 text-base sm:text-lg max-w-3xl">
              Get assistance with booking an appointment at DentX Quarters.
              Select a healthcare professional below to start the process.
            </p>
          </div>
        </div>

        {/* Progress Indicator - Mobile Optimized */}
        <div className="bg-white border-b border-gray-200 px-4 sm:px-8 lg:px-20 py-6 sm:py-8 overflow-x-auto">
          <div className="container mx-auto max-w-7xl">
            <div className="flex items-center justify-between max-w-4xl mx-auto min-w-[600px] sm:min-w-0">
              {/* Step 1 */}
              <div className="flex items-center gap-2 sm:gap-3">
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium transition-all flex-shrink-0 ${
                    step >= 1
                      ? "bg-[#9A7B1D] text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {step > 1 ? <Check className="w-4 h-4 sm:w-5 sm:h-5" /> : "1"}
                </div>
                <div className="hidden sm:block">
                  <div
                    className={`text-xs sm:text-sm font-medium whitespace-nowrap ${step >= 1 ? "text-[#9A7B1D]" : "text-gray-500"}`}
                  >
                    Select Service
                  </div>
                </div>
              </div>

              <div className="flex-1 h-0.5 bg-gray-200 mx-2 sm:mx-4 min-w-[20px]" />

              {/* Step 2 */}
              <div className="flex items-center gap-2 sm:gap-3">
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium transition-all flex-shrink-0 ${
                    step >= 2
                      ? "bg-[#9A7B1D] text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {step > 2 ? <Check className="w-4 h-4 sm:w-5 sm:h-5" /> : "2"}
                </div>
                <div className="hidden sm:block">
                  <div
                    className={`text-xs sm:text-sm font-medium whitespace-nowrap ${step >= 2 ? "text-[#9A7B1D]" : "text-gray-500"}`}
                  >
                    Select Specialist
                  </div>
                </div>
              </div>

              <div className="flex-1 h-0.5 bg-gray-200 mx-2 sm:mx-4 min-w-[20px]" />

              {/* Step 3 */}
              <div className="flex items-center gap-2 sm:gap-3">
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium transition-all flex-shrink-0 ${
                    step >= 3
                      ? "bg-[#9A7B1D] text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {step > 3 ? <Check className="w-4 h-4 sm:w-5 sm:h-5" /> : "3"}
                </div>
                <div className="hidden sm:block">
                  <div
                    className={`text-xs sm:text-sm font-medium whitespace-nowrap ${step >= 3 ? "text-[#9A7B1D]" : "text-gray-500"}`}
                  >
                    Date & Time
                  </div>
                </div>
              </div>

              <div className="flex-1 h-0.5 bg-gray-200 mx-2 sm:mx-4 min-w-[20px]" />

              {/* Step 4 */}
              <div className="flex items-center gap-2 sm:gap-3">
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium transition-all flex-shrink-0 ${
                    step >= 4
                      ? "bg-[#9A7B1D] text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {step > 4 ? <Check className="w-4 h-4 sm:w-5 sm:h-5" /> : "4"}
                </div>
                <div className="hidden sm:block">
                  <div
                    className={`text-xs sm:text-sm font-medium whitespace-nowrap ${step >= 4 ? "text-[#9A7B1D]" : "text-gray-500"}`}
                  >
                    Your Details
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 sm:px-8 lg:px-20 py-8 sm:py-12 min-h-[70vh]">
          <div className="container mx-auto max-w-7xl">
            {/* Step 1: Select Service Type */}
            {step === 1 && (
              <div>
                <h3 className="text-2xl mb-2 text-[#2C3E50]">
                  Step 1: Select a healthcare service
                </h3>
                <p className="text-gray-600 mb-8">Most frequently requested</p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
                  {SERVICES.map((service) => {
                    const Icon = service.icon;
                    return (
                      <button
                        key={service.id}
                        onClick={() => {
                          updateFormData("serviceType", service.id);
                          setStep(2);
                        }}
                        className={`group p-8 rounded-xl border-2 transition-all text-center hover:shadow-xl hover:scale-105 ${
                          formData.serviceType === service.id
                            ? "border-[#9A7B1D] bg-[#F5F1E8] shadow-lg"
                            : "border-gray-200 hover:border-[#9A7B1D] bg-white"
                        }`}
                      >
                        <div
                          className={`w-16 h-16 mx-auto mb-4 rounded-2xl ${service.bgColor} flex items-center justify-center transition-transform group-hover:scale-110`}
                        >
                          <Icon className={`w-8 h-8 ${service.color}`} />
                        </div>
                        <h4 className="text-lg mb-2 text-gray-900">
                          {service.title}
                        </h4>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {service.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 2: Select Practitioner Type */}
            {step === 2 && formData.serviceType && (
              <div>
                <h3 className="text-xl sm:text-2xl mb-2 text-[#2C3E50]">
                  Step 2: Select a healthcare professional
                </h3>
                <p className="text-gray-600 mb-6 sm:mb-8">
                  Choose the type of specialist you'd like to see
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8 max-w-6xl mx-auto">
                  {PRACTITIONERS[
                    formData.serviceType as keyof typeof PRACTITIONERS
                  ]?.map((practitioner) => {
                    const Icon = practitioner.icon;
                    return (
                      <button
                        key={practitioner.id}
                        onClick={() => {
                          updateFormData("practitionerType", practitioner.id);
                          setStep(3);
                        }}
                        className={`group p-6 sm:p-8 rounded-xl border-2 transition-all text-center hover:shadow-xl hover:scale-105 ${
                          formData.practitionerType === practitioner.id
                            ? "border-[#9A7B1D] bg-[#F5F1E8] shadow-lg"
                            : "border-gray-200 hover:border-[#9A7B1D] bg-white"
                        }`}
                      >
                        <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-2xl bg-gray-50 flex items-center justify-center transition-transform group-hover:scale-110">
                          <Icon className="w-7 h-7 sm:w-8 sm:h-8 text-[#9A7B1D]" />
                        </div>
                        <h4 className="text-sm sm:text-base text-gray-900 mb-1">
                          {practitioner.title}
                        </h4>
                        <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
                          {practitioner.description}
                        </p>
                      </button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="border-[#9A7B1D] text-[#9A7B1D] hover:bg-[#F5F1E8]"
                >
                  Back to Services
                </Button>
              </div>
            )}

            {/* Step 3: Select Date & Time */}
            {step === 3 && (
              <div>
                <h3 className="text-2xl mb-2 text-[#2C3E50]">
                  Step 3: Select date and time
                </h3>
                <p className="text-gray-600 mb-8">
                  Choose your preferred appointment slot
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-8 max-w-6xl mx-auto">
                  {/* Date Selection */}
                  <div>
                    <Label className="mb-4 block text-lg text-gray-700">
                      Select Date
                    </Label>
                    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                      <Calendar
                        mode="single"
                        selected={formData.date}
                        onSelect={(date) => updateFormData("date", date)}
                        disabled={(date) =>
                          date < new Date() || date.getDay() === 0
                        }
                        className="rounded-lg"
                      />
                    </div>
                  </div>

                  {/* Time Selection */}
                  <div>
                    <Label className="mb-4 block text-lg text-gray-700">
                      Select Time
                    </Label>
                    <div className="grid grid-cols-3 gap-3 max-h-[350px] overflow-y-auto pr-2">
                      {TIME_SLOTS.map((time) => (
                        <button
                          key={time}
                          onClick={() => updateFormData("time", time)}
                          className={`p-4 rounded-xl border-2 transition-all hover:scale-105 ${
                            formData.time === time
                              ? "border-[#9A7B1D] bg-[#F5F1E8] shadow-md"
                              : "border-gray-200 hover:border-[#9A7B1D] bg-white"
                          }`}
                        >
                          <Clock
                            className={`w-5 h-5 mx-auto mb-1 ${formData.time === time ? "text-[#9A7B1D]" : "text-gray-400"}`}
                          />
                          <span className="text-sm font-medium">{time}</span>
                        </button>
                      ))}
                    </div>

                    {/* Reason for Visit */}
                    <div className="mt-6">
                      <Label className="text-gray-700">
                        Reason for Visit (Optional)
                      </Label>
                      <Textarea
                        value={formData.reason}
                        onChange={(e) =>
                          updateFormData("reason", e.target.value)
                        }
                        placeholder="Brief description of your concern..."
                        className="mt-2 border-gray-200"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    onClick={() => setStep(2)}
                    className="border-[#9A7B1D] text-[#9A7B1D] hover:bg-[#F5F1E8]"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={() => setStep(4)}
                    disabled={!formData.date || !formData.time}
                    className="bg-[#9A7B1D] hover:bg-[#7d6418]"
                  >
                    Continue <ChevronRight className="ml-2 w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4: Personal Information */}
            {step === 4 && (
              <div>
                <h3 className="text-2xl mb-2 text-[#2C3E50]">
                  Step 4: Your details
                </h3>
                <p className="text-gray-600 mb-8">
                  Please provide your contact and medical aid information
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 max-w-4xl">
                  <div>
                    <Label className="text-gray-700">First Name *</Label>
                    <Input
                      value={formData.firstName}
                      onChange={(e) =>
                        updateFormData("firstName", e.target.value)
                      }
                      placeholder="Enter your first name"
                      className="mt-2 border-gray-200"
                    />
                  </div>

                  <div>
                    <Label className="text-gray-700">Last Name *</Label>
                    <Input
                      value={formData.lastName}
                      onChange={(e) =>
                        updateFormData("lastName", e.target.value)
                      }
                      placeholder="Enter your last name"
                      className="mt-2 border-gray-200"
                    />
                  </div>

                  <div>
                    <Label className="text-gray-700">Email Address *</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateFormData("email", e.target.value)}
                      placeholder="your.email@example.com"
                      className="mt-2 border-gray-200"
                    />
                  </div>

                  <div>
                    <Label className="text-gray-700">Phone Number *</Label>
                    <Input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => updateFormData("phone", e.target.value)}
                      placeholder="+27 XX XXX XXXX"
                      className="mt-2 border-gray-200"
                    />
                  </div>

                  <div>
                    <Label className="text-gray-700">ID Number *</Label>
                    <Input
                      value={formData.idNumber}
                      onChange={(e) =>
                        updateFormData("idNumber", e.target.value)
                      }
                      placeholder="YYMMDDXXXXXXX"
                      className="mt-2 border-gray-200"
                    />
                  </div>

                  <div>
                    <Label className="text-gray-700">
                      Medical Aid Provider
                    </Label>
                    <Input
                      value={formData.medicalAid}
                      onChange={(e) =>
                        updateFormData("medicalAid", e.target.value)
                      }
                      placeholder="e.g., Discovery, Bonitas (or leave blank)"
                      className="mt-2 border-gray-200"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label className="text-gray-700">Medical Aid Number</Label>
                    <Input
                      value={formData.medicalAidNumber}
                      onChange={(e) =>
                        updateFormData("medicalAidNumber", e.target.value)
                      }
                      placeholder="Your medical aid membership number"
                      className="mt-2 border-gray-200"
                    />
                  </div>
                </div>

                {/* Summary */}
                <div className="bg-[#F5F1E8] p-6 rounded-xl mb-8 max-w-4xl border border-[#E8E2D5]">
                  <h4 className="text-lg mb-4 text-[#9A7B1D]">
                    Appointment Summary
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center py-2 border-b border-[#E8E2D5]">
                      <span className="text-gray-600">Service:</span>
                      <span className="font-medium text-gray-900">
                        {
                          SERVICES.find((s) => s.id === formData.serviceType)
                            ?.title
                        }
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-[#E8E2D5]">
                      <span className="text-gray-600">Practitioner:</span>
                      <span className="font-medium text-gray-900">
                        {
                          PRACTITIONERS[
                            formData.serviceType as keyof typeof PRACTITIONERS
                          ]?.find((p) => p.id === formData.practitionerType)
                            ?.title
                        }
                      </span>
                    </div>
                    {formData.date && (
                      <div className="flex justify-between items-center py-2 border-b border-[#E8E2D5]">
                        <span className="text-gray-600">Date:</span>
                        <span className="font-medium text-gray-900">
                          {format(formData.date, "PPP")}
                        </span>
                      </div>
                    )}
                    {formData.time && (
                      <div className="flex justify-between items-center py-2">
                        <span className="text-gray-600">Time:</span>
                        <span className="font-medium text-gray-900">
                          {formData.time}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    onClick={() => setStep(3)}
                    className="border-[#9A7B1D] text-[#9A7B1D] hover:bg-[#F5F1E8]"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={
                      !formData.firstName ||
                      !formData.lastName ||
                      !formData.email ||
                      !formData.phone ||
                      !formData.idNumber
                    }
                    className="bg-[#9A7B1D] hover:bg-[#7d6418]"
                  >
                    <Check className="mr-2 w-4 h-4" />
                    Submit Appointment Request
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
