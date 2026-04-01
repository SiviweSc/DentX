import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Switch } from "./ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./ui/dialog";
import {
  Calendar as CalendarIcon,
  Users,
  Activity as ActivityIcon,
  LogOut,
  LayoutDashboard,
  BookOpen,
  Building2,
  ClipboardList,
  Clock,
  Phone,
  Mail,
  User,
  RefreshCw,
  Check,
  X,
  Calendar,
  History,
  Eye,
  Menu,
  ChevronLeft,
} from "lucide-react";
import { supabase } from "../../../utils/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  DEFAULT_AVAILABILITY_CONFIG,
  fetchAvailabilityConfig,
  SERVICE_CATALOG,
  updateAvailabilityConfig,
} from "../lib/availability";
import logo from "../../assets/cadae8615ee9587c8f09fa141332814475e43e29.png";
import { BookingCalendar } from "./booking-calendar";

interface AdminDashboardProps {
  onClose: () => void;
  authToken: string;
}

export function AdminDashboard({ onClose, authToken }: AdminDashboardProps) {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "calendar", label: "Calendar", icon: Calendar },
    { id: "bookings", label: "Bookings", icon: CalendarIcon },
    { id: "patients", label: "Patients", icon: Users },
    { id: "practice", label: "Practice", icon: Building2 },
    { id: "activity", label: "Activity Log", icon: ActivityIcon },
    { id: "settings", label: "Settings", icon: ClipboardList },
  ];

  const handleNavClick = (id: string) => {
    setActiveSection(id);
    setSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed md:relative w-64 h-screen bg-white border-r border-gray-200 flex flex-col transform transition-transform duration-300 ease-in-out z-40 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <img src={logo} alt="DentX Quarters" className="h-12" />
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-1 hover:bg-gray-100 rounded-lg"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4">
          <div className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    activeSection === item.id
                      ? "bg-[#9A7B1D] text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <Button
            onClick={onClose}
            variant="outline"
            className="w-full flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-lg md:text-2xl font-bold text-gray-900">
              {menuItems.find((item) => item.id === activeSection)?.label ||
                "Dashboard"}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-xs md:text-sm text-gray-600">
              Welcome, <span className="font-semibold">Admin</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {activeSection === "dashboard" && <DashboardContent />}
          {activeSection === "calendar" && <BookingCalendar />}
          {activeSection === "bookings" && <BookingsContent />}
          {activeSection === "patients" && <PatientsContent />}
          {activeSection === "practice" && (
            <PracticeManagementContent authToken={authToken} />
          )}
          {activeSection === "activity" && <ActivityContent />}
          {activeSection === "settings" && (
            <SettingsContent authToken={authToken} />
          )}
        </main>
      </div>
    </div>
  );
}

