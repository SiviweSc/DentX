import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Calendar } from "./ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  X,
  Calendar as CalendarIcon,
  Users,
  Activity as ActivityIcon,
  Settings,
  Plus,
  Check,
  Clock,
  Phone,
  Mail,
  UserCircle,
  LogOut,
  Trash2,
  Eye,
  LayoutDashboard,
  BookOpen,
  Building2,
  FileText,
  DollarSign,
  ClipboardList,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { supabaseAdminApiBaseUrls } from "../../../utils/supabase/client";
import logo from "../../assets/cadae8615ee9587c8f09fa141332814475e43e29.png";

interface AdminDashboardProps {
  onClose: () => void;
  authToken: string;
}

interface Booking {
  id: string;
  serviceType: string;
  practitionerType: string;
  date: string;
  time: string;
  reason: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  idNumber: string;
  medicalAid: string;
  medicalAidNumber: string;
  status: string;
  source: string;
  createdAt: string;
  updatedAt: string;
}

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  idNumber: string;
  medicalAid: string;
  medicalAidNumber: string;
  createdAt: string;
  lastVisit: string;
  bookings: string[];
}

interface BookingContact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  idNumber: string;
  medicalAid: string;
  medicalAidNumber: string;
  createdAt: string;
  bookingId: string;
  status: string;
}

interface ActivityLog {
  type: string;
  user: string;
  timestamp: string;
  description: string;
  bookingId?: string;
}

const SERVICES = [
  { id: "dental", title: "Dental Care" },
  { id: "medical", title: "General Medicine" },
  { id: "iv-therapy", title: "IV Drip Therapy" },
  { id: "physiotherapy", title: "Physiotherapy" },
];

