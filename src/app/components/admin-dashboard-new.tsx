import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Switch } from "./ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
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
  FileText,
  Image as ImageIcon,
  Trash2,
  Pencil,
  Plus,
} from "lucide-react";
import { supabase } from "../../../utils/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  DEFAULT_AVAILABILITY_CONFIG,
  fetchAvailabilityConfig,
  getAvailableTimeSlots,
  isOperatingHoursRangeValid,
  OPERATING_DAYS,
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
      const savedConfig = await updateAvailabilityConfig(nextConfig, authToken);
      setAvailabilityConfig(savedConfig);
      setAvailabilityConfig(await fetchAvailabilityConfig());
    } finally {
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

  const updateOperatingDay = async (
    dayKey: (typeof OPERATING_DAYS)[number]["key"],
    field: "enabled" | "start" | "end",
    value: boolean | string,
  ) => {
    const currentDay = availabilityConfig.operatingHours[dayKey];
    const nextDay = {
      ...currentDay,
      [field]: value,
    };

    if (
      nextDay.enabled &&
      !isOperatingHoursRangeValid(nextDay.start, nextDay.end)
    ) {
      toast.error("Operating hours must allow at least one 30-minute slot");
      return;
    }

    const nextConfig = {
      ...availabilityConfig,
      operatingHours: {
        ...availabilityConfig.operatingHours,
        [dayKey]: nextDay,
      },
    };

    setAvailabilityConfig(nextConfig);
    await persistAvailability(nextConfig, `hours:${dayKey}:${field}`);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Operating Hours</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingAvailability ? (
            <p className="text-gray-500">Loading availability settings...</p>
          ) : (
            <div className="space-y-3">
              {OPERATING_DAYS.map((day) => {
                const dayConfig = availabilityConfig.operatingHours[day.key];
                const slots = dayConfig.enabled
                  ? getAvailableTimeSlots(
                      availabilityConfig,
                      new Date(
                        `${
                          {
                            monday: "2026-04-06",
                            tuesday: "2026-04-07",
                            wednesday: "2026-04-08",
                            thursday: "2026-04-09",
                            friday: "2026-04-10",
                            saturday: "2026-04-11",
                            sunday: "2026-04-12",
                          }[day.key]
                        }T12:00:00`,
                      ),
                    )
                  : [];

                return (
                  <div
                    key={day.key}
                    className="rounded-lg border border-gray-200 p-4"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {day.label}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {dayConfig.enabled
                            ? `${slots.length} booking slot${slots.length === 1 ? "" : "s"} available`
                            : "Closed for bookings"}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge
                          className={
                            dayConfig.enabled
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-700"
                          }
                        >
                          {dayConfig.enabled ? "Open" : "Closed"}
                        </Badge>
                        <Switch
                          checked={dayConfig.enabled}
                          disabled={savingKey === `hours:${day.key}:enabled`}
                          onCheckedChange={(checked) =>
                            updateOperatingDay(day.key, "enabled", checked)
                          }
                        />
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Opens
                        </label>
                        <input
                          type="time"
                          step="1800"
                          value={dayConfig.start}
                          disabled={!dayConfig.enabled}
                          onChange={(e) =>
                            updateOperatingDay(day.key, "start", e.target.value)
                          }
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#9A7B1D] disabled:bg-gray-100"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Closes
                        </label>
                        <input
                          type="time"
                          step="1800"
                          value={dayConfig.end}
                          disabled={!dayConfig.enabled}
                          onChange={(e) =>
                            updateOperatingDay(day.key, "end", e.target.value)
                          }
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#9A7B1D] disabled:bg-gray-100"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

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
                              Available when enabled and the parent service is
                              on.
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
    </div>
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
      const normalizePhone = (value: string) =>
        String(value || "")
          .replace(/\s+/g, "")
          .replace(/[^\d+]/g, "");
      const normalizeText = (value: string) =>
        String(value || "")
          .trim()
          .toLowerCase();

      let existingPatient: { id: string } | null = null;
      const bookingIdNumber = String(booking.id_number || "").trim();

      if (bookingIdNumber) {
        const { data: idMatch, error: idError } = await supabase
          .from("patients")
          .select("id")
          .eq("id_number", bookingIdNumber)
          .maybeSingle();

        if (idError) {
          console.error("Error checking patient by ID number:", idError);
        }

        if (idMatch) {
          existingPatient = idMatch;
        }
      }

      if (!existingPatient) {
        const bookingPhone = normalizePhone(booking.phone || "");
        const bookingFirstName = normalizeText(booking.first_name || "");
        const bookingLastName = normalizeText(booking.last_name || "");

        const { data: samePhonePatients, error: phoneError } = await supabase
          .from("patients")
          .select("id, first_name, last_name, phone")
          .eq("phone", booking.phone || "");

        if (phoneError) {
          console.error("Error checking patient by phone:", phoneError);
        }

        const matchedByNameAndPhone = (samePhonePatients || []).find(
          (patient: any) =>
            normalizePhone(patient.phone || "") === bookingPhone &&
            normalizeText(patient.first_name || "") === bookingFirstName &&
            normalizeText(patient.last_name || "") === bookingLastName,
        );

        if (matchedByNameAndPhone) {
          existingPatient = { id: matchedByNameAndPhone.id };
        }
      }

      if (!existingPatient) {
        const { error: patientError } = await supabase.from("patients").insert({
          first_name: booking.first_name,
          last_name: booking.last_name,
          phone: booking.phone,
          email: booking.email || null,
          id_number: booking.id_number || null,
          medical_aid: booking.medical_aid || null,
          medical_aid_number: booking.medical_aid_number || null,
          last_visit: new Date().toISOString(),
        });

        if (patientError) {
          console.error("Error creating patient:", patientError);
          toast.error("Booking confirmed, but failed to add patient record");
        } else {
          toast.success("New patient was added automatically");
        }
      } else {
        await supabase
          .from("patients")
          .update({
            last_visit: new Date().toISOString(),
            email: booking.email || null,
            medical_aid: booking.medical_aid || null,
            medical_aid_number: booking.medical_aid_number || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingPatient.id);
      }

      const { error: updateError } = await supabase
        .from("bookings")
        .update({ status: "confirmed" })
        .eq("id", booking.id);

      if (updateError) {
        toast.error("Failed to confirm booking");
        console.error(updateError);
        return;
      }

      toast.success("Booking confirmed successfully!");
      await sendWhatsAppNotification(booking, "confirmed");
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
  const EMPTY_PATIENT_FORM = {
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
  };

  const EMPTY_MEDICAL_FORM = {
    blood_type: "",
    allergies: "",
    chronic_conditions: "",
    current_medications: "",
    primary_physician: "",
    family_history: "",
    insurance_notes: "",
  };

  const DOCUMENT_CATEGORY_OPTIONS = [
    { value: "medical-record", label: "Medical Record" },
    { value: "x-ray", label: "X-Ray" },
    { value: "dr-note", label: "Dr Note" },
    { value: "lab-result", label: "Lab Result" },
    { value: "prescription", label: "Prescription" },
    { value: "consent-form", label: "Consent Form" },
    { value: "referral", label: "Referral" },
    { value: "invoice", label: "Invoice" },
    { value: "other", label: "Other" },
  ];

  const [patients, setPatients] = useState<any[]>([]);
  const [patientSearch, setPatientSearch] = useState("");
  const [showAddPatientDialog, setShowAddPatientDialog] = useState(false);
  const [showPatientDetailsDialog, setShowPatientDetailsDialog] =
    useState(false);
  const [savingPatient, setSavingPatient] = useState(false);
  const [savingMedicalProfile, setSavingMedicalProfile] = useState(false);
  const [savingClinicalNote, setSavingClinicalNote] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [loadingPatientData, setLoadingPatientData] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [patientNotes, setPatientNotes] = useState<any[]>([]);
  const [patientDocuments, setPatientDocuments] = useState<any[]>([]);
  const [activeDocumentCategoryTab, setActiveDocumentCategoryTab] =
    useState("medical-record");
  const [selectedDocumentPreview, setSelectedDocumentPreview] =
    useState<any>(null);
  const [selectedDocumentPreviewUrl, setSelectedDocumentPreviewUrl] =
    useState("");
  const [loadingDocumentPreview, setLoadingDocumentPreview] = useState(false);
  const [patientForm, setPatientForm] = useState(EMPTY_PATIENT_FORM);
  const [newPatientForm, setNewPatientForm] = useState(EMPTY_PATIENT_FORM);
  const [medicalForm, setMedicalForm] = useState(EMPTY_MEDICAL_FORM);
  const [noteForm, setNoteForm] = useState({
    id: "",
    title: "",
    content: "",
  });
  const documentUploadInputRef = useRef<HTMLInputElement | null>(null);
  const [loading, setLoading] = useState(true);

  const getDocumentCategoryLabel = (category: string) =>
    DOCUMENT_CATEGORY_OPTIONS.find((option) => option.value === category)
      ?.label || "Other";

  const getDocumentTabLabel = (category: string) => {
    if (category === "other") return "Other Documents";
    return getDocumentCategoryLabel(category);
  };

  const normalizeDocumentCategory = (category?: string) => {
    const knownCategory = DOCUMENT_CATEGORY_OPTIONS.some(
      (option) => option.value === category,
    );
    return knownCategory ? category || "other" : "other";
  };

  const documentCategoryTabs = [
    ...DOCUMENT_CATEGORY_OPTIONS.filter((option) => option.value !== "other"),
    { value: "other", label: "Other Documents" },
  ];

  const visiblePatientDocuments = patientDocuments.filter(
    (document) =>
      normalizeDocumentCategory(document.category) ===
      activeDocumentCategoryTab,
  );

  const getDocumentFolderName = (category: string) => {
    const folderMap: Record<string, string> = {
      "medical-record": "medical-records",
      "x-ray": "x-rays",
      "dr-note": "notes",
      "lab-result": "lab-results",
      prescription: "prescriptions",
      "consent-form": "consent-forms",
      referral: "referrals",
      invoice: "invoices",
      other: "other",
    };

    return folderMap[category] || "other";
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    if (!visiblePatientDocuments.length) {
      setSelectedDocumentPreview(null);
      setSelectedDocumentPreviewUrl("");
      return;
    }

    const selectedStillExists = visiblePatientDocuments.some(
      (document) => document.id === selectedDocumentPreview?.id,
    );

    if (!selectedStillExists) {
      void handleSelectDocumentForPreview(visiblePatientDocuments[0]);
    }
  }, [activeDocumentCategoryTab, patientDocuments]);

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

  const loadPatientRelatedData = async (patientId: string) => {
    try {
      setLoadingPatientData(true);

      const [medicalResult, notesResult, documentsResult] = await Promise.all([
        supabase
          .from("patient_medical_details")
          .select("*")
          .eq("patient_id", patientId)
          .maybeSingle(),
        supabase
          .from("patient_clinical_notes")
          .select("*")
          .eq("patient_id", patientId)
          .order("created_at", { ascending: false }),
        supabase
          .from("patient_documents")
          .select("*")
          .eq("patient_id", patientId)
          .order("created_at", { ascending: false }),
      ]);

      if (medicalResult.error) {
        console.error("Failed to fetch medical details:", medicalResult.error);
      }
      if (notesResult.error) {
        console.error("Failed to fetch clinical notes:", notesResult.error);
      }
      if (documentsResult.error) {
        console.error("Failed to fetch documents:", documentsResult.error);
      }

      setMedicalForm({
        blood_type: medicalResult.data?.blood_type || "",
        allergies: medicalResult.data?.allergies || "",
        chronic_conditions: medicalResult.data?.chronic_conditions || "",
        current_medications: medicalResult.data?.current_medications || "",
        primary_physician: medicalResult.data?.primary_physician || "",
        family_history: medicalResult.data?.family_history || "",
        insurance_notes: medicalResult.data?.insurance_notes || "",
      });

      setPatientNotes(notesResult.data || []);
      setPatientDocuments(documentsResult.data || []);
    } catch (error) {
      console.error("Failed to load patient related data:", error);
      toast.error("Failed to load patient records");
    } finally {
      setLoadingPatientData(false);
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

  const handlePatientRowClick = async (patient: any) => {
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
    setNoteForm({ id: "", title: "", content: "" });
    setActiveDocumentCategoryTab("medical-record");
    setSelectedDocumentPreview(null);
    setSelectedDocumentPreviewUrl("");
    setShowPatientDetailsDialog(true);
    await loadPatientRelatedData(patient.id);
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
      await fetchPatients();
    } catch (err) {
      console.error("Error updating patient:", err);
      toast.error("Failed to update patient");
    } finally {
      setSavingPatient(false);
    }
  };

  const handleSaveMedicalProfile = async () => {
    if (!selectedPatient) return;

    try {
      setSavingMedicalProfile(true);

      const { error } = await supabase.from("patient_medical_details").upsert(
        {
          patient_id: selectedPatient.id,
          blood_type: medicalForm.blood_type.trim() || null,
          allergies: medicalForm.allergies.trim() || null,
          chronic_conditions: medicalForm.chronic_conditions.trim() || null,
          current_medications: medicalForm.current_medications.trim() || null,
          primary_physician: medicalForm.primary_physician.trim() || null,
          family_history: medicalForm.family_history.trim() || null,
          insurance_notes: medicalForm.insurance_notes.trim() || null,
        },
        { onConflict: "patient_id" },
      );

      if (error) {
        console.error("Failed to save medical profile:", error);
        toast.error("Failed to save medical profile");
        return;
      }

      toast.success("Medical details saved");
      await loadPatientRelatedData(selectedPatient.id);
    } catch (error) {
      console.error("Failed to save medical profile:", error);
      toast.error("Failed to save medical profile");
    } finally {
      setSavingMedicalProfile(false);
    }
  };

  const handleSaveClinicalNote = async () => {
    if (!selectedPatient) return;
    if (!noteForm.content.trim()) {
      toast.error("Note content is required");
      return;
    }

    try {
      setSavingClinicalNote(true);

      if (noteForm.id) {
        const { error } = await supabase
          .from("patient_clinical_notes")
          .update({
            title: noteForm.title.trim() || null,
            content: noteForm.content.trim(),
            author_name: "Admin",
          })
          .eq("id", noteForm.id);

        if (error) {
          console.error("Failed to update note:", error);
          toast.error("Failed to update note");
          return;
        }

        toast.success("Note updated");
      } else {
        const { error } = await supabase.from("patient_clinical_notes").insert({
          patient_id: selectedPatient.id,
          title: noteForm.title.trim() || null,
          content: noteForm.content.trim(),
          author_name: "Admin",
        });

        if (error) {
          console.error("Failed to add note:", error);
          toast.error("Failed to add note");
          return;
        }

        toast.success("Note added");
      }

      setNoteForm({ id: "", title: "", content: "" });
      await loadPatientRelatedData(selectedPatient.id);
    } catch (error) {
      console.error("Failed to save note:", error);
      toast.error("Failed to save note");
    } finally {
      setSavingClinicalNote(false);
    }
  };

  const handleDeleteClinicalNote = async (noteId: string) => {
    if (!selectedPatient) return;

    try {
      const { error } = await supabase
        .from("patient_clinical_notes")
        .delete()
        .eq("id", noteId);

      if (error) {
        console.error("Failed to delete note:", error);
        toast.error("Failed to delete note");
        return;
      }

      toast.success("Note deleted");
      await loadPatientRelatedData(selectedPatient.id);
    } catch (error) {
      console.error("Failed to delete note:", error);
      toast.error("Failed to delete note");
    }
  };

  const handleOpenDocument = async (document: any) => {
    try {
      const { data, error } = await supabase.storage
        .from("patient-files")
        .createSignedUrl(document.file_path, 60);

      if (error || !data?.signedUrl) {
        console.error("Failed to open document:", error);
        toast.error("Could not open file");
        return;
      }

      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error("Failed to open document:", error);
      toast.error("Could not open file");
    }
  };

  const getDocumentExtension = (document: any) => {
    const fileName = String(document?.file_name || "");
    const extension = fileName.split(".").pop()?.toLowerCase();
    return extension || "";
  };

  const isImageDocument = (document: any) => {
    const extension = getDocumentExtension(document);
    return (
      String(document?.mime_type || "").startsWith("image/") ||
      ["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg"].includes(extension)
    );
  };

  const isPdfDocument = (document: any) => {
    const extension = getDocumentExtension(document);
    return (
      String(document?.mime_type || "") === "application/pdf" ||
      extension === "pdf"
    );
  };

  const handleSelectDocumentForPreview = async (document: any) => {
    setSelectedDocumentPreview(document);
    setSelectedDocumentPreviewUrl("");
    setLoadingDocumentPreview(true);

    try {
      const { data, error } = await supabase.storage
        .from("patient-files")
        .createSignedUrl(document.file_path, 300);

      if (error || !data?.signedUrl) {
        console.error("Failed to preview document:", error);
        toast.error("Could not load document preview");
        return;
      }

      setSelectedDocumentPreviewUrl(data.signedUrl);
    } catch (error) {
      console.error("Failed to preview document:", error);
      toast.error("Could not load document preview");
    } finally {
      setLoadingDocumentPreview(false);
    }
  };

  const handleDeleteDocument = async (document: any) => {
    if (!selectedPatient) return;

    try {
      const { error: storageError } = await supabase.storage
        .from("patient-files")
        .remove([document.file_path]);

      if (storageError) {
        console.error("Failed to remove file from storage:", storageError);
      }

      const { error } = await supabase
        .from("patient_documents")
        .delete()
        .eq("id", document.id);

      if (error) {
        console.error("Failed to delete document:", error);
        toast.error("Failed to delete document");
        return;
      }

      if (selectedDocumentPreview?.id === document.id) {
        setSelectedDocumentPreview(null);
        setSelectedDocumentPreviewUrl("");
      }

      toast.success("Document deleted");
      await loadPatientRelatedData(selectedPatient.id);
    } catch (error) {
      console.error("Failed to delete document:", error);
      toast.error("Failed to delete document");
    }
  };

  const inferDocumentCategory = (file: File) => {
    if (file.type.startsWith("image/")) return "x-ray";
    if (file.type === "application/pdf") return "medical-record";
    return "other";
  };

  const handleQuickUploadDocument = async (
    file: File | null,
    preferredCategory?: string,
  ) => {
    if (!selectedPatient) return;
    if (!file) {
      toast.error("Please choose a file to upload");
      return;
    }

    try {
      setUploadingDocument(true);

      const category =
        preferredCategory && preferredCategory !== "other"
          ? preferredCategory
          : preferredCategory || inferDocumentCategory(file);
      const now = new Date();
      const year = String(now.getFullYear());
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const folderName = getDocumentFolderName(category);
      const titleFromName = file.name.replace(/\.[^/.]+$/, "") || "Document";
      const safeTitle = titleFromName
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "")
        .replace(/-+/g, "-")
        .slice(0, 40);

      const sanitizedName = file.name
        .replace(/\s+/g, "-")
        .replace(/[^a-zA-Z0-9._-]/g, "")
        .toLowerCase();
      const filePath = `${selectedPatient.id}/${folderName}/${year}/${month}/${safeTitle || "document"}-${Date.now()}-${sanitizedName}`;

      const { error: uploadError } = await supabase.storage
        .from("patient-files")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.error("File upload failed:", uploadError);
        toast.error("File upload failed");
        return;
      }

      const { data: insertedDocument, error: insertError } = await supabase
        .from("patient_documents")
        .insert({
          patient_id: selectedPatient.id,
          category,
          title: titleFromName,
          file_name: file.name,
          file_path: filePath,
          mime_type: file.type || null,
          size_bytes: file.size,
          uploaded_by: "Admin",
        })
        .select("*")
        .single();

      if (insertError) {
        console.error("Failed to save document metadata:", insertError);
        toast.error("Failed to save document metadata");
        return;
      }

      toast.success("Document uploaded");
      await loadPatientRelatedData(selectedPatient.id);

      if (insertedDocument) {
        await handleSelectDocumentForPreview(insertedDocument);
      }
    } catch (error) {
      console.error("Failed to upload document:", error);
      toast.error("Failed to upload document");
    } finally {
      setUploadingDocument(false);
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
      setNewPatientForm(EMPTY_PATIENT_FORM);
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
            setNewPatientForm(EMPTY_PATIENT_FORM);
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
            setPatientNotes([]);
            setPatientDocuments([]);
            setMedicalForm(EMPTY_MEDICAL_FORM);
            setNoteForm({ id: "", title: "", content: "" });
            setActiveDocumentCategoryTab("medical-record");
            setSelectedDocumentPreview(null);
            setSelectedDocumentPreviewUrl("");
          }
        }}
      >
        <DialogContent className="w-[calc(100vw-0.75rem)] sm:w-[96vw] max-w-5xl h-[92vh] max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden">
          {/* Header */}
          <div className="flex items-start gap-3 px-4 sm:px-6 pt-5 sm:pt-6 pb-4 border-b border-gray-100">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#9A7B1D]/10 flex items-center justify-center">
              <User className="w-5 h-5 text-[#9A7B1D]" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-base font-semibold text-gray-900 leading-tight">
                {selectedPatient
                  ? `${selectedPatient.first_name ?? ""} ${selectedPatient.last_name ?? ""}`.trim() ||
                    "Patient"
                  : "Patient"}
              </DialogTitle>
              <DialogDescription>
                <span className="text-xs text-gray-500 mt-0.5 block">
                  {selectedPatient?.id_number
                    ? `ID: ${selectedPatient.id_number}`
                    : "Patient record"}
                  {selectedPatient?.last_visit
                    ? ` � Last visit: ${format(new Date(selectedPatient.last_visit), "d MMM yyyy")}`
                    : ""}
                </span>
              </DialogDescription>
            </div>
            {loadingPatientData && (
              <div className="ml-auto flex-shrink-0 text-xs text-gray-400 flex items-center gap-1">
                <RefreshCw className="w-3 h-3 animate-spin" /> Loading...
              </div>
            )}
          </div>
          {/* Tabs */}
          <Tabs defaultValue="profile" className="flex flex-col flex-1 min-h-0">
            <div className="flex-shrink-0 mt-3 mb-0 px-4 sm:px-6 overflow-x-auto">
              <TabsList className="bg-gray-100 rounded-lg h-9 w-max min-w-max gap-0.5">
                <TabsTrigger value="profile" className="text-xs px-3">
                  Profile
                </TabsTrigger>
                <TabsTrigger value="medical" className="text-xs px-3">
                  Medical
                </TabsTrigger>
                <TabsTrigger value="notes" className="text-xs px-3">
                  Dr Notes
                  {patientNotes.length > 0 && (
                    <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#9A7B1D]/15 text-[#9A7B1D] text-[10px] font-semibold">
                      {patientNotes.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="documents" className="text-xs px-3">
                  Documents
                  {patientDocuments.length > 0 && (
                    <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#9A7B1D]/15 text-[#9A7B1D] text-[10px] font-semibold">
                      {patientDocuments.length}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>
            </div>
            {/* Profile */}
            <TabsContent
              value="profile"
              className="flex-1 overflow-auto px-4 sm:px-6 py-4 space-y-5 mt-0"
            >
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">
                  Personal Information
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500">First name</label>
                    <input
                      type="text"
                      value={patientForm.first_name}
                      onChange={(e) =>
                        setPatientForm((prev) => ({
                          ...prev,
                          first_name: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9A7B1D]/40 focus:border-[#9A7B1D]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500">Last name</label>
                    <input
                      type="text"
                      value={patientForm.last_name}
                      onChange={(e) =>
                        setPatientForm((prev) => ({
                          ...prev,
                          last_name: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9A7B1D]/40 focus:border-[#9A7B1D]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500">ID number</label>
                    <input
                      type="text"
                      value={patientForm.id_number}
                      onChange={(e) =>
                        setPatientForm((prev) => ({
                          ...prev,
                          id_number: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9A7B1D]/40 focus:border-[#9A7B1D]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500">
                      Date of birth
                    </label>
                    <input
                      type="date"
                      value={patientForm.date_of_birth}
                      onChange={(e) =>
                        setPatientForm((prev) => ({
                          ...prev,
                          date_of_birth: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9A7B1D]/40 focus:border-[#9A7B1D]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500">Phone</label>
                    <input
                      type="text"
                      value={patientForm.phone}
                      onChange={(e) =>
                        setPatientForm((prev) => ({
                          ...prev,
                          phone: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9A7B1D]/40 focus:border-[#9A7B1D]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500">Email</label>
                    <input
                      type="email"
                      value={patientForm.email}
                      onChange={(e) =>
                        setPatientForm((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9A7B1D]/40 focus:border-[#9A7B1D]"
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs text-gray-500">Address</label>
                    <textarea
                      value={patientForm.address}
                      rows={2}
                      onChange={(e) =>
                        setPatientForm((prev) => ({
                          ...prev,
                          address: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9A7B1D]/40 focus:border-[#9A7B1D] resize-none"
                    />
                  </div>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">
                  Medical Aid
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500">Medical aid</label>
                    <input
                      type="text"
                      value={patientForm.medical_aid}
                      onChange={(e) =>
                        setPatientForm((prev) => ({
                          ...prev,
                          medical_aid: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9A7B1D]/40 focus:border-[#9A7B1D]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500">
                      Medical aid number
                    </label>
                    <input
                      type="text"
                      value={patientForm.medical_aid_number}
                      onChange={(e) =>
                        setPatientForm((prev) => ({
                          ...prev,
                          medical_aid_number: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9A7B1D]/40 focus:border-[#9A7B1D]"
                    />
                  </div>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">
                  Emergency Contact
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500">Name</label>
                    <input
                      type="text"
                      value={patientForm.emergency_contact_name}
                      onChange={(e) =>
                        setPatientForm((prev) => ({
                          ...prev,
                          emergency_contact_name: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9A7B1D]/40 focus:border-[#9A7B1D]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500">Phone</label>
                    <input
                      type="text"
                      value={patientForm.emergency_contact_phone}
                      onChange={(e) =>
                        setPatientForm((prev) => ({
                          ...prev,
                          emergency_contact_phone: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9A7B1D]/40 focus:border-[#9A7B1D]"
                    />
                  </div>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">
                  General Notes
                </p>
                <textarea
                  value={patientForm.notes}
                  rows={3}
                  onChange={(e) =>
                    setPatientForm((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                  placeholder="Any general notes about this patient..."
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9A7B1D]/40 focus:border-[#9A7B1D] resize-none"
                />
              </div>
              {(selectedPatient?.created_at || selectedPatient?.updated_at) && (
                <div className="flex gap-4 text-xs text-gray-400">
                  {selectedPatient.created_at && (
                    <span>
                      Added{" "}
                      {format(
                        new Date(selectedPatient.created_at),
                        "d MMM yyyy",
                      )}
                    </span>
                  )}
                  {selectedPatient.updated_at && (
                    <span>
                      Updated{" "}
                      {format(
                        new Date(selectedPatient.updated_at),
                        "d MMM yyyy",
                      )}
                    </span>
                  )}
                </div>
              )}
              <div className="flex justify-end pb-2">
                <Button
                  onClick={handleSavePatientChanges}
                  disabled={savingPatient}
                  className="bg-[#9A7B1D] hover:bg-[#7d6418] text-white text-sm"
                >
                  {savingPatient ? "Saving..." : "Save Profile"}
                </Button>
              </div>
            </TabsContent>
            {/* Medical */}
            <TabsContent
              value="medical"
              className="flex-1 overflow-auto px-4 sm:px-6 py-4 space-y-5 mt-0"
            >
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">
                  Health Overview
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500">Blood type</label>
                    <input
                      type="text"
                      value={medicalForm.blood_type}
                      onChange={(e) =>
                        setMedicalForm((prev) => ({
                          ...prev,
                          blood_type: e.target.value,
                        }))
                      }
                      placeholder="e.g. A+"
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9A7B1D]/40 focus:border-[#9A7B1D]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500">
                      Primary physician
                    </label>
                    <input
                      type="text"
                      value={medicalForm.primary_physician}
                      onChange={(e) =>
                        setMedicalForm((prev) => ({
                          ...prev,
                          primary_physician: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9A7B1D]/40 focus:border-[#9A7B1D]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500">Allergies</label>
                    <textarea
                      value={medicalForm.allergies}
                      rows={3}
                      onChange={(e) =>
                        setMedicalForm((prev) => ({
                          ...prev,
                          allergies: e.target.value,
                        }))
                      }
                      placeholder="List any known allergies..."
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9A7B1D]/40 focus:border-[#9A7B1D] resize-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500">
                      Chronic conditions
                    </label>
                    <textarea
                      value={medicalForm.chronic_conditions}
                      rows={3}
                      onChange={(e) =>
                        setMedicalForm((prev) => ({
                          ...prev,
                          chronic_conditions: e.target.value,
                        }))
                      }
                      placeholder="Diabetes, hypertension..."
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9A7B1D]/40 focus:border-[#9A7B1D] resize-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500">
                      Current medications
                    </label>
                    <textarea
                      value={medicalForm.current_medications}
                      rows={3}
                      onChange={(e) =>
                        setMedicalForm((prev) => ({
                          ...prev,
                          current_medications: e.target.value,
                        }))
                      }
                      placeholder="Name, dosage..."
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9A7B1D]/40 focus:border-[#9A7B1D] resize-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500">
                      Family history
                    </label>
                    <textarea
                      value={medicalForm.family_history}
                      rows={3}
                      onChange={(e) =>
                        setMedicalForm((prev) => ({
                          ...prev,
                          family_history: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9A7B1D]/40 focus:border-[#9A7B1D] resize-none"
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs text-gray-500">
                      Insurance notes
                    </label>
                    <textarea
                      value={medicalForm.insurance_notes}
                      rows={3}
                      onChange={(e) =>
                        setMedicalForm((prev) => ({
                          ...prev,
                          insurance_notes: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9A7B1D]/40 focus:border-[#9A7B1D] resize-none"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end pb-2">
                <Button
                  onClick={handleSaveMedicalProfile}
                  disabled={savingMedicalProfile || !selectedPatient}
                  className="bg-[#9A7B1D] hover:bg-[#7d6418] text-white text-sm"
                >
                  {savingMedicalProfile ? "Saving..." : "Save Medical Details"}
                </Button>
              </div>
            </TabsContent>
            {/* Dr Notes */}
            <TabsContent
              value="notes"
              className="flex-1 overflow-auto px-4 sm:px-6 py-4 mt-0 flex flex-col gap-4"
            >
              {/* Compose area */}
              <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  {noteForm.id ? "Edit note" : "New note"}
                </p>
                <input
                  type="text"
                  value={noteForm.title}
                  onChange={(e) =>
                    setNoteForm((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="Title (optional)"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#9A7B1D]/40 focus:border-[#9A7B1D]"
                />
                <textarea
                  value={noteForm.content}
                  rows={5}
                  onChange={(e) =>
                    setNoteForm((prev) => ({
                      ...prev,
                      content: e.target.value,
                    }))
                  }
                  placeholder="Write clinical notes here..."
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#9A7B1D]/40 focus:border-[#9A7B1D] resize-none"
                />
                <div className="flex gap-2 justify-end">
                  {noteForm.id && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setNoteForm({ id: "", title: "", content: "" })
                      }
                    >
                      Cancel
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={handleSaveClinicalNote}
                    disabled={savingClinicalNote || !selectedPatient}
                    className="bg-[#9A7B1D] hover:bg-[#7d6418] text-white"
                  >
                    {savingClinicalNote
                      ? "Saving..."
                      : noteForm.id
                        ? "Update"
                        : "Add Note"}
                  </Button>
                </div>
              </div>
              {/* Notes list */}
              <div className="space-y-2 pb-2">
                {patientNotes.length === 0 ? (
                  <div className="text-center py-10 text-gray-400 text-sm">
                    No notes yet.
                  </div>
                ) : (
                  patientNotes.map((note) => (
                    <div
                      key={note.id}
                      className="rounded-xl border border-gray-200 bg-white p-4"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-800">
                            {note.title || "Untitled"}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {note.created_at
                              ? format(
                                  new Date(note.created_at),
                                  "d MMM yyyy - HH:mm",
                                )
                              : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              setNoteForm({
                                id: note.id,
                                title: note.title || "",
                                content: note.content || "",
                              })
                            }
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteClinicalNote(note.id)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap leading-relaxed">
                        {note.content}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
            {/* Documents */}
            <TabsContent
              value="documents"
              className="flex-1 overflow-auto px-4 sm:px-6 py-4 mt-0"
            >
              <div className="h-full min-w-0 grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="rounded-xl border border-gray-200 bg-white p-3 overflow-auto">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">
                    Documents
                  </p>

                  <input
                    ref={documentUploadInputRef}
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      void handleQuickUploadDocument(
                        file,
                        activeDocumentCategoryTab,
                      );
                      e.currentTarget.value = "";
                    }}
                  />

                  <div className="mb-3 overflow-x-auto">
                    <div className="inline-flex min-w-full gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1">
                      {documentCategoryTabs.map((tab) => {
                        const tabCount = patientDocuments.filter(
                          (document) =>
                            normalizeDocumentCategory(document.category) ===
                            tab.value,
                        ).length;

                        const isActive =
                          activeDocumentCategoryTab === tab.value;

                        return (
                          <button
                            key={tab.value}
                            type="button"
                            onClick={() =>
                              setActiveDocumentCategoryTab(tab.value)
                            }
                            className={`whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                              isActive
                                ? "bg-white text-[#7d6418] shadow-sm"
                                : "text-gray-500 hover:text-gray-700"
                            }`}
                          >
                            {tab.label} {tabCount > 0 ? `(${tabCount})` : ""}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-2 min-w-0">
                    <button
                      type="button"
                      onClick={() => documentUploadInputRef.current?.click()}
                      disabled={!selectedPatient || uploadingDocument}
                      className="relative h-20 sm:h-24 rounded-xl border border-dashed border-[#9A7B1D]/50 bg-[#9A7B1D]/5 hover:bg-[#9A7B1D]/10 transition-colors p-1.5 flex flex-col items-center justify-center text-center disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <div className="relative">
                        <FileText className="w-7 h-7 text-[#9A7B1D]" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Plus className="w-3 h-3 text-[#9A7B1D]" />
                        </div>
                      </div>
                      <p className="mt-1 text-[10px] font-medium text-[#7d6418] leading-tight">
                        {uploadingDocument ? "Uploading..." : "Add file"}
                      </p>
                    </button>

                    {visiblePatientDocuments.map((document) => {
                      const isSelected =
                        selectedDocumentPreview?.id === document.id;
                      const isImage = isImageDocument(document);

                      return (
                        <div
                          key={document.id}
                          role="button"
                          tabIndex={0}
                          onClick={() =>
                            void handleSelectDocumentForPreview(document)
                          }
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              void handleSelectDocumentForPreview(document);
                            }
                          }}
                          className={`relative h-20 sm:h-24 rounded-xl border p-1.5 text-left transition-colors cursor-pointer ${
                            isSelected
                              ? "border-[#9A7B1D] bg-[#9A7B1D]/10"
                              : "border-gray-200 bg-gray-50 hover:bg-gray-100"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              void handleDeleteDocument(document);
                            }}
                            className="absolute top-1.5 right-1.5 p-1 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50"
                            title="Delete file"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          <div className="w-full h-full flex flex-col items-center justify-center text-center">
                            <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center mb-1">
                              {isImage ? (
                                <ImageIcon className="w-4 h-4 text-[#9A7B1D]" />
                              ) : (
                                <FileText className="w-4 h-4 text-[#9A7B1D]" />
                              )}
                            </div>
                            <p className="text-[10px] font-medium text-gray-700 line-clamp-2 break-words px-0.5 leading-tight">
                              {document.title || document.file_name}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {visiblePatientDocuments.length === 0 && (
                    <p className="text-sm text-gray-400 mt-4 text-center">
                      No files in{" "}
                      {getDocumentTabLabel(activeDocumentCategoryTab)}.
                    </p>
                  )}
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-4 min-h-[320px] flex flex-col min-w-0 overflow-auto">
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-gray-100">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                        Preview
                      </p>
                      <p className="text-sm font-medium text-gray-800 truncate mt-1">
                        {selectedDocumentPreview
                          ? selectedDocumentPreview.title ||
                            selectedDocumentPreview.file_name
                          : "Select a file"}
                      </p>
                    </div>
                    {selectedDocumentPreview && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleOpenDocument(selectedDocumentPreview)
                        }
                        className="text-xs"
                      >
                        Open
                      </Button>
                    )}
                  </div>

                  <div className="flex-1 mt-3 rounded-lg border border-gray-100 bg-gray-50 overflow-auto flex items-center justify-center min-h-[220px]">
                    {!selectedDocumentPreview ? (
                      <p className="text-sm text-gray-400 px-4 text-center">
                        Click a file icon to preview it here.
                      </p>
                    ) : loadingDocumentPreview ? (
                      <p className="text-sm text-gray-400">
                        Loading preview...
                      </p>
                    ) : !selectedDocumentPreviewUrl ? (
                      <p className="text-sm text-gray-400 px-4 text-center">
                        Preview unavailable. Use Open to view this file.
                      </p>
                    ) : isImageDocument(selectedDocumentPreview) ? (
                      <img
                        src={selectedDocumentPreviewUrl}
                        alt={
                          selectedDocumentPreview.file_name || "Patient file"
                        }
                        className="w-full h-full object-contain"
                      />
                    ) : isPdfDocument(selectedDocumentPreview) ? (
                      <iframe
                        src={selectedDocumentPreviewUrl}
                        title={
                          selectedDocumentPreview.file_name ||
                          "Document preview"
                        }
                        className="w-full h-full"
                      />
                    ) : (
                      <p className="text-sm text-gray-400 px-4 text-center">
                        This file type cannot be embedded. Use Open to view it.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Footer */}
          <div className="flex-shrink-0 flex justify-end px-4 sm:px-6 py-3 border-t border-gray-100">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPatientDetailsDialog(false)}
            >
              Close
            </Button>
          </div>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Practice Name
                </p>
                <p className="text-base font-semibold break-words">
                  DentX Quarters
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Contact Number
                </p>
                <p className="text-base font-semibold break-words">
                  +27 68 534 0763
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p className="text-base font-semibold break-words">
                  info@dentxquarters.co.za
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Location</p>
                <p className="text-base font-semibold break-words">
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
            Configure operating hours, services, and practitioners that can be
            booked across the frontend.
          </p>
        </CardContent>
      </Card>
      <AvailabilitySettingsPanel authToken={authToken} />
    </div>
  );
}
