import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Calendar } from "./ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Check, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { format } from "date-fns";

interface FormData {
  // Step 1: Personal Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: Date | undefined;

  // Step 2: Appointment Details
  appointmentType: string;
  preferredDate: Date | undefined;
  preferredTime: string;
  dentistPreference: string;

  // Step 3: Medical Information
  medicalAidProvider: string;
  medicalAidNumber: string;
  existingPatient: string;
  reasonForVisit: string;
  medicalConditions: string;
}

const APPOINTMENT_TYPES = [
  "Dental - General Checkup",
  "Dental - Cleaning & Hygiene",
  "Dental - Filling",
  "Dental - Root Canal",
  "Dental - Extraction",
  "Dental - Emergency",
  "Medical - General Consultation",
  "Medical - Chronic Care",
  "Medical - Health Screening",
  "IV Drip Therapy - Hydration",
  "IV Drip Therapy - Vitamin Boost",
  "IV Drip Therapy - Immunity Support",
  "Physiotherapy - Initial Assessment",
  "Physiotherapy - Treatment Session",
  "Physiotherapy - Sports Injury",
];

const TIME_SLOTS = [
  "08:00 AM", "08:30 AM", "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM", "01:00 PM", "01:30 PM",
  "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM",
];

const DENTISTS = [
  "No Preference",
  "Dr. Sarah Thompson",
  "Dr. Michael Chen",
  "Dr. Nomusa Dlamini",
  "Dr. James Van Der Merwe",
];

export function BookingForm() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: undefined,
    appointmentType: "",
    preferredDate: undefined,
    preferredTime: "",
    dentistPreference: "",
    medicalAidProvider: "",
    medicalAidNumber: "",
    existingPatient: "",
    reasonForVisit: "",
    medicalConditions: "",
  });

  const [isSubmitted, setIsSubmitted] = useState(false);

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (step < 3) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real application, this would send data to a backend
    console.log("Form submitted:", formData);
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <div className="mb-4 inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl mb-4">Appointment Request Submitted!</h2>
            <p className="text-gray-600 mb-6">
              Thank you, {formData.firstName}! We've received your appointment request for{" "}
              {formData.preferredDate && format(formData.preferredDate, "MMMM d, yyyy")} at{" "}
              {formData.preferredTime}.
            </p>
            <p className="text-gray-600 mb-8">
              Our team will contact you at {formData.phone} or {formData.email} within 24 hours to
              confirm your appointment.
            </p>
            <Button onClick={() => { setIsSubmitted(false); setStep(1); }}>
              Book Another Appointment
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Book Your Appointment</CardTitle>
        <CardDescription>
          Fill out the form below to schedule your dental appointment
        </CardDescription>
        
        {/* Progress Indicator */}
        <div className="flex items-center justify-between mt-6">
          {[1, 2, 3].map((num) => (
            <div key={num} className="flex items-center flex-1">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  step >= num
                    ? "bg-blue-600 border-blue-600 text-white"
                    : "border-gray-300 text-gray-400"
                }`}
              >
                {step > num ? <Check className="w-5 h-5" /> : num}
              </div>
              {num < 3 && (
                <div
                  className={`flex-1 h-1 mx-2 ${
                    step > num ? "bg-blue-600" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        
        <div className="text-center mt-4">
          <p className="text-sm text-gray-600">
            {step === 1 && "Personal Information"}
            {step === 2 && "Appointment Details"}
            {step === 3 && "Medical Information"}
          </p>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit}>
          {/* Step 1: Personal Information */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => updateFormData("firstName", e.target.value)}
                    required
                    placeholder="John"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => updateFormData("lastName", e.target.value)}
                    required
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateFormData("email", e.target.value)}
                  required
                  placeholder="john.doe@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => updateFormData("phone", e.target.value)}
                  required
                  placeholder="+27 12 345 6789"
                />
              </div>

              <div className="space-y-2">
                <Label>Date of Birth *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.dateOfBirth ? (
                        format(formData.dateOfBirth, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.dateOfBirth}
                      onSelect={(date) => updateFormData("dateOfBirth", date)}
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}

          {/* Step 2: Appointment Details */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="appointmentType">Type of Appointment *</Label>
                <Select
                  value={formData.appointmentType}
                  onValueChange={(value) => updateFormData("appointmentType", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select appointment type" />
                  </SelectTrigger>
                  <SelectContent>
                    {APPOINTMENT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Preferred Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.preferredDate ? (
                        format(formData.preferredDate, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.preferredDate}
                      onSelect={(date) => updateFormData("preferredDate", date)}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="preferredTime">Preferred Time *</Label>
                <Select
                  value={formData.preferredTime}
                  onValueChange={(value) => updateFormData("preferredTime", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select preferred time" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.map((time) => (
                      <SelectItem key={time} value={time}>
                        <div className="flex items-center">
                          <Clock className="mr-2 h-4 w-4" />
                          {time}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dentistPreference">Dentist Preference</Label>
                <Select
                  value={formData.dentistPreference}
                  onValueChange={(value) => updateFormData("dentistPreference", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a dentist" />
                  </SelectTrigger>
                  <SelectContent>
                    {DENTISTS.map((dentist) => (
                      <SelectItem key={dentist} value={dentist}>
                        {dentist}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Step 3: Medical Information */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Are you an existing patient? *</Label>
                <RadioGroup
                  value={formData.existingPatient}
                  onValueChange={(value) => updateFormData("existingPatient", value)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="existing-yes" />
                    <Label htmlFor="existing-yes" className="font-normal">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="existing-no" />
                    <Label htmlFor="existing-no" className="font-normal">No</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="medicalAidProvider">Medical Aid Provider</Label>
                  <Input
                    id="medicalAidProvider"
                    value={formData.medicalAidProvider}
                    onChange={(e) => updateFormData("medicalAidProvider", e.target.value)}
                    placeholder="e.g., Discovery Health"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="medicalAidNumber">Medical Aid Number</Label>
                  <Input
                    id="medicalAidNumber"
                    value={formData.medicalAidNumber}
                    onChange={(e) => updateFormData("medicalAidNumber", e.target.value)}
                    placeholder="Your medical aid number"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reasonForVisit">Reason for Visit *</Label>
                <Textarea
                  id="reasonForVisit"
                  value={formData.reasonForVisit}
                  onChange={(e) => updateFormData("reasonForVisit", e.target.value)}
                  required
                  placeholder="Please describe the reason for your visit..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="medicalConditions">
                  Medical Conditions / Allergies
                </Label>
                <Textarea
                  id="medicalConditions"
                  value={formData.medicalConditions}
                  onChange={(e) => updateFormData("medicalConditions", e.target.value)}
                  placeholder="Please list any medical conditions, allergies, or medications..."
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            {step > 1 ? (
              <Button type="button" variant="outline" onClick={prevStep}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <Button type="button" onClick={nextStep}>
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button type="submit">
                Submit Appointment Request
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}