function AvailabilitySettingsPanel({ authToken }: { authToken: string }) {
  const [availabilityConfig, setAvailabilityConfig] = useState(
    DEFAULT_AVAILABILITY_CONFIG,
  );
  const [loadingAvailability, setLoadingAvailability] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  useEffect(() => {
    const loadAvailability = async () => {
      setLoadingAvailability(true);
      setAvailabilityConfig(await fetchAvailabilityConfig());
      setLoadingAvailability(false);
    };

    loadAvailability();
  }, []);

  const persistAvailability = async (
    nextConfig: typeof availabilityConfig,
    key: string,
  ) => {
    try {
      setSavingKey(key);
      const savedConfig = await updateAvailabilityConfig(nextConfig, authToken);
      setAvailabilityConfig(savedConfig);
      toast.success("Availability updated");
    } catch (error) {
      console.error("Failed to update availability:", error);
      toast.error("Failed to update availability");
      setAvailabilityConfig(await fetchAvailabilityConfig());
    } finally {
      setSavingKey(null);
    }
  };

  const toggleService = async (serviceId: string, enabled: boolean) => {
    const nextConfig = {
      ...availabilityConfig,
      services: {
        ...availabilityConfig.services,
        [serviceId]: {
          ...availabilityConfig.services[serviceId],
          enabled,
        },
      },
    };

    setAvailabilityConfig(nextConfig);
    await persistAvailability(nextConfig, `service:${serviceId}`);
  };

  const togglePractitioner = async (
    serviceId: string,
    practitionerId: string,
    enabled: boolean,
  ) => {
    const nextConfig = {
      ...availabilityConfig,
      services: {
        ...availabilityConfig.services,
        [serviceId]: {
          ...availabilityConfig.services[serviceId],
          practitioners: {
            ...availabilityConfig.services[serviceId].practitioners,
            [practitionerId]: enabled,
          },
        },
      },
    };

    setAvailabilityConfig(nextConfig);
    await persistAvailability(
      nextConfig,
      `practitioner:${serviceId}:${practitionerId}`,
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Service Availability</CardTitle>
      </CardHeader>
      <CardContent>
        {loadingAvailability ? (
          <p className="text-gray-500">Loading availability settings...</p>
        ) : (
          <div className="space-y-4">
            {SERVICE_CATALOG.map((service) => {
              const serviceConfig = availabilityConfig.services[service.id];

              return (
                <div
                  key={service.id}
                  className="rounded-lg border border-gray-200 p-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {service.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        Frontend booking, public services, and admin calendar
                        creation follow this toggle.
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        className={
                          serviceConfig.enabled
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-700"
                        }
                      >
                        {serviceConfig.enabled ? "On" : "Off"}
                      </Badge>
                      <Switch
                        checked={serviceConfig.enabled}
                        disabled={savingKey === `service:${service.id}`}
                        onCheckedChange={(checked) =>
                          toggleService(service.id, checked)
                        }
                      />
                    </div>
                  </div>

                  <div className="mt-4 space-y-3">
                    {service.practitioners.map((practitioner) => (
                      <div
                        key={practitioner.id}
                        className="flex items-center justify-between gap-4 rounded-md bg-gray-50 px-3 py-2"
                      >
                        <div>
                          <p className="text-sm text-gray-800">
                            {practitioner.title}
                          </p>
                          <p className="text-xs text-gray-500">
                            Available when enabled and the parent service is on.
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge
                            className={
                              availabilityConfig.services[service.id]
                                .practitioners[practitioner.id]
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-700"
                            }
                          >
                            {availabilityConfig.services[service.id]
                              .practitioners[practitioner.id]
                              ? "On"
                              : "Off"}
                          </Badge>
                          <Switch
                            checked={
                              availabilityConfig.services[service.id]
                                .practitioners[practitioner.id]
                            }
                            disabled={
                              !serviceConfig.enabled ||
                              savingKey ===
                                `practitioner:${service.id}:${practitioner.id}`
                            }
                            onCheckedChange={(checked) =>
                              togglePractitioner(
                                service.id,
                                practitioner.id,
                                checked,
                              )
                            }
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DashboardContent() {
  const [stats, setStats] = useState({
    totalBookings: 0,
    pendingBookings: 0,
    totalPatients: 0,
    newPatients: 0,
    todayAppointments: 0,
    completedToday: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);

      // Fetch total bookings and pending count
      const { data: bookingsData, error: bookingsError } = await supabase
        .from("bookings")
        .select("status, created_at, date");

      // Fetch total patients
      const { data: patientsData, error: patientsError } = await supabase
        .from("patients")
        .select("created_at");

      if (!bookingsError && bookingsData) {
        const totalBookings = bookingsData.length;
        const pendingBookings = bookingsData.filter(
          (b) => b.status === "pending",
        ).length;

        // Today's appointments
        const today = new Date().toISOString().split("T")[0];
        const todayAppointments = bookingsData.filter(
          (b) => b.date === today,
        ).length;
        const completedToday = bookingsData.filter(
          (b) => b.date === today && b.status === "completed",
        ).length;

        setStats((prev) => ({
          ...prev,
          totalBookings,
          pendingBookings,
          todayAppointments,
          completedToday,
        }));
      }

      if (!patientsError && patientsData) {
        const totalPatients = patientsData.length;

        // New patients this month
        const now = new Date();
        const firstDayOfMonth = new Date(
          now.getFullYear(),
          now.getMonth(),
          1,
        ).toISOString();
        const newPatients = patientsData.filter(
          (p) => p.created_at >= firstDayOfMonth,
        ).length;

        setStats((prev) => ({
          ...prev,
          totalPatients,
          newPatients,
        }));
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Bookings
            </CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : stats.totalBookings}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.pendingBookings} pending
            </p>
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
            <div className="text-2xl font-bold">
              {loading ? "..." : stats.totalPatients}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.newPatients} new this month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Today's Appointments
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : stats.todayAppointments}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.completedToday} completed
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : "12"}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Appointments scheduled
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Calendar */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          <WeeklyCalendar />
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center py-8 text-gray-500">No recent activity</p>
        </CardContent>
      </Card>
    </div>
  );
}

function WeeklyCalendar() {
  const [weekBookings, setWeekBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentWeekStart, setCurrentWeekStart] = useState(
    getWeekStart(new Date()),
  );

  useEffect(() => {
    fetchWeekBookings();
  }, [currentWeekStart]);

  // Format date as YYYY-MM-DD using LOCAL time to avoid UTC timezone mismatches.
  // toISOString() converts to UTC which shifts dates in UTC+2 (SA) timezone.
  const toLocalDateStr = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  function getWeekStart(date: Date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday start
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  const fetchWeekBookings = async () => {
    try {
      setLoading(true);
      const weekEnd = new Date(currentWeekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      // Use "YYYY-MM-DDT23:59:59" for the upper bound so that records stored as
      // full ISO datetimes (e.g. "2026-04-01T09:00:00") are included.
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .gte("date", toLocalDateStr(currentWeekStart))
        .lte("date", toLocalDateStr(weekEnd) + "T23:59:59")
        .in("status", ["pending", "confirmed"])
        .order("date", { ascending: true })
        .order("time", { ascending: true });

      if (!error && data) {
        setWeekBookings(data);
      } else if (error) {
        console.error("Error fetching week bookings:", error);
      }
    } catch (err) {
      console.error("Error fetching week bookings:", err);
    } finally {
      setLoading(false);
    }
  };

  const goToPreviousWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() - 7);
    setCurrentWeekStart(newStart);
  };

  const goToNextWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() + 7);
    setCurrentWeekStart(newStart);
  };

  const goToToday = () => {
    setCurrentWeekStart(getWeekStart(new Date()));
  };

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(currentWeekStart);
    date.setDate(date.getDate() + i);
    return date;
  });

  // The DB stores date as a full ISO string e.g. "2026-04-01T09:00:00".
  // Use startsWith so "2026-04-01T09:00:00".startsWith("2026-04-01") matches correctly.
  const getBookingsForDay = (date: Date) => {
    const dateStr = toLocalDateStr(date);
    return weekBookings.filter((b) => b.date?.startsWith(dateStr));
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400 mb-2" />
        <p className="text-gray-500">Loading calendar...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-sm sm:text-lg font-semibold text-gray-900">
          {format(currentWeekStart, "MMM d")} &ndash;{" "}
          {format(weekDays[6], "MMM d, yyyy")}
        </h3>
        <div className="flex gap-1 sm:gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={goToPreviousWeek}
            className="text-xs sm:text-sm"
          >
            ‹ Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={goToToday}
            className="text-xs sm:text-sm"
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={goToNextWeek}
            className="text-xs sm:text-sm"
          >
            Next ›
          </Button>
        </div>
      </div>

      {/* Calendar Grid — horizontally scrollable on mobile */}
      <div className="overflow-x-auto -mx-2 px-2">
        <div className="grid grid-cols-7 gap-1 sm:gap-2 min-w-[560px]">
          {weekDays.map((date, index) => {
            const dayBookings = getBookingsForDay(date);
            const isToday = date.toDateString() === new Date().toDateString();
            const isSunday = date.getDay() === 0;

            return (
              <div
                key={index}
                className={`border rounded-lg p-2 sm:p-3 min-h-[160px] sm:min-h-[200px] ${
                  isToday
                    ? "border-[#9A7B1D] border-2 bg-[#F5F1E8]"
                    : "border-gray-200 bg-white"
                } ${isSunday ? "opacity-50 bg-gray-50" : ""}`}
              >
                <div className="mb-1 sm:mb-2">
                  <div
                    className={`text-xs font-medium ${isToday ? "text-[#9A7B1D]" : "text-gray-600"}`}
                  >
                    {format(date, "EEE")}
                  </div>
                  <div
                    className={`text-base sm:text-xl font-bold ${isToday ? "text-[#9A7B1D]" : "text-gray-900"}`}
                  >
                    {format(date, "d")}
                  </div>
                </div>

                {isSunday ? (
                  <div className="text-xs text-gray-400 text-center mt-2">
                    Closed
                  </div>
                ) : (
                  <div className="space-y-1">
                    {dayBookings.length === 0 ? (
                      <div className="text-xs text-gray-400 text-center mt-2">
                        —
                      </div>
                    ) : (
                      dayBookings.map((booking) => (
                        <div
                          key={booking.id}
                          className={`text-xs p-1 sm:p-2 rounded ${
                            booking.status === "confirmed"
                              ? "bg-green-100 text-green-800 border border-green-200"
                              : "bg-yellow-100 text-yellow-800 border border-yellow-200"
                          }`}
                        >
                          <div className="font-semibold">{booking.time}</div>
                          <div className="truncate">
                            {booking.first_name} {booking.last_name}
                          </div>
                          <div className="truncate text-gray-500 hidden sm:block">
                            {booking.service_type}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 sm:gap-4 text-xs text-gray-600 pt-2 border-t">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div>
          <span>Confirmed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-yellow-100 border border-yellow-200 rounded"></div>
          <span>Pending</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 border-2 border-[#9A7B1D] rounded"></div>
          <span>Today</span>
        </div>
      </div>
    </div>
  );
}

function BookingsContent() {
  const [activeTab, setActiveTab] = useState("all");
  const [bookings, setBookings] = useState<any[]>([]);
  const [confirmedBookings, setConfirmedBookings] = useState<any[]>([]);
  const [cancelledBookings, setCancelledBookings] = useState<any[]>([]);
  const [bookingSearch, setBookingSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [cancelReason, setCancelReason] = useState("");

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all non-cancelled bookings
      const { data: allData, error: allError } = await supabase
        .from("bookings")
        .select("*")
        .neq("status", "cancelled")
        .order("created_at", { ascending: false });

      // Fetch confirmed bookings
      const { data: confirmedData, error: confirmedError } = await supabase
        .from("bookings")
        .select("*")
        .eq("status", "confirmed")
        .order("created_at", { ascending: false });

      // Fetch cancelled bookings
      const { data: cancelledData, error: cancelledError } = await supabase
        .from("bookings")
        .select("*")
        .eq("status", "cancelled")
        .order("created_at", { ascending: false });

      if (allError || confirmedError || cancelledError) {
        console.error(
          "Error fetching bookings:",
          allError || confirmedError || cancelledError,
        );
        setError(
          "Database not set up yet. Please run the SQL migration script.",
        );
        setBookings([]);
        setConfirmedBookings([]);
        setCancelledBookings([]);
      } else {
        setBookings(allData || []);
        setConfirmedBookings(confirmedData || []);
        setCancelledBookings(cancelledData || []);
      }
    } catch (err) {
      console.error("Error:", err);
      setError("Database not set up yet. Please run the SQL migration script.");
      setBookings([]);
      setConfirmedBookings([]);
      setCancelledBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const sendWhatsAppNotification = async (
    booking: any,
    action: string,
    newDateTime?: { date: string; time: string },
  ) => {
    try {
      // Send TO the customer's phone number
      const customerPhone = booking.phone
        .replace(/\s+/g, "")
        .replace(/^0/, "27");

      let message = "";
      const dateStr = booking.date
        ? format(new Date(booking.date), "PPP")
        : "No date";

      if (action === "confirmed") {
        message = `✅ BOOKING CONFIRMED - DentX Quarters\n\nHello ${booking.first_name},\n\nYour appointment has been confirmed!\n\nDate: ${dateStr}\nTime: ${booking.time}\nService: ${booking.service_type?.replace("-", " ")}\nPractitioner: ${booking.practitioner_type?.replace("-", " ")}\n\nLocation: City Center Nelspruit, Main Road, Mbombela 312-JT, Mbombela, 1201\n\nIf you need to reschedule, please contact us at +27 68 534 0763\n\nSee you soon!`;
      } else if (action === "cancelled") {
        message = `❌ BOOKING CANCELLED - DentX Quarters\n\nHello ${booking.first_name},\n\nYour appointment has been cancelled.\n\nDate: ${dateStr}\nTime: ${booking.time}\nService: ${booking.service_type?.replace("-", " ")}\n\nTo book a new appointment, visit: dentxquarters.co.za\nOr call us: +27 68 534 0763`;
      } else if (action === "rescheduled" && newDateTime) {
        const newDateStr = format(new Date(newDateTime.date), "PPP");
        message = `🔄 BOOKING RESCHEDULED - DentX Quarters\n\nHello ${booking.first_name},\n\nYour appointment has been rescheduled:\n\nOLD APPOINTMENT:\nDate: ${dateStr}\nTime: ${booking.time}\n\nNEW APPOINTMENT:\nDate: ${newDateStr}\nTime: ${newDateTime.time}\n\nService: ${booking.service_type?.replace("-", " ")}\nPractitioner: ${booking.practitioner_type?.replace("-", " ")}\n\nPlease confirm receipt.\n\nDentX Quarters\n+27 68 534 0763`;
      }

      const whatsappUrl = `https://wa.me/${customerPhone}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, "_blank");

      toast.success("WhatsApp notification opened - send to customer");
    } catch (err) {
      console.error("Error sending WhatsApp notification:", err);
    }
  };

  const handleConfirm = async (booking: any) => {
    try {
      console.log("Starting handleConfirm for:", booking.phone);

      // Check if patient already exists
      const { data: existingPatient } = await supabase
        .from("patients")
        .select("id")
        .eq("phone", booking.phone)
        .single();

      console.log("Existing patient:", existingPatient);

      // If patient doesn't exist, create new patient with "pending KYC" status
      if (!existingPatient) {
        console.log("Creating new patient...");
        const { data: newPatient, error: patientError } = await supabase
          .from("patients")
          .insert({
            first_name: booking.first_name,
            last_name: booking.last_name,
            phone: booking.phone,
            email: booking.email || null,
            medical_aid: booking.medical_aid || null,
            medical_aid_number: booking.medical_aid_number || null,
            kyc_status: "pending",
            source: "website_booking",
          })
          .select();

        if (patientError) {
          console.error("Error creating patient:", patientError);
          toast.error("Failed to create patient record");
          // Don't continue if patient creation fails
          return;
        } else {
          console.log("Patient created successfully:", newPatient);
          toast.success("New patient added with pending KYC status");
        }
      } else {
        console.log("Patient already exists, skipping creation");
      }

      // Update booking status to confirmed
      const { error: updateError } = await supabase
        .from("bookings")
        .update({ status: "confirmed" })
        .eq("id", booking.id);

      if (updateError) {
        toast.error("Failed to confirm booking");
        console.error(updateError);
        return;
      }

      console.log("Booking confirmed successfully");
      toast.success("Booking confirmed successfully!");

      // Send WhatsApp notification to CUSTOMER
      await sendWhatsAppNotification(booking, "confirmed");

      // Refresh bookings
      fetchBookings();
    } catch (err) {
      toast.error("An error occurred");
      console.error("Error in handleConfirm:", err);
    }
  };

  const handleCancelClick = (booking: any) => {
    setSelectedBooking(booking);
    setCancelReason("");
    setShowCancelDialog(true);
  };

  const handleCancelSubmit = async () => {
    if (!cancelReason.trim()) {
      toast.error("Please provide a cancellation reason");
      return;
    }

    try {
      const { error: updateError } = await supabase
        .from("bookings")
        .update({
          status: "cancelled",
          cancellation_reason: cancelReason,
          cancelled_at: new Date().toISOString(),
        })
        .eq("id", selectedBooking.id);

      if (updateError) {
        toast.error("Failed to cancel booking");
        console.error(updateError);
        return;
      }

      toast.success("Booking cancelled and moved to history");

      // Send WhatsApp notification to CUSTOMER
      await sendWhatsAppNotification(selectedBooking, "cancelled");

      // Close dialog and refresh
      setShowCancelDialog(false);
      setSelectedBooking(null);
      setCancelReason("");
      fetchBookings();
    } catch (err) {
      toast.error("An error occurred");
      console.error(err);
    }
  };

  const handleRescheduleClick = (booking: any) => {
    setSelectedBooking(booking);
    setNewDate(booking.date || "");
    setNewTime(booking.time || "");
    setShowRescheduleDialog(true);
  };

  const handleRescheduleSubmit = async () => {
    if (!selectedBooking || !newDate || !newTime) {
      toast.error("Please select both date and time");
      return;
    }

    try {
      const { error: updateError } = await supabase
        .from("bookings")
        .update({
          date: newDate,
          time: newTime,
          status: "pending", // Set to pending so admin must confirm again
        })
        .eq("id", selectedBooking.id);

      if (updateError) {
        toast.error("Failed to reschedule booking");
        console.error(updateError);
        return;
      }

      toast.success("Booking rescheduled! Please confirm the new appointment.");

      // Send WhatsApp notification to CUSTOMER
      await sendWhatsAppNotification(selectedBooking, "rescheduled", {
        date: newDate,
        time: newTime,
      });

      // Close dialog and refresh
      setShowRescheduleDialog(false);
      setSelectedBooking(null);
      fetchBookings();
    } catch (err) {
      toast.error("An error occurred");
      console.error(err);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-green-100 text-green-800",
      completed: "bg-blue-100 text-blue-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return variants[status] || "bg-gray-100 text-gray-800";
  };

  const allBookings = [...bookings, ...cancelledBookings];

  const statusFilteredBookings =
    activeTab === "all"
      ? allBookings
      : activeTab === "confirmed"
        ? confirmedBookings
        : activeTab === "cancelled"
          ? cancelledBookings
          : allBookings.filter((booking) => booking.status === activeTab);

  const filteredBookings = statusFilteredBookings.filter((booking) => {
    const search = bookingSearch.trim().toLowerCase();
    if (!search) return true;

    const fullName = `${booking.first_name || ""} ${booking.last_name || ""}`
      .trim()
      .toLowerCase();

    return [
      fullName,
      booking.phone || "",
      booking.email || "",
      booking.service_type || "",
      booking.practitioner_type || "",
      booking.time || "",
      booking.date || "",
      booking.status || "",
    ]
      .join(" ")
      .toLowerCase()
      .includes(search);
  });

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>All Bookings</CardTitle>
          <Button
            onClick={fetchBookings}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              value={bookingSearch}
              onChange={(e) => setBookingSearch(e.target.value)}
              placeholder="Search booking by name, phone, email, date, time..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9A7B1D]"
            />
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9A7B1D]"
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400 mb-2" />
              <p className="text-gray-500">Loading bookings...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-2xl mx-auto">
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                  Database Not Set Up
                </h3>
                <p className="text-yellow-700 mb-4">{error}</p>
                <div className="bg-white rounded p-4 text-left">
                  <p className="text-sm text-gray-700 mb-2 font-semibold">
                    Quick Setup (3 minutes):
                  </p>
                  <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                    <li>
                      Open file:{" "}
                      <code className="bg-gray-100 px-2 py-1 rounded">
                        ⚡-DO-THIS-NOW.md
                      </code>
                    </li>
                    <li>
                      Copy the SQL script from:{" "}
                      <code className="bg-gray-100 px-2 py-1 rounded">
                        COPY-THIS-SQL.txt
                      </code>
                    </li>
                    <li>Run in Supabase SQL Editor</li>
                    <li>Refresh this page</li>
                  </ol>
                </div>
              </div>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="text-center py-8">
              <CalendarIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                No Matching Bookings
              </h3>
              <p className="text-gray-500">
                Try a different search term or status filter.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-3 mb-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-full bg-[#F5F1E8] flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-[#9A7B1D]" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-gray-900 truncate">
                          {booking.first_name} {booking.last_name}
                        </h4>
                        <p className="text-sm text-gray-500 capitalize truncate">
                          {booking.service_type?.replace("-", " ")} -{" "}
                          {booking.practitioner_type?.replace("-", " ")}
                        </p>
                      </div>
                    </div>
                    <Badge
                      className={`${getStatusBadge(booking.status)} flex-shrink-0`}
                    >
                      {booking.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="flex items-center gap-2 text-sm min-w-0">
                      <CalendarIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-700 truncate">
                        {booking.date
                          ? format(new Date(booking.date), "PPP")
                          : "No date"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm min-w-0">
                      <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-700">{booking.time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm min-w-0">
                      <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-700 truncate">
                        {booking.phone}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm min-w-0">
                      <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-700 truncate">
                        {booking.email || "No email"}
                      </span>
                    </div>
                  </div>

                  {booking.reason && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Reason:</span>{" "}
                        {booking.reason}
                      </p>
                    </div>
                  )}

                  {booking.medical_aid && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Medical Aid:</span>{" "}
                        {booking.medical_aid}
                        {booking.medical_aid_number &&
                          ` (${booking.medical_aid_number})`}
                      </p>
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2">
                    {booking.status === "pending" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-600 border-green-600 hover:bg-green-50 text-xs sm:text-sm"
                        onClick={() => handleConfirm(booking)}
                      >
                        Confirm
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-blue-600 border-blue-600 hover:bg-blue-50 text-xs sm:text-sm"
                      onClick={() => handleRescheduleClick(booking)}
                    >
                      Reschedule
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 border-red-600 hover:bg-red-50 text-xs sm:text-sm"
                      onClick={() => handleCancelClick(booking)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reschedule Dialog */}
      <Dialog
        open={showRescheduleDialog}
        onOpenChange={(open) => {
          setShowRescheduleDialog(open);
          if (!open) {
            setNewDate("");
            setNewTime("");
            setSelectedBooking(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reschedule Booking</DialogTitle>
            <DialogDescription>
              Update the appointment date and time for{" "}
              {selectedBooking?.first_name} {selectedBooking?.last_name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="new-date"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                New Date
              </label>
              <input
                id="new-date"
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9A7B1D]"
              />
            </div>

            <div>
              <label
                htmlFor="new-time"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                New Time
              </label>
              <select
                id="new-time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9A7B1D]"
              >
                <option value="">Select time</option>
                <option value="08:30">08:30</option>
                <option value="09:00">09:00</option>
                <option value="09:30">09:30</option>
                <option value="10:00">10:00</option>
                <option value="10:30">10:30</option>
                <option value="11:00">11:00</option>
                <option value="11:30">11:30</option>
                <option value="12:00">12:00</option>
                <option value="12:30">12:30</option>
                <option value="13:00">13:00</option>
                <option value="13:30">13:30</option>
                <option value="14:00">14:00</option>
                <option value="14:30">14:30</option>
                <option value="15:00">15:00</option>
                <option value="15:30">15:30</option>
                <option value="16:00">16:00</option>
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRescheduleDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRescheduleSubmit}
              className="bg-[#9A7B1D] hover:bg-[#7d6418] text-white"
            >
              Reschedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Booking</DialogTitle>
            <DialogDescription>
              Provide a reason for cancelling the appointment with{" "}
              {selectedBooking?.first_name} {selectedBooking?.last_name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="cancel-reason"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Cancellation Reason
              </label>
              <textarea
                id="cancel-reason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9A7B1D]"
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCancelSubmit}
              className="bg-[#9A7B1D] hover:bg-[#7d6418] text-white"
            >
              Confirm Cancellation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function PatientsContent() {
  const [patients, setPatients] = useState<any[]>([]);
  const [patientSearch, setPatientSearch] = useState("");
  const [showAddPatientDialog, setShowAddPatientDialog] = useState(false);
  const [showPatientDetailsDialog, setShowPatientDetailsDialog] =
    useState(false);
  const [savingPatient, setSavingPatient] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [patientForm, setPatientForm] = useState({
    first_name: "",
    last_name: "",
    id_number: "",
    phone: "",
    email: "",
    medical_aid: "",
    medical_aid_number: "",
    date_of_birth: "",
    address: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    notes: "",
    last_visit: "",
  });
  const [newPatientForm, setNewPatientForm] = useState({
    first_name: "",
    last_name: "",
    id_number: "",
    phone: "",
    email: "",
    medical_aid: "",
    medical_aid_number: "",
    date_of_birth: "",
    address: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    notes: "",
    last_visit: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setPatients(data);
      }
    } catch (err) {
      console.error("Error fetching patients:", err);
    } finally {
      setLoading(false);
    }
  };

  const normalizePhone = (phone: string) =>
    phone.replace(/\s+/g, "").replace(/[^\d+]/g, "");

  const toDateInputValue = (value: string | null) => {
    if (!value) return "";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "";
    return parsed.toISOString().slice(0, 10);
  };

  const toDateTimeLocalValue = (value: string | null) => {
    if (!value) return "";
    const normalized = value.includes("T") ? value : value.replace(" ", "T");
    return normalized.slice(0, 16);
  };

  const filteredPatients = patients.filter((patient) => {
    const search = patientSearch.trim().toLowerCase();
    if (!search) return true;

    return [
      `${patient.first_name || ""} ${patient.last_name || ""}`,
      patient.phone || "",
      patient.email || "",
      patient.medical_aid || "",
      patient.id_number || "",
      patient.emergency_contact_name || "",
      patient.emergency_contact_phone || "",
    ]
      .join(" ")
      .toLowerCase()
      .includes(search);
  });

  const handlePatientRowClick = (patient: any) => {
    setSelectedPatient(patient);
    setPatientForm({
      first_name: patient.first_name || "",
      last_name: patient.last_name || "",
      id_number: patient.id_number || "",
      phone: patient.phone || "",
      email: patient.email || "",
      medical_aid: patient.medical_aid || "",
      medical_aid_number: patient.medical_aid_number || "",
      date_of_birth: toDateInputValue(patient.date_of_birth),
      address: patient.address || "",
      emergency_contact_name: patient.emergency_contact_name || "",
      emergency_contact_phone: patient.emergency_contact_phone || "",
      notes: patient.notes || "",
      last_visit: toDateTimeLocalValue(patient.last_visit),
    });
    setShowPatientDetailsDialog(true);
  };

  const handleSavePatientChanges = async () => {
    if (!selectedPatient) return;
    if (!patientForm.first_name.trim() || !patientForm.last_name.trim()) {
      toast.error("First name and last name are required");
      return;
    }
    if (!patientForm.phone.trim()) {
      toast.error("Phone number is required");
      return;
    }

    try {
      setSavingPatient(true);

      const nextPhone = normalizePhone(patientForm.phone.trim());
      const duplicateFromLoaded = patients.some(
        (patient) =>
          patient.id !== selectedPatient.id &&
          normalizePhone(patient.phone || "") === nextPhone,
      );

      if (duplicateFromLoaded) {
        toast.error("Another patient already uses this phone number");
        return;
      }

      const { error } = await supabase
        .from("patients")
        .update({
          first_name: patientForm.first_name.trim(),
          last_name: patientForm.last_name.trim(),
          id_number: patientForm.id_number.trim() || null,
          phone: patientForm.phone.trim(),
          email: patientForm.email.trim() || null,
          medical_aid: patientForm.medical_aid.trim() || null,
          medical_aid_number: patientForm.medical_aid_number.trim() || null,
          date_of_birth: patientForm.date_of_birth || null,
          address: patientForm.address.trim() || null,
          emergency_contact_name:
            patientForm.emergency_contact_name.trim() || null,
          emergency_contact_phone:
            patientForm.emergency_contact_phone.trim() || null,
          notes: patientForm.notes.trim() || null,
          last_visit: patientForm.last_visit || null,
        })
        .eq("id", selectedPatient.id);

      if (error) {
        console.error("Error updating patient:", error);
        toast.error("Failed to update patient");
        return;
      }

      toast.success("Patient details updated successfully");
      setShowPatientDetailsDialog(false);
      setSelectedPatient(null);
      fetchPatients();
    } catch (err) {
      console.error("Error updating patient:", err);
      toast.error("Failed to update patient");
    } finally {
      setSavingPatient(false);
    }
  };

  const handleAddPatient = async () => {
    if (!newPatientForm.first_name.trim() || !newPatientForm.last_name.trim()) {
      toast.error("First name and last name are required");
      return;
    }
    if (!newPatientForm.phone.trim()) {
      toast.error("Phone number is required");
      return;
    }

    try {
      setSavingPatient(true);
      const candidatePhone = newPatientForm.phone.trim();
      const normalizedCandidatePhone = candidatePhone.replace(/\s+/g, "");

      const hasLocalDuplicate = patients.some(
        (patient) =>
          normalizePhone(patient.phone || "") === normalizedCandidatePhone,
      );

      if (hasLocalDuplicate) {
        toast.error("A patient with this phone number already exists");
        return;
      }

      const { data: existingPhoneRows, error: phoneCheckError } = await supabase
        .from("patients")
        .select("id, phone");

      if (phoneCheckError) {
        console.error("Error checking duplicate phone:", phoneCheckError);
        toast.error("Unable to validate phone number. Please try again.");
        return;
      }

      const hasRemoteDuplicate = (existingPhoneRows || []).some(
        (row) => normalizePhone(row.phone || "") === normalizedCandidatePhone,
      );

      if (hasRemoteDuplicate) {
        toast.error("A patient with this phone number already exists");
        return;
      }

      const { error } = await supabase.from("patients").insert({
        first_name: newPatientForm.first_name.trim(),
        last_name: newPatientForm.last_name.trim(),
        id_number: newPatientForm.id_number.trim() || null,
        phone: candidatePhone,
        email: newPatientForm.email.trim() || null,
        medical_aid: newPatientForm.medical_aid.trim() || null,
        medical_aid_number: newPatientForm.medical_aid_number.trim() || null,
        date_of_birth: newPatientForm.date_of_birth || null,
        address: newPatientForm.address.trim() || null,
        emergency_contact_name:
          newPatientForm.emergency_contact_name.trim() || null,
        emergency_contact_phone:
          newPatientForm.emergency_contact_phone.trim() || null,
        notes: newPatientForm.notes.trim() || null,
        last_visit: newPatientForm.last_visit || null,
      });

      if (error) {
        console.error("Error adding patient:", error);
        toast.error("Failed to add patient");
        return;
      }

      toast.success("Patient added successfully");
      setShowAddPatientDialog(false);
      setNewPatientForm({
        first_name: "",
        last_name: "",
        id_number: "",
        phone: "",
        email: "",
        medical_aid: "",
        medical_aid_number: "",
        date_of_birth: "",
        address: "",
        emergency_contact_name: "",
        emergency_contact_phone: "",
        notes: "",
        last_visit: "",
      });
      fetchPatients();
    } catch (err) {
      console.error("Error adding patient:", err);
      toast.error("Failed to add patient");
    } finally {
      setSavingPatient(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Patient List</CardTitle>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowAddPatientDialog(true)}
              size="sm"
              className="bg-[#9A7B1D] hover:bg-[#7d6418] text-white"
            >
              Add Patient
            </Button>
            <Button
              onClick={fetchPatients}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <input
              type="text"
              value={patientSearch}
              onChange={(e) => setPatientSearch(e.target.value)}
              placeholder="Search patient by name, phone, email, ID number..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9A7B1D]"
            />
          </div>

          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400 mb-2" />
              <p className="text-gray-500">Loading patients...</p>
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                No Matching Patients
              </h3>
              <p className="text-gray-500">Try a different search term.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Phone
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Medical Aid
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      ID Number
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Last Visit
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Added
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredPatients.map((patient) => (
                    <tr key={patient.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-[#F5F1E8] flex items-center justify-center mr-3">
                            <User className="w-4 h-4 text-[#9A7B1D]" />
                          </div>
                          <div className="font-medium text-gray-900">
                            {patient.first_name} {patient.last_name}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                        {patient.phone}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                        {patient.email || "N/A"}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                        {patient.medical_aid || "None"}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                        {patient.id_number || "N/A"}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                        {patient.last_visit
                          ? format(new Date(patient.last_visit), "PPP p")
                          : "N/A"}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {patient.created_at
                          ? format(new Date(patient.created_at), "PPP")
                          : "N/A"}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-[#9A7B1D] border-[#9A7B1D] hover:bg-[#F5F1E8]"
                          onClick={() => handlePatientRowClick(patient)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={showAddPatientDialog}
        onOpenChange={(open) => {
          setShowAddPatientDialog(open);
          if (!open) {
            setNewPatientForm({
              first_name: "",
              last_name: "",
              id_number: "",
              phone: "",
              email: "",
              medical_aid: "",
              medical_aid_number: "",
              date_of_birth: "",
              address: "",
              emergency_contact_name: "",
              emergency_contact_phone: "",
              notes: "",
              last_visit: "",
            });
          }
        }}
      >
        <DialogContent className="w-[calc(100vw-1rem)] sm:w-[92vw] max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Add Patient</DialogTitle>
            <DialogDescription>
              Create a new patient profile from the admin dashboard.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 [&>input]:min-w-0 [&>textarea]:min-w-0">
            <input
              type="text"
              placeholder="First name"
              value={newPatientForm.first_name}
              onChange={(e) =>
                setNewPatientForm((prev) => ({
                  ...prev,
                  first_name: e.target.value,
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9A7B1D]"
            />
            <input
              type="text"
              placeholder="Last name"
              value={newPatientForm.last_name}
              onChange={(e) =>
                setNewPatientForm((prev) => ({
                  ...prev,
                  last_name: e.target.value,
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9A7B1D]"
            />
            <input
              type="text"
              placeholder="ID number"
              value={newPatientForm.id_number}
              onChange={(e) =>
                setNewPatientForm((prev) => ({
                  ...prev,
                  id_number: e.target.value,
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9A7B1D]"
            />
            <input
              type="text"
              placeholder="Phone"
              value={newPatientForm.phone}
              onChange={(e) =>
                setNewPatientForm((prev) => ({
                  ...prev,
                  phone: e.target.value,
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9A7B1D]"
            />
            <input
              type="email"
              placeholder="Email (optional)"
              value={newPatientForm.email}
              onChange={(e) =>
                setNewPatientForm((prev) => ({
                  ...prev,
                  email: e.target.value,
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9A7B1D]"
            />
            <input
              type="text"
              placeholder="Medical aid (optional)"
              value={newPatientForm.medical_aid}
              onChange={(e) =>
                setNewPatientForm((prev) => ({
                  ...prev,
                  medical_aid: e.target.value,
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9A7B1D]"
            />
            <input
              type="text"
              placeholder="Medical aid number (optional)"
              value={newPatientForm.medical_aid_number}
              onChange={(e) =>
                setNewPatientForm((prev) => ({
                  ...prev,
                  medical_aid_number: e.target.value,
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9A7B1D]"
            />
          </div>

          <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-3 [&>input]:min-w-0 [&>textarea]:min-w-0">
            <input
              type="date"
              value={newPatientForm.date_of_birth}
              onChange={(e) =>
                setNewPatientForm((prev) => ({
                  ...prev,
                  date_of_birth: e.target.value,
                }))
              }
              placeholder="Date of birth"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9A7B1D]"
            />
            <input
              type="datetime-local"
              value={newPatientForm.last_visit}
              onChange={(e) =>
                setNewPatientForm((prev) => ({
                  ...prev,
                  last_visit: e.target.value,
                }))
              }
              placeholder="Last visit"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9A7B1D]"
            />
            <input
              type="text"
              placeholder="Emergency contact name"
              value={newPatientForm.emergency_contact_name}
              onChange={(e) =>
                setNewPatientForm((prev) => ({
                  ...prev,
                  emergency_contact_name: e.target.value,
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9A7B1D]"
            />
            <input
              type="text"
              placeholder="Emergency contact phone"
              value={newPatientForm.emergency_contact_phone}
              onChange={(e) =>
                setNewPatientForm((prev) => ({
                  ...prev,
                  emergency_contact_phone: e.target.value,
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9A7B1D]"
            />
            <textarea
              placeholder="Address"
              value={newPatientForm.address}
              onChange={(e) =>
                setNewPatientForm((prev) => ({
                  ...prev,
                  address: e.target.value,
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9A7B1D] md:col-span-2"
              rows={2}
            />
            <textarea
              placeholder="Notes"
              value={newPatientForm.notes}
              onChange={(e) =>
                setNewPatientForm((prev) => ({
                  ...prev,
                  notes: e.target.value,
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9A7B1D] md:col-span-2"
              rows={3}
            />
          </div>

          <DialogFooter>
            <div className="mt-4 flex flex-col-reverse sm:flex-row gap-2 w-full sm:w-auto sm:justify-end">
              <Button
                variant="outline"
                onClick={() => setShowAddPatientDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddPatient}
                disabled={savingPatient}
                className="bg-[#9A7B1D] hover:bg-[#7d6418] text-white"
              >
                {savingPatient ? "Saving..." : "Add Patient"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showPatientDetailsDialog}
        onOpenChange={(open) => {
          setShowPatientDetailsDialog(open);
          if (!open) {
            setSelectedPatient(null);
          }
        }}
      >
        <DialogContent className="w-[calc(100vw-1rem)] sm:w-[92vw] max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Patient Details</DialogTitle>
            <DialogDescription>
              Update any patient field from the database schema.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 [&>input]:min-w-0 [&>textarea]:min-w-0">
            <input
              type="text"
              placeholder="First name"
              value={patientForm.first_name}
              onChange={(e) =>
                setPatientForm((prev) => ({
                  ...prev,
                  first_name: e.target.value,
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9A7B1D]"
            />
            <input
              type="text"
              placeholder="Last name"
              value={patientForm.last_name}
              onChange={(e) =>
                setPatientForm((prev) => ({
                  ...prev,
                  last_name: e.target.value,
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9A7B1D]"
            />
            <input
              type="text"
              placeholder="ID number"
              value={patientForm.id_number}
              onChange={(e) =>
                setPatientForm((prev) => ({
                  ...prev,
                  id_number: e.target.value,
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9A7B1D]"
            />
            <input
              type="text"
              placeholder="Phone"
              value={patientForm.phone}
              onChange={(e) =>
                setPatientForm((prev) => ({ ...prev, phone: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9A7B1D]"
            />
            <input
              type="email"
              placeholder="Email"
              value={patientForm.email}
              onChange={(e) =>
                setPatientForm((prev) => ({ ...prev, email: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9A7B1D]"
            />
            <input
              type="text"
              placeholder="Medical aid"
              value={patientForm.medical_aid}
              onChange={(e) =>
                setPatientForm((prev) => ({
                  ...prev,
                  medical_aid: e.target.value,
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9A7B1D]"
            />
            <input
              type="text"
              placeholder="Medical aid number"
              value={patientForm.medical_aid_number}
              onChange={(e) =>
                setPatientForm((prev) => ({
                  ...prev,
                  medical_aid_number: e.target.value,
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9A7B1D]"
            />
          </div>

          <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-3 [&>input]:min-w-0 [&>textarea]:min-w-0">
            <input
              type="date"
              value={patientForm.date_of_birth}
              onChange={(e) =>
                setPatientForm((prev) => ({
                  ...prev,
                  date_of_birth: e.target.value,
                }))
              }
              placeholder="Date of birth"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9A7B1D]"
            />
            <input
              type="datetime-local"
              value={patientForm.last_visit}
              onChange={(e) =>
                setPatientForm((prev) => ({
                  ...prev,
                  last_visit: e.target.value,
                }))
              }
              placeholder="Last visit"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9A7B1D]"
            />
            <input
              type="text"
              placeholder="Emergency contact name"
              value={patientForm.emergency_contact_name}
              onChange={(e) =>
                setPatientForm((prev) => ({
                  ...prev,
                  emergency_contact_name: e.target.value,
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9A7B1D]"
            />
            <input
              type="text"
              placeholder="Emergency contact phone"
              value={patientForm.emergency_contact_phone}
              onChange={(e) =>
                setPatientForm((prev) => ({
                  ...prev,
                  emergency_contact_phone: e.target.value,
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9A7B1D]"
            />
            <textarea
              placeholder="Address"
              value={patientForm.address}
              onChange={(e) =>
                setPatientForm((prev) => ({
                  ...prev,
                  address: e.target.value,
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9A7B1D] md:col-span-2"
              rows={2}
            />
            <textarea
              placeholder="Notes"
              value={patientForm.notes}
              onChange={(e) =>
                setPatientForm((prev) => ({ ...prev, notes: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9A7B1D] md:col-span-2"
              rows={3}
            />
          </div>

          <div className="mt-2 text-xs text-gray-500 space-y-1">
            {selectedPatient?.created_at && (
              <p>
                Added: {format(new Date(selectedPatient.created_at), "PPP p")}
              </p>
            )}
            {selectedPatient?.updated_at && (
              <p>
                Updated: {format(new Date(selectedPatient.updated_at), "PPP p")}
              </p>
            )}
          </div>

          <DialogFooter>
            <div className="mt-4 flex flex-col-reverse sm:flex-row gap-2 w-full sm:w-auto sm:justify-end">
              <Button
                variant="outline"
                onClick={() => setShowPatientDetailsDialog(false)}
              >
                Close
              </Button>
              <Button
                onClick={handleSavePatientChanges}
                disabled={savingPatient}
                className="bg-[#9A7B1D] hover:bg-[#7d6418] text-white"
              >
                {savingPatient ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function PracticeManagementContent({ authToken }: { authToken: string }) {
  const [availabilityConfig, setAvailabilityConfig] = useState(
    DEFAULT_AVAILABILITY_CONFIG,
  );
  const [loadingAvailability, setLoadingAvailability] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  useEffect(() => {
    const loadAvailability = async () => {
      setLoadingAvailability(true);
      setAvailabilityConfig(await fetchAvailabilityConfig());
      setLoadingAvailability(false);
    };

    loadAvailability();
  }, []);

  const persistAvailability = async (
    nextConfig: typeof availabilityConfig,
    key: string,
  ) => {
    try {
      setSavingKey(key);
      const savedConfig = await updateAvailabilityConfig(nextConfig, authToken);
      setAvailabilityConfig(savedConfig);
      toast.success("Availability updated");
    } catch (error) {
      console.error("Failed to update availability:", error);
      toast.error("Failed to update availability");
      setAvailabilityConfig(await fetchAvailabilityConfig());
    } finally {
      setSavingKey(null);
    }
  };

  const toggleService = async (serviceId: string, enabled: boolean) => {
    const nextConfig = {
      ...availabilityConfig,
      services: {
        ...availabilityConfig.services,
        [serviceId]: {
          ...availabilityConfig.services[serviceId],
          enabled,
        },
      },
    };

    setAvailabilityConfig(nextConfig);
    await persistAvailability(nextConfig, `service:${serviceId}`);
  };

  const togglePractitioner = async (
    serviceId: string,
    practitionerId: string,
    enabled: boolean,
  ) => {
    const nextConfig = {
      ...availabilityConfig,
      services: {
        ...availabilityConfig.services,
        [serviceId]: {
          ...availabilityConfig.services[serviceId],
          practitioners: {
            ...availabilityConfig.services[serviceId].practitioners,
            [practitionerId]: enabled,
          },
        },
      },
    };

    setAvailabilityConfig(nextConfig);
    await persistAvailability(
      nextConfig,
      `practitioner:${serviceId}:${practitionerId}`,
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Practice Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Practice Name
                </p>
                <p className="text-base font-semibold">DentX Quarters</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Contact Number
                </p>
                <p className="text-base font-semibold">+27 68 534 0763</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p className="text-base font-semibold">
                  info@dentxquarters.co.za
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Location</p>
                <p className="text-base font-semibold">
                  City Center Nelspruit, Main Road, Mbombela 312-JT, Mbombela,
                  1201
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Staff Management</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500">
              Manage practitioners and staff members
            </p>
            <Button className="mt-4 bg-[#9A7B1D] hover:bg-[#7d6418]">
              Add Staff Member
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Working Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Monday - Friday</span>
                <span className="font-semibold">08:30 - 16:00</span>
              </div>
              <div className="flex justify-between">
                <span>Saturday</span>
                <span className="font-semibold">08:30 - 13:00</span>
              </div>
              <div className="flex justify-between">
                <span>Sunday</span>
                <span className="font-semibold text-red-600">Closed</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                Update Practice Details
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Manage Services
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Configure Notifications
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ActivityContent() {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("all");
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [fromTime, setFromTime] = useState("");
  const [toTime, setToTime] = useState("");

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("activity_log")
        .select(
          "id, type, user_name, user_role, timestamp, description, booking_id, patient_id",
        )
        .order("timestamp", { ascending: false })
        .limit(200);

      if (error) {
        console.error("Failed to fetch activity log:", error);
        toast.error("Failed to load activity log");
        return;
      }

      setActivities(data || []);
    } catch (err) {
      console.error("Failed to fetch activity log:", err);
      toast.error("Failed to load activity log");
    } finally {
      setLoading(false);
    }
  };

  const getTypeBadgeClass = (type: string) => {
    if (type === "login") return "bg-blue-100 text-blue-800";
    if (type === "booking_created") return "bg-green-100 text-green-800";
    if (type === "booking_updated") return "bg-amber-100 text-amber-800";
    if (type === "booking_deleted") return "bg-red-100 text-red-800";
    return "bg-gray-100 text-gray-700";
  };

  const toLocalDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const toLocalTimeString = (date: Date) => {
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  const filteredActivities = activities.filter((activity) => {
    const timestamp = activity.timestamp ? new Date(activity.timestamp) : null;

    if (fromDate && timestamp && toLocalDateString(timestamp) < fromDate) {
      return false;
    }

    if (toDate && timestamp && toLocalDateString(timestamp) > toDate) {
      return false;
    }

    if (fromTime && timestamp && toLocalTimeString(timestamp) < fromTime) {
      return false;
    }

    if (toTime && timestamp && toLocalTimeString(timestamp) > toTime) {
      return false;
    }

    const typeMatch = filterType === "all" || activity.type === filterType;
    if (!typeMatch) return false;

    const q = search.trim().toLowerCase();
    if (!q) return true;

    return [
      activity.type || "",
      activity.user_name || "",
      activity.user_role || "",
      activity.description || "",
      activity.booking_id || "",
      activity.patient_id || "",
    ]
      .join(" ")
      .toLowerCase()
      .includes(q);
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Activity Log</CardTitle>
          <Button
            onClick={fetchActivities}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by user, description, booking ID..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9A7B1D]"
            />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9A7B1D]"
            >
              <option value="all">All activity types</option>
              <option value="login">Login</option>
              <option value="booking_created">Booking Created</option>
              <option value="booking_updated">Booking Updated</option>
              <option value="booking_deleted">Booking Deleted</option>
            </select>
          </div>

          <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                From Date
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9A7B1D]"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                To Date
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9A7B1D]"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                From Time
              </label>
              <input
                type="time"
                value={fromTime}
                onChange={(e) => setFromTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9A7B1D]"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                To Time
              </label>
              <input
                type="time"
                value={toTime}
                onChange={(e) => setToTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9A7B1D]"
              />
            </div>
          </div>

          <div className="mb-4 flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch("");
                setFilterType("all");
                setFromDate("");
                setToDate("");
                setFromTime("");
                setToTime("");
              }}
            >
              Clear Filters
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400 mb-2" />
              <p className="text-gray-500">Loading activity log...</p>
            </div>
          ) : filteredActivities.length === 0 ? (
            <p className="text-center py-8 text-gray-500">No activity found</p>
          ) : (
            <div className="space-y-3">
              {filteredActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="border border-gray-200 rounded-lg p-4 bg-white"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={getTypeBadgeClass(activity.type)}>
                        {(activity.type || "unknown")
                          .replace("_", " ")
                          .replace("_", " ")}
                      </Badge>
                      <span className="text-sm text-gray-700 font-medium">
                        {activity.user_name || "Unknown user"}
                      </span>
                      <span className="text-xs text-gray-500">
                        {activity.user_role || "-"}
                      </span>
                    </div>
                    <span className="text-xs sm:text-sm text-gray-500">
                      {activity.timestamp
                        ? format(new Date(activity.timestamp), "PPP p")
                        : "No timestamp"}
                    </span>
                  </div>

                  <p className="text-sm text-gray-700">
                    {activity.description}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-4 text-xs text-gray-500">
                    {activity.booking_id && (
                      <span>
                        Booking ID:{" "}
                        <span className="font-mono">{activity.booking_id}</span>
                      </span>
                    )}
                    {activity.patient_id && (
                      <span>
                        Patient ID:{" "}
                        <span className="font-mono">{activity.patient_id}</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SettingsContent({ authToken }: { authToken: string }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">
            Configure which services and practitioners are visible and bookable
            across the frontend.
          </p>
        </CardContent>
      </Card>
      <AvailabilitySettingsPanel authToken={authToken} />
    </div>
  );
}