const PRACTITIONERS = {
  dental: [
    { id: "general-dentist", title: "General Dentist" },
    { id: "dental-therapist", title: "Dental Therapist" },
    { id: "emergency", title: "Emergency Dental" },
  ],
  medical: [
    { id: "general-practitioner", title: "General Practitioner" },
    { id: "clinical-associate", title: "Clinical Associate" },
  ],
  "iv-therapy": [
    { id: "hydration", title: "Hydration Therapy" },
    { id: "vitamin-boost", title: "Vitamin Boost" },
    { id: "immunity", title: "Immunity Support" },
  ],
  physiotherapy: [
    { id: "sports-injury", title: "Sports Injury" },
    { id: "pain-management", title: "Pain Management" },
    { id: "rehabilitation", title: "Rehabilitation" },
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

const safeFormatDate = (
  value: string | Date | undefined | null,
  formatPattern: string,
  fallback = "N/A",
) => {
  if (!value) {
    return fallback;
  }

  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return fallback;
  }

  return format(parsed, formatPattern);
};

export function AdminDashboard({ onClose, authToken }: AdminDashboardProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [bookingContacts, setBookingContacts] = useState<BookingContact[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddBooking, setShowAddBooking] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [bookingStep, setBookingStep] = useState(1); // Step 1 or 2
  const [activeSection, setActiveSection] = useState("dashboard");

  const apiFetch = async (path: string, init?: RequestInit) => {
    let lastResponse: Response | null = null;

    for (const baseUrl of supabaseAdminApiBaseUrls) {
      const response = await fetch(`${baseUrl}${path}`, init);
      lastResponse = response;

      if (response.status === 404) {
        continue;
      }

      return response;
    }

    return lastResponse;
  };

  const parseApiResponse = async (response: Response, endpointName: string) => {
    const rawBody = await response.text();
    let data: any = {};

    try {
      data = rawBody ? JSON.parse(rawBody) : {};
    } catch {
      data = {
        error: rawBody || `${endpointName} returned an invalid response.`,
      };
    }

    if (!response.ok) {
      throw new Error(
        data.error ||
          `${endpointName} request failed with status ${response.status}`,
      );
    }

    return data;
  };

  // New booking form state
  const [newBooking, setNewBooking] = useState({
    serviceType: "",
    practitionerType: "",
    date: undefined as Date | undefined,
    time: "",
    reason: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    idNumber: "",
    medicalAid: "",
    medicalAidNumber: "",
    source: "call",
  });

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch bookings
      const bookingsRes = await apiFetch(`/bookings`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!bookingsRes) {
        throw new Error("No response from bookings endpoint");
      }
      const bookingsData = await parseApiResponse(
        bookingsRes,
        "Bookings endpoint",
      );
      if (bookingsData.success) {
        setBookings(bookingsData.bookings);
      }

      // Fetch patients
      const patientsRes = await apiFetch(`/patients`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!patientsRes) {
        throw new Error("No response from patients endpoint");
      }
      const patientsData = await parseApiResponse(
        patientsRes,
        "Patients endpoint",
      );
      if (patientsData.success) {
        setPatients(patientsData.patients);
      }

      // Fetch booking contacts
      const bookingContactsRes = await apiFetch(`/booking-contacts`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!bookingContactsRes) {
        throw new Error("No response from booking contacts endpoint");
      }
      const bookingContactsData = await parseApiResponse(
        bookingContactsRes,
        "Booking contacts endpoint",
      );
      if (bookingContactsData.success) {
        setBookingContacts(bookingContactsData.bookingContacts);
      }

      // Fetch activity log
      const activitiesRes = await apiFetch(`/activity`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!activitiesRes) {
        throw new Error("No response from activity endpoint");
      }
      const activitiesData = await parseApiResponse(
        activitiesRes,
        "Activity endpoint",
      );
      if (activitiesData.success) {
        setActivities(activitiesData.activities);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddBooking = async () => {
    try {
      if (
        !newBooking.firstName ||
        !newBooking.lastName ||
        !newBooking.phone ||
        !newBooking.date ||
        !newBooking.time ||
        !newBooking.serviceType
      ) {
        toast.error("Please fill in all required fields");
        return;
      }

      const bookingData = {
        ...newBooking,
        date: newBooking.date.toISOString(),
      };

      const response = await apiFetch(`/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(bookingData),
      });
      if (!response) {
        throw new Error("No response from create booking endpoint");
      }

      const data = await response.json();

      if (data.success) {
        toast.success("Booking created successfully");
        setShowAddBooking(false);
        setNewBooking({
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
          source: "call",
        });
        fetchData();

        // Send WhatsApp notification
        sendWhatsAppNotification(bookingData);
      } else {
        toast.error("Failed to create booking");
      }
    } catch (error) {
      console.error("Error creating booking:", error);
      toast.error("Failed to create booking");
    }
  };

  const sendWhatsAppNotification = (booking: any) => {
    const service = SERVICES.find((s) => s.id === booking.serviceType);
    const practitioner = PRACTITIONERS[
      booking.serviceType as keyof typeof PRACTITIONERS
    ]?.find((p) => p.id === booking.practitionerType);

    const message = `*🦷 NEW APPOINTMENT REQUEST - DentX Quarters*

*Source:* ${booking.source.toUpperCase()}

*Service Details:*
Service Type: ${service?.title || "N/A"}
Practitioner: ${practitioner?.title || "N/A"}

*Appointment Date & Time:*
Date: ${safeFormatDate(booking.date, "PPP")}
Time: ${booking.time}

*Patient Information:*
Name: ${booking.firstName} ${booking.lastName}
Phone: ${booking.phone}
Email: ${booking.email || "N/A"}
ID Number: ${booking.idNumber || "N/A"}

*Medical Aid:*
Provider: ${booking.medicalAid || "None"}
Member Number: ${booking.medicalAidNumber || "N/A"}

*Reason for Visit:*
${booking.reason || "Not provided"}

---
Booking via Admin Dashboard`;

    const whatsappNumber = "27685340763";
    const encodedMessage = encodeURIComponent(message);
    const whatsappLink = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;

    window.open(whatsappLink, "_blank");
  };

  const handleUpdateStatus = async (bookingId: string, status: string) => {
    try {
      const response = await apiFetch(`/bookings/${bookingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ status }),
      });
      if (!response) {
        throw new Error("No response from update booking endpoint");
      }

      const data = await response.json();

      if (data.success) {
        toast.success(`Booking ${status}`);
        fetchData();
      } else {
        toast.error("Failed to update booking");
      }
    } catch (error) {
      console.error("Error updating booking:", error);
      toast.error("Failed to update booking");
    }
  };

  const handleDeleteBooking = async (bookingId: string) => {
    if (!confirm("Are you sure you want to delete this booking?")) return;

    try {
      const response = await apiFetch(`/bookings/${bookingId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      if (!response) {
        throw new Error("No response from delete booking endpoint");
      }

      const data = await response.json();

      if (data.success) {
        toast.success("Booking deleted");
        fetchData();
      } else {
        toast.error("Failed to delete booking");
      }
    } catch (error) {
      console.error("Error deleting booking:", error);
      toast.error("Failed to delete booking");
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
      completed: "bg-blue-100 text-blue-800",
    };
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const getSourceBadge = (source: string) => {
    const colors = {
      website: "bg-purple-100 text-purple-800",
      call: "bg-blue-100 text-blue-800",
      walkin: "bg-orange-100 text-orange-800",
    };
    return colors[source as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img
              src={logo}
              alt="DentX Quarters Logo"
              className="h-12 sm:h-16"
            />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#9A7B1D]">
                Admin Dashboard
              </h1>
              <p className="text-sm text-gray-600">Booking Management System</p>
            </div>
          </div>
          <Button
            onClick={onClose}
            variant="outline"
            className="flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Bookings
              </CardTitle>
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{bookings.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {bookings.filter((b) => b.status === "pending").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Patients
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{patients.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Today's Activity
              </CardTitle>
              <ActivityIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {
                  activities.filter(
                    (a) =>
                      new Date(a.timestamp).toDateString() ===
                      new Date().toDateString(),
                  ).length
                }
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="bookings" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="patients">Patients</TabsTrigger>
            <TabsTrigger value="activity">Activity Log</TabsTrigger>
          </TabsList>

          {/* Bookings Tab */}
          <TabsContent value="bookings" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>All Bookings</CardTitle>
                  <CardDescription>Manage appointment bookings</CardDescription>
                </div>
                <Button
                  className="bg-[#9A7B1D] hover:bg-[#7d6418]"
                  onClick={() => setShowAddBooking(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Booking
                </Button>
                <Dialog
                  open={showAddBooking}
                  onOpenChange={(open) => {
                    setShowAddBooking(open);
                    if (!open) {
                      setBookingStep(1); // Reset to step 1 when closing
                    }
                  }}
                >
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Booking</DialogTitle>
                      <DialogDescription>
                        {bookingStep === 1
                          ? "Step 1: Patient Details"
                          : "Step 2: Appointment Details"}
                      </DialogDescription>
                    </DialogHeader>

                    {/* Step 1: Patient Details */}
                    {bookingStep === 1 && (
                      <div className="space-y-6 py-4">
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <Label className="mb-2 block">First Name *</Label>
                            <Input
                              value={newBooking.firstName}
                              onChange={(e) =>
                                setNewBooking({
                                  ...newBooking,
                                  firstName: e.target.value,
                                })
                              }
                              placeholder="John"
                              className="border-gray-300"
                            />
                          </div>
                          <div>
                            <Label className="mb-2 block">Last Name *</Label>
                            <Input
                              value={newBooking.lastName}
                              onChange={(e) =>
                                setNewBooking({
                                  ...newBooking,
                                  lastName: e.target.value,
                                })
                              }
                              placeholder="Doe"
                              className="border-gray-300"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <Label className="mb-2 block">Phone *</Label>
                            <Input
                              value={newBooking.phone}
                              onChange={(e) =>
                                setNewBooking({
                                  ...newBooking,
                                  phone: e.target.value,
                                })
                              }
                              placeholder="+27 XX XXX XXXX"
                              className="border-gray-300"
                            />
                          </div>
                          <div>
                            <Label className="mb-2 block">Email</Label>
                            <Input
                              type="email"
                              value={newBooking.email}
                              onChange={(e) =>
                                setNewBooking({
                                  ...newBooking,
                                  email: e.target.value,
                                })
                              }
                              placeholder="john@example.com"
                              className="border-gray-300"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <Label className="mb-2 block">ID Number</Label>
                            <Input
                              value={newBooking.idNumber}
                              onChange={(e) =>
                                setNewBooking({
                                  ...newBooking,
                                  idNumber: e.target.value,
                                })
                              }
                              placeholder="YYMMDDXXXXXXX"
                              className="border-gray-300"
                            />
                          </div>
                          <div>
                            <Label className="mb-2 block">Medical Aid</Label>
                            <Input
                              value={newBooking.medicalAid}
                              onChange={(e) =>
                                setNewBooking({
                                  ...newBooking,
                                  medicalAid: e.target.value,
                                })
                              }
                              placeholder="Discovery, Bonitas, etc."
                              className="border-gray-300"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-6">
                          <Button
                            variant="outline"
                            onClick={() => setShowAddBooking(false)}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={() => {
                              if (
                                !newBooking.firstName ||
                                !newBooking.lastName ||
                                !newBooking.phone
                              ) {
                                toast.error(
                                  "Please fill in all required patient details",
                                );
                                return;
                              }
                              setBookingStep(2);
                            }}
                            className="bg-[#9A7B1D] hover:bg-[#7d6418]"
                          >
                            Next: Appointment Details
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Step 2: Appointment Details */}
                    {bookingStep === 2 && (
                      <div className="space-y-6 py-4">
                        {/* Source Selection */}
                        <div>
                          <Label className="mb-2 block">Booking Source *</Label>
                          <Select
                            value={newBooking.source}
                            onValueChange={(value) =>
                              setNewBooking({ ...newBooking, source: value })
                            }
                          >
                            <SelectTrigger className="border-gray-300">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white">
                              <SelectItem value="website">Website</SelectItem>
                              <SelectItem value="call">Phone Call</SelectItem>
                              <SelectItem value="walkin">Walk-in</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Service Type */}
                        <div>
                          <Label className="mb-2 block">Service Type *</Label>
                          <Select
                            value={newBooking.serviceType}
                            onValueChange={(value) =>
                              setNewBooking({
                                ...newBooking,
                                serviceType: value,
                                practitionerType: "",
                              })
                            }
                          >
                            <SelectTrigger className="border-gray-300">
                              <SelectValue placeholder="Select service" />
                            </SelectTrigger>
                            <SelectContent className="bg-white">
                              {SERVICES.map((service) => (
                                <SelectItem key={service.id} value={service.id}>
                                  {service.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Practitioner Type */}
                        {newBooking.serviceType && (
                          <div>
                            <Label className="mb-2 block">Practitioner *</Label>
                            <Select
                              value={newBooking.practitionerType}
                              onValueChange={(value) =>
                                setNewBooking({
                                  ...newBooking,
                                  practitionerType: value,
                                })
                              }
                            >
                              <SelectTrigger className="border-gray-300">
                                <SelectValue placeholder="Select practitioner" />
                              </SelectTrigger>
                              <SelectContent className="bg-white">
                                {PRACTITIONERS[
                                  newBooking.serviceType as keyof typeof PRACTITIONERS
                                ]?.map((prac) => (
                                  <SelectItem key={prac.id} value={prac.id}>
                                    {prac.title}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-6">
                          {/* Date */}
                          <div>
                            <Label className="mb-2 block">Date *</Label>
                            <Calendar
                              mode="single"
                              selected={newBooking.date}
                              onSelect={(date) =>
                                setNewBooking({ ...newBooking, date })
                              }
                              disabled={(date) =>
                                (() => {
                                  const today = new Date();
                                  today.setHours(0, 0, 0, 0);
                                  return date < today || date.getDay() === 0;
                                })()
                              }
                              className="rounded-md border border-gray-300 mt-2 bg-white"
                            />
                          </div>

                          {/* Time */}
                          <div>
                            <Label className="mb-2 block">Time *</Label>
                            <Select
                              value={newBooking.time}
                              onValueChange={(value) =>
                                setNewBooking({ ...newBooking, time: value })
                              }
                            >
                              <SelectTrigger className="border-gray-300">
                                <SelectValue placeholder="Select time" />
                              </SelectTrigger>
                              <SelectContent className="bg-white">
                                {TIME_SLOTS.map((time) => (
                                  <SelectItem key={time} value={time}>
                                    {time}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div>
                          <Label className="mb-2 block">Reason for Visit</Label>
                          <Textarea
                            value={newBooking.reason}
                            onChange={(e) =>
                              setNewBooking({
                                ...newBooking,
                                reason: e.target.value,
                              })
                            }
                            placeholder="Brief description..."
                            rows={3}
                            className="border-gray-300 border-2"
                          />
                        </div>

                        <div className="flex justify-between gap-2 pt-6">
                          <Button
                            variant="outline"
                            onClick={() => setBookingStep(1)}
                          >
                            Back to Patient Details
                          </Button>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setShowAddBooking(false);
                                setBookingStep(1);
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={handleAddBooking}
                              className="bg-[#9A7B1D] hover:bg-[#7d6418]"
                            >
                              <Check className="w-4 h-4 mr-2" />
                              Create Booking
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-center py-8 text-gray-500">
                    Loading bookings...
                  </p>
                ) : bookings.length === 0 ? (
                  <p className="text-center py-8 text-gray-500">
                    No bookings found
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Patient</TableHead>
                          <TableHead>Service</TableHead>
                          <TableHead>Date & Time</TableHead>
                          <TableHead>Source</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bookings.map((booking) => (
                          <TableRow key={booking.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">
                                  {booking.firstName} {booking.lastName}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {booking.phone}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {
                                  SERVICES.find(
                                    (s) => s.id === booking.serviceType,
                                  )?.title
                                }
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div>{safeFormatDate(booking.date, "PPP")}</div>
                                <div className="text-gray-500">
                                  {booking.time}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={getSourceBadge(booking.source)}>
                                {booking.source}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusBadge(booking.status)}>
                                {booking.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setSelectedBooking(booking)}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                {booking.status === "pending" && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-green-600"
                                    onClick={() =>
                                      handleUpdateStatus(
                                        booking.id,
                                        "confirmed",
                                      )
                                    }
                                  >
                                    <Check className="w-4 h-4" />
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600"
                                  onClick={() =>
                                    handleDeleteBooking(booking.id)
                                  }
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Patients Tab */}
          <TabsContent value="patients" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Patient List</CardTitle>
                <CardDescription>All registered patients</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-center py-8 text-gray-500">
                    Loading patients...
                  </p>
                ) : patients.length === 0 ? (
                  <p className="text-center py-8 text-gray-500">
                    No patients found
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Contact</TableHead>
                          <TableHead>ID Number</TableHead>
                          <TableHead>Medical Aid</TableHead>
                          <TableHead>Last Visit</TableHead>
                          <TableHead>Total Bookings</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {patients.map((patient) => (
                          <TableRow key={patient.id}>
                            <TableCell>
                              <div className="font-medium">
                                {patient.firstName} {patient.lastName}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div className="flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  {patient.phone}
                                </div>
                                {patient.email && (
                                  <div className="flex items-center gap-1 text-gray-500">
                                    <Mail className="w-3 h-3" />
                                    {patient.email}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">
                              {patient.idNumber}
                            </TableCell>
                            <TableCell className="text-sm">
                              {patient.medicalAid || "None"}
                            </TableCell>
                            <TableCell className="text-sm">
                              {safeFormatDate(patient.lastVisit, "PP")}
                            </TableCell>
                            <TableCell>
                              <Badge>{patient.bookings?.length || 0}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Log Tab */}
          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Activity Log</CardTitle>
                <CardDescription>
                  System activity and audit trail
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-center py-8 text-gray-500">
                    Loading activity...
                  </p>
                ) : activities.length === 0 ? (
                  <p className="text-center py-8 text-gray-500">
                    No activity found
                  </p>
                ) : (
                  <div className="space-y-4 max-h-[600px] overflow-y-auto">
                    {activities.map((activity, index) => (
                      <div
                        key={index}
                        className="border-b pb-4 last:border-b-0"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <ActivityIcon className="w-4 h-4 text-[#9A7B1D]" />
                              <span className="font-medium">
                                {activity.type.replace(/_/g, " ").toUpperCase()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              {activity.description}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <UserCircle className="w-3 h-3" />
                                {activity.user}
                              </span>
                              <span>
                                {safeFormatDate(activity.timestamp, "PPpp")}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Booking Details Modal */}
      {selectedBooking && (
        <Dialog
          open={!!selectedBooking}
          onOpenChange={() => setSelectedBooking(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Booking Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Patient Information</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <strong>Name:</strong> {selectedBooking.firstName}{" "}
                    {selectedBooking.lastName}
                  </div>
                  <div>
                    <strong>Phone:</strong> {selectedBooking.phone}
                  </div>
                  <div>
                    <strong>Email:</strong> {selectedBooking.email || "N/A"}
                  </div>
                  <div>
                    <strong>ID Number:</strong>{" "}
                    {selectedBooking.idNumber || "N/A"}
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Appointment Details</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <strong>Service:</strong>{" "}
                    {
                      SERVICES.find((s) => s.id === selectedBooking.serviceType)
                        ?.title
                    }
                  </div>
                  <div>
                    <strong>Practitioner:</strong>{" "}
                    {
                      PRACTITIONERS[
                        selectedBooking.serviceType as keyof typeof PRACTITIONERS
                      ]?.find((p) => p.id === selectedBooking.practitionerType)
                        ?.title
                    }
                  </div>
                  <div>
                    <strong>Date:</strong>{" "}
                    {safeFormatDate(selectedBooking.date, "PPP")}
                  </div>
                  <div>
                    <strong>Time:</strong> {selectedBooking.time}
                  </div>
                  <div>
                    <strong>Reason:</strong> {selectedBooking.reason || "N/A"}
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Medical Aid</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <strong>Provider:</strong>{" "}
                    {selectedBooking.medicalAid || "None"}
                  </div>
                  <div>
                    <strong>Member Number:</strong>{" "}
                    {selectedBooking.medicalAidNumber || "N/A"}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Select
                  value={selectedBooking.status}
                  onValueChange={(value) => {
                    handleUpdateStatus(selectedBooking.id, value);
                    setSelectedBooking(null);
                  }}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  onClick={() => setSelectedBooking(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
