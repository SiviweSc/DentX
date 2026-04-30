import { useEffect, useState } from "react";
import {
  Calendar as BigCalendar,
  dateFnsLocalizer,
  Event,
} from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import {
  supabase,
  supabaseAdminApiBaseUrls,
} from "../../../utils/supabase/client";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Plus,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import {
  DEFAULT_AVAILABILITY_CONFIG,
  fetchAvailabilityConfig,
  getAvailableTimeSlots,
  isDateBookable,
  isPractitionerEnabled,
  isServiceEnabled,
  isTimeWithinOperatingHours,
  SERVICE_CATALOG,
} from "../lib/availability";

const locales = {
  "en-US": enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface BookingEvent extends Event {
  id: string;
  title: string;
  start: Date;
  end: Date;
  date_str: string;
  time_str: string;
  status: "confirmed" | "pending" | "cancelled" | "completed";
  service_type: string;
  practitioner_type: string;
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
  reason?: string;
  medical_aid?: string;
  medical_aid_number?: string;
  id_number?: string;
  created_at?: string;
  assigned_doctor_username?: string;
}

interface CreateBookingForm {
  serviceType: string;
  practitionerType: string;
  date: string;
  time: string;
  createdAt: string;
  assignedDoctorId: string;
  reason: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  idNumber: string;
  medicalAid: string;
  medicalAidNumber: string;
}

const INITIAL_CREATE_FORM: CreateBookingForm = {
  serviceType: "",
  practitionerType: "",
  date: "",
  time: "",
  createdAt: "",
  assignedDoctorId: "",
  reason: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  idNumber: "",
  medicalAid: "",
  medicalAidNumber: "",
};

interface BookingCalendarProps {
  onClose?: () => void;
  authToken?: string;
  currentUserId?: number;
  currentUserRole?: string;
  canConfirmBooking?: boolean;
  canCompleteBooking?: boolean;
}

interface DoctorOption {
  id: number;
  username: string;
}

function toLocalDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDatePart(value: string) {
  return value.slice(0, 10);
}

function combineDateAndTime(dateValue: string, timeValue: string) {
  const [year, month, day] = dateValue.split("-").map(Number);
  const [hours, minutes] = timeValue.split(":").map(Number);
  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

function toDateTimeLocalValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function getWeekRangeLabel(currentDate: Date) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  return `${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d, yyyy")}`;
}

function CalendarEventContent({ event }: { event: BookingEvent }) {
  const statusMeta: Record<
    string,
    { label: string; badgeBg: string; badgeColor: string }
  > = {
    pending: {
      label: "Pending",
      badgeBg: "#fef3c7",
      badgeColor: "#92400e",
    },
    confirmed: {
      label: "Confirmed",
      badgeBg: "#d1fae5",
      badgeColor: "#065f46",
    },
    completed: {
      label: "Completed",
      badgeBg: "#e0e7ff",
      badgeColor: "#3730a3",
    },
    cancelled: {
      label: "Cancelled",
      badgeBg: "#ffe4e6",
      badgeColor: "#9f1239",
    },
  };
  const meta =
    statusMeta[event.status] ||
    ({
      label: event.status,
      badgeBg: "#f3f4f6",
      badgeColor: "#374151",
    } as const);

  return (
    <div className="h-full min-w-0 overflow-hidden flex flex-col gap-1">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold leading-none truncate">
          {event.time_str}
        </span>
        <span
          className="text-[10px] font-semibold rounded px-1.5 py-0.5 leading-none shrink-0"
          style={{ backgroundColor: meta.badgeBg, color: meta.badgeColor }}
        >
          {meta.label}
        </span>
      </div>

      <div className="text-xs font-bold leading-tight truncate">
        {event.first_name} {event.last_name}
      </div>

      <div className="text-[11px] leading-tight truncate capitalize opacity-90">
        {event.service_type?.replace(/-/g, " ")}
      </div>

      {event.phone && (
        <div className="text-[10px] leading-tight truncate opacity-80">
          Tel: {event.phone}
        </div>
      )}

      {event.assigned_doctor_username && (
        <div className="text-[10px] leading-tight truncate font-semibold opacity-90">
          Dr. {event.assigned_doctor_username}
        </div>
      )}
    </div>
  );
}

export function BookingCalendar({
  onClose: _onClose,
  authToken,
  currentUserId,
  currentUserRole,
  canConfirmBooking = false,
  canCompleteBooking = false,
}: BookingCalendarProps) {
  const [events, setEvents] = useState<BookingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [availabilityConfig, setAvailabilityConfig] = useState(
    DEFAULT_AVAILABILITY_CONFIG,
  );
  const [selectedBooking, setSelectedBooking] = useState<BookingEvent | null>(
    null,
  );
  const [showDetails, setShowDetails] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showSameDayConflictDialog, setShowSameDayConflictDialog] =
    useState(false);
  const [sameDayConflictTimes, setSameDayConflictTimes] = useState("");
  const [showRescheduleForm, setShowRescheduleForm] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [createBookingForm, setCreateBookingForm] =
    useState<CreateBookingForm>(INITIAL_CREATE_FORM);
  const [creatingBooking, setCreatingBooking] = useState(false);
  const [doctorOptions, setDoctorOptions] = useState<DoctorOption[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const availableServices = SERVICE_CATALOG.filter((service) =>
    isServiceEnabled(availabilityConfig, service.id),
  );
  const availablePractitioners = (
    SERVICE_CATALOG.find(
      (service) => service.id === createBookingForm.serviceType,
    )?.practitioners || []
  ).filter((practitioner) =>
    isPractitionerEnabled(
      availabilityConfig,
      createBookingForm.serviceType,
      practitioner.id,
    ),
  );
  const createBookingDateObject = createBookingForm.date
    ? new Date(`${createBookingForm.date}T12:00:00`)
    : null;
  const createBookingAvailableSlots = createBookingDateObject
    ? getAvailableTimeSlots(availabilityConfig, createBookingDateObject)
    : [];
  const rescheduleDateObject = rescheduleDate
    ? new Date(`${rescheduleDate}T12:00:00`)
    : null;
  const rescheduleAvailableSlots = rescheduleDateObject
    ? getAvailableTimeSlots(availabilityConfig, rescheduleDateObject)
    : [];

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    const loadAvailability = async () => {
      setAvailabilityConfig(await fetchAvailabilityConfig());
    };

    loadAvailability();
  }, []);

  useEffect(() => {
    const fetchDoctors = async () => {
      if (!authToken) return;

      try {
        setLoadingDoctors(true);
        let lastResponse: Response | null = null;

        for (const baseUrl of supabaseAdminApiBaseUrls) {
          const response = await fetch(`${baseUrl}/doctors`, {
            headers: {
              Authorization: `Basic ${authToken}`,
            },
          });

          lastResponse = response;
          if (response.status !== 404) {
            break;
          }
        }

        if (!lastResponse || !lastResponse.ok) {
          return;
        }

        const data = await lastResponse.json();
        if (!data?.success || !Array.isArray(data?.doctors)) {
          return;
        }

        setDoctorOptions(
          data.doctors
            .filter((doctor: any) => Number.isInteger(Number(doctor?.id)))
            .map((doctor: any) => ({
              id: Number(doctor.id),
              username: String(doctor.username || "Doctor"),
            })),
        );
      } catch (error) {
        console.error("Failed to load doctors for calendar form:", error);
      } finally {
        setLoadingDoctors(false);
      }
    };

    void fetchDoctors();
  }, [authToken]);

  const fetchBookings = async () => {
    try {
      setLoading(true);

      let bookingsQuery = supabase
        .from("bookings")
        .select("*")
        .order("date", { ascending: true })
        .order("time", { ascending: true });

      if (
        String(currentUserRole || "").toLowerCase() === "doctor" &&
        typeof currentUserId === "number"
      ) {
        bookingsQuery = bookingsQuery.eq("assigned_doctor_id", currentUserId);
      }

      const { data: bookingsData, error } = await bookingsQuery;

      if (error) {
        console.error("Error fetching bookings:", error);
        toast.error("Failed to load bookings");
        return;
      }

      const calendarEvents: BookingEvent[] = (bookingsData || []).map(
        (booking) => {
          const bookingDate = new Date(booking.date);
          const [hours, minutes] = booking.time.split(":").map(Number);
          bookingDate.setHours(hours, minutes, 0, 0);

          const endTime = new Date(bookingDate);
          endTime.setMinutes(endTime.getMinutes() + 30);

          return {
            id: booking.id,
            title: `${booking.time} ${booking.first_name} ${booking.last_name}`,
            start: bookingDate,
            end: endTime,
            date_str: booking.date,
            time_str: booking.time,
            status: booking.status || "pending",
            service_type: booking.service_type,
            practitioner_type: booking.practitioner_type,
            first_name: booking.first_name,
            last_name: booking.last_name,
            phone: booking.phone,
            email: booking.email,
            reason: booking.reason,
            medical_aid: booking.medical_aid,
            medical_aid_number: booking.medical_aid_number,
            id_number: booking.id_number,
            created_at: booking.created_at,
            assigned_doctor_username: booking.assigned_doctor_username,
          };
        },
      );

      setEvents(calendarEvents);
    } catch (err) {
      console.error("Error:", err);
      toast.error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = (dateValue: string, timeValue: string) => {
    const bookingDate = new Date(`${dateValue}T12:00:00`);
    const allowedSlots = getAvailableTimeSlots(availabilityConfig, bookingDate);

    setCreateBookingForm({
      ...INITIAL_CREATE_FORM,
      date: dateValue,
      time: allowedSlots.includes(timeValue)
        ? timeValue
        : (allowedSlots[0] ?? ""),
      createdAt: toDateTimeLocalValue(new Date()),
    });
    setShowCreateDialog(true);
  };

  const handleSelectEvent = (event: BookingEvent) => {
    if (event.status === "cancelled") {
      openCreateDialog(getDatePart(event.date_str), event.time_str);
      return;
    }

    setSelectedBooking(event);
    setRescheduleDate(getDatePart(event.date_str));
    setRescheduleTime(event.time_str);
    setShowRescheduleForm(false);
    setShowDetails(true);
  };

  const handleSelectSlot = ({ start }: { start: Date }) => {
    const slotDate = toLocalDateString(start);
    const slotTime = format(start, "HH:mm");

    if (!isDateBookable(availabilityConfig, start)) {
      toast.error("This day is closed for bookings");
      return;
    }

    if (!isTimeWithinOperatingHours(availabilityConfig, start, slotTime)) {
      toast.error("Please select one of the 30-minute booking slots");
      return;
    }

    const activeBookingExists = events.some(
      (event) =>
        event.status !== "cancelled" &&
        getDatePart(event.date_str) === slotDate &&
        event.time_str === slotTime,
    );

    if (activeBookingExists) {
      toast.error("That slot already has an active booking");
      return;
    }

    openCreateDialog(slotDate, slotTime);
  };

  const handleCreateBookingChange = (
    field: keyof CreateBookingForm,
    value: string,
  ) => {
    if (field === "date") {
      const nextDateObject = value ? new Date(`${value}T12:00:00`) : null;
      const nextSlots = nextDateObject
        ? getAvailableTimeSlots(availabilityConfig, nextDateObject)
        : [];

      setCreateBookingForm((prev) => ({
        ...prev,
        date: value,
        time: nextSlots.includes(prev.time) ? prev.time : (nextSlots[0] ?? ""),
      }));
      return;
    }

    setCreateBookingForm((prev) => ({
      ...prev,
      [field]: value,
      ...(field === "serviceType" ? { practitionerType: "" } : {}),
    }));
  };

  const submitCreateBookingRequest = async (options?: {
    allowAdditionalSession?: boolean;
    cancelPreviousSameDay?: boolean;
  }) => {
    let lastResponse: Response | null = null;
    const requestBody = {
      serviceType: createBookingForm.serviceType,
      practitionerType: createBookingForm.practitionerType,
      date: `${createBookingForm.date}T09:00:00`,
      time: createBookingForm.time,
      reason: createBookingForm.reason || "",
      firstName: createBookingForm.firstName,
      lastName: createBookingForm.lastName,
      email: createBookingForm.email || "",
      phone: createBookingForm.phone,
      idNumber: createBookingForm.idNumber || "",
      medicalAid: createBookingForm.medicalAid || "",
      medicalAidNumber: createBookingForm.medicalAidNumber || "",
      source: "admin-calendar",
      createdAt: createBookingForm.createdAt
        ? new Date(createBookingForm.createdAt).toISOString()
        : undefined,
      assignedDoctorId: createBookingForm.assignedDoctorId
        ? Number(createBookingForm.assignedDoctorId)
        : undefined,
      allowAdditionalSession: options?.allowAdditionalSession,
      cancelPreviousSameDay: options?.cancelPreviousSameDay,
    };

    for (const baseUrl of supabaseAdminApiBaseUrls) {
      const response = await fetch(`${baseUrl}/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      lastResponse = response;
      if (response.status !== 404) {
        break;
      }
    }

    if (!lastResponse) {
      return {
        ok: false,
        data: { error: "No response from create booking endpoint" },
      };
    }

    const data = await lastResponse.json();
    return {
      ok: lastResponse.ok && data?.success,
      data,
      status: lastResponse.status,
    };
  };

  const handleSameDayConflictDecision = async (
    cancelPreviousSameDay: boolean,
  ) => {
    try {
      setCreatingBooking(true);
      setShowSameDayConflictDialog(false);

      const result = await submitCreateBookingRequest({
        cancelPreviousSameDay,
        allowAdditionalSession: !cancelPreviousSameDay,
      });

      if (!result.ok) {
        console.error("Error creating booking:", result.data);
        toast.error(result.data?.error || "Failed to create booking");
        return;
      }

      toast.success("Booking created for the selected slot");
      setShowCreateDialog(false);
      setCreateBookingForm(INITIAL_CREATE_FORM);
      setSameDayConflictTimes("");
      await fetchBookings();
    } catch (error) {
      console.error("Error creating booking:", error);
      toast.error("Failed to create booking");
    } finally {
      setCreatingBooking(false);
    }
  };

  const handleCreateBooking = async () => {
    if (
      !createBookingForm.firstName ||
      !createBookingForm.lastName ||
      !createBookingForm.phone ||
      !createBookingForm.serviceType ||
      !createBookingForm.practitionerType ||
      !createBookingForm.date ||
      !createBookingForm.time
    ) {
      toast.error("Please complete all required booking fields");
      return;
    }

    if (!isServiceEnabled(availabilityConfig, createBookingForm.serviceType)) {
      toast.error("That service is currently unavailable");
      return;
    }

    if (
      !isPractitionerEnabled(
        availabilityConfig,
        createBookingForm.serviceType,
        createBookingForm.practitionerType,
      )
    ) {
      toast.error("That practitioner is currently unavailable");
      return;
    }

    if (
      !createBookingDateObject ||
      !isDateBookable(availabilityConfig, createBookingDateObject)
    ) {
      toast.error("That day is closed for bookings");
      return;
    }

    if (
      !isTimeWithinOperatingHours(
        availabilityConfig,
        createBookingDateObject,
        createBookingForm.time,
      )
    ) {
      toast.error("That time is outside operating hours");
      return;
    }

    try {
      setCreatingBooking(true);

      let result = await submitCreateBookingRequest();

      if (!result.ok && result.status === 409) {
        if (result.data?.code === "CLIENT_ALREADY_BOOKED_SAME_SLOT") {
          toast.error(
            "This client already has a booking for this exact slot. Choose a different time.",
          );
          return;
        }

        if (result.data?.code === "CLIENT_HAS_OTHER_SLOT_SAME_DAY") {
          const existingTimes = Array.isArray(result.data?.existingBookings)
            ? result.data.existingBookings
                .map((booking: any) => booking?.time)
                .filter(Boolean)
                .join(", ")
            : "another slot";

          setSameDayConflictTimes(existingTimes);
          setShowSameDayConflictDialog(true);
          return;
        }
      }

      if (!result.ok) {
        console.error("Error creating booking:", result.data);
        toast.error(result.data?.error || "Failed to create booking");
        return;
      }

      toast.success("Booking created for the selected slot");
      setShowCreateDialog(false);
      setCreateBookingForm(INITIAL_CREATE_FORM);
      await fetchBookings();
    } catch (err) {
      console.error("Error creating booking:", err);
      toast.error("Failed to create booking");
    } finally {
      setCreatingBooking(false);
    }
  };

  const handleRescheduleSubmit = async () => {
    if (!selectedBooking || !rescheduleDate || !rescheduleTime) {
      toast.error("Please select both date and time");
      return;
    }

    const nextDate = new Date(`${rescheduleDate}T12:00:00`);

    if (!isDateBookable(availabilityConfig, nextDate)) {
      toast.error("That day is closed for bookings");
      return;
    }

    if (
      !isTimeWithinOperatingHours(availabilityConfig, nextDate, rescheduleTime)
    ) {
      toast.error("That time is outside operating hours");
      return;
    }

    try {
      const { error } = await supabase
        .from("bookings")
        .update({
          date: `${rescheduleDate}T09:00:00`,
          time: rescheduleTime,
          status: "pending",
        })
        .eq("id", selectedBooking.id);

      if (error) {
        toast.error("Failed to reschedule booking");
        return;
      }

      toast.success(
        "Booking rescheduled. Status reset to pending for re-confirmation.",
      );
      setShowRescheduleForm(false);
      setShowDetails(false);
      setSelectedBooking(null);
      fetchBookings();
    } catch (err) {
      console.error("Error:", err);
      toast.error("Failed to reschedule booking");
    }
  };

  const handleConfirmBooking = async () => {
    if (!selectedBooking) return;

    if (!canConfirmBooking) {
      toast.error("You do not have permission to confirm bookings");
      return;
    }

    try {
      if (!authToken) {
        toast.error("Missing authentication token");
        return;
      }

      let lastResponse: Response | null = null;
      for (const baseUrl of supabaseAdminApiBaseUrls) {
        const response = await fetch(
          `${baseUrl}/bookings/${selectedBooking.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Basic ${authToken}`,
            },
            body: JSON.stringify({ status: "confirmed" }),
          },
        );

        lastResponse = response;
        if (response.status !== 404) {
          break;
        }
      }

      if (!lastResponse) {
        toast.error("Failed to confirm booking");
        return;
      }

      const data = await lastResponse.json();
      if (!lastResponse.ok || !data.success) {
        toast.error(data.error || "Failed to confirm booking");
        return;
      }

      toast.success("Booking confirmed");
      setShowDetails(false);
      setSelectedBooking(null);
      fetchBookings();
    } catch (err) {
      console.error("Error:", err);
      toast.error("Failed to confirm booking");
    }
  };

  const handleCompleteBooking = async () => {
    if (!selectedBooking) return;

    if (!canCompleteBooking) {
      toast.error("You do not have permission to complete bookings");
      return;
    }

    try {
      if (!authToken) {
        toast.error("Missing authentication token");
        return;
      }

      let lastResponse: Response | null = null;
      for (const baseUrl of supabaseAdminApiBaseUrls) {
        const response = await fetch(
          `${baseUrl}/bookings/${selectedBooking.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Basic ${authToken}`,
            },
            body: JSON.stringify({ status: "completed" }),
          },
        );

        lastResponse = response;
        if (response.status !== 404) {
          break;
        }
      }

      if (!lastResponse) {
        toast.error("Failed to complete booking");
        return;
      }

      const data = await lastResponse.json();
      if (!lastResponse.ok || !data.success) {
        toast.error(data.error || "Failed to complete booking");
        return;
      }

      toast.success("Booking marked as completed");
      setShowDetails(false);
      setSelectedBooking(null);
      fetchBookings();
    } catch (err) {
      console.error("Error:", err);
      toast.error("Failed to complete booking");
    }
  };

  const handleUnconfirmBooking = async () => {
    if (!selectedBooking) return;

    if (!canConfirmBooking) {
      toast.error("You do not have permission to unconfirm bookings");
      return;
    }

    const confirmed = window.confirm(
      `Unconfirm booking for ${selectedBooking.first_name} ${selectedBooking.last_name}? This will move it back to pending and clear the assigned doctor.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      if (!authToken) {
        toast.error("Missing authentication token");
        return;
      }

      let lastResponse: Response | null = null;
      for (const baseUrl of supabaseAdminApiBaseUrls) {
        const response = await fetch(
          `${baseUrl}/bookings/${selectedBooking.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Basic ${authToken}`,
            },
            body: JSON.stringify({ status: "pending" }),
          },
        );

        lastResponse = response;
        if (response.status !== 404) {
          break;
        }
      }

      if (!lastResponse) {
        toast.error("Failed to unconfirm booking");
        return;
      }

      const data = await lastResponse.json();
      if (!lastResponse.ok || !data.success) {
        toast.error(data.error || "Failed to unconfirm booking");
        return;
      }

      toast.success("Booking moved back to pending");
      setShowDetails(false);
      setSelectedBooking(null);
      fetchBookings();
    } catch (err) {
      console.error("Error:", err);
      toast.error("Failed to unconfirm booking");
    }
  };

  const eventStyleGetter = (event: BookingEvent) => {
    if (event.status === "confirmed") {
      return {
        style: {
          backgroundColor: "#ecfdf5",
          borderRadius: "8px",
          color: "#111827",
          border: "1px solid #a7f3d0",
          borderLeft: "4px solid #10b981",
          fontWeight: 600,
          padding: "6px 7px",
          boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
        },
      };
    }

    if (event.status === "pending") {
      return {
        style: {
          backgroundColor: "#fffbeb",
          borderRadius: "8px",
          color: "#111827",
          border: "1px solid #fcd34d",
          borderLeft: "4px solid #f59e0b",
          fontWeight: 600,
          padding: "6px 7px",
          boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
        },
      };
    }

    if (event.status === "completed") {
      return {
        style: {
          backgroundColor: "#eef2ff",
          borderRadius: "8px",
          color: "#111827",
          border: "1px solid #c7d2fe",
          borderLeft: "4px solid #6366f1",
          fontWeight: 600,
          padding: "6px 7px",
          boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
        },
      };
    }

    return {
      style: {
        backgroundColor: "#fff1f2",
        borderRadius: "8px",
        color: "#be123c",
        border: "1px solid #fecdd3",
        borderLeft: "4px solid #fb7185",
        fontWeight: 600,
        padding: "6px 7px",
        opacity: 0.98,
        boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
      },
    };
  };

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const enabledHours = Object.values(availabilityConfig.operatingHours).filter(
    (day) => day.enabled,
  );
  const earliestOpen =
    enabledHours
      .map((day) => day.start)
      .sort((left, right) => left.localeCompare(right))[0] || "08:30";
  const latestClose =
    enabledHours
      .map((day) => day.end)
      .sort((left, right) => right.localeCompare(left))[0] || "16:30";
  const calendarMinTime = combineDateAndTime(
    toLocalDateString(weekStart),
    earliestOpen,
  );
  const calendarMaxTime = combineDateAndTime(
    toLocalDateString(weekStart),
    latestClose,
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#9A7B1D] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
            Weekly Calendar
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            One week per screen. Click an empty slot or cancelled booking to add
            a new booking.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setCurrentDate(
                new Date(
                  currentDate.getFullYear(),
                  currentDate.getMonth(),
                  currentDate.getDate() - 7,
                ),
              )
            }
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Prev Week
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(new Date())}
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setCurrentDate(
                new Date(
                  currentDate.getFullYear(),
                  currentDate.getMonth(),
                  currentDate.getDate() + 7,
                ),
              )
            }
          >
            Next Week
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
          <Button
            size="sm"
            className="bg-[#9A7B1D] hover:bg-[#7d6418]"
            onClick={() =>
              openCreateDialog(
                toLocalDateString(new Date()),
                getAvailableTimeSlots(availabilityConfig, new Date())[0] || "",
              )
            }
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Booking
          </Button>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm font-medium text-gray-900">
          {getWeekRangeLabel(currentDate)}
        </div>
        <div className="flex flex-wrap gap-3 text-xs sm:text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-500"></div>
            <span>Confirmed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-amber-500"></div>
            <span>Pending</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-indigo-500"></div>
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded border border-dashed border-rose-400 bg-rose-50"></div>
            <span>Cancelled slot available</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <div className="min-w-[980px] h-[780px] [&_.rbc-time-view]:border-0 [&_.rbc-time-header-content]:border-l-0 [&_.rbc-time-content]:border-t [&_.rbc-timeslot-group]:min-h-[96px] [&_.rbc-toolbar]:hidden [&_.rbc-event]:shadow-none [&_.rbc-event]:min-h-[84px] [&_.rbc-event-label]:hidden [&_.rbc-event-content]:h-full [&_.rbc-event-content]:overflow-hidden [&_.rbc-time-slot]:text-xs [&_.rbc-header]:py-3 [&_.rbc-header]:text-sm [&_.rbc-header]:font-semibold [&_.rbc-today]:bg-[#faf7ef] [&_.rbc-current-time-indicator]:bg-[#9A7B1D]">
          <BigCalendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            defaultView="week"
            view="week"
            views={["week"]}
            date={currentDate}
            onNavigate={setCurrentDate}
            style={{ height: "100%" }}
            selectable
            step={30}
            timeslots={1}
            min={calendarMinTime}
            max={calendarMaxTime}
            onSelectSlot={handleSelectSlot}
            onSelectEvent={(event) => handleSelectEvent(event as BookingEvent)}
            eventPropGetter={(event) => eventStyleGetter(event as BookingEvent)}
            components={{
              event: ({ event }) => (
                <CalendarEventContent event={event as BookingEvent} />
              ),
            }}
            dayLayoutAlgorithm="no-overlap"
            popup={false}
          />
        </div>
      </div>

      <Dialog
        open={showCreateDialog}
        onOpenChange={(open) => {
          setShowCreateDialog(open);
          if (!open) {
            setCreateBookingForm(INITIAL_CREATE_FORM);
            setShowSameDayConflictDialog(false);
            setSameDayConflictTimes("");
          }
        }}
      >
        <DialogContent className="w-[calc(100vw-1rem)] sm:w-[92vw] max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Booking</DialogTitle>
            <DialogDescription>
              Add a booking for {createBookingForm.date || "the selected date"}{" "}
              at {createBookingForm.time || "the selected time"}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={createBookingForm.date}
                  onChange={(e) =>
                    handleCreateBookingChange("date", e.target.value)
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#9A7B1D]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time
                </label>
                <select
                  value={createBookingForm.time}
                  onChange={(e) =>
                    handleCreateBookingChange("time", e.target.value)
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#9A7B1D]"
                >
                  <option value="">Select time</option>
                  {createBookingAvailableSlots.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
                {createBookingDateObject &&
                  createBookingAvailableSlots.length === 0 && (
                    <p className="mt-2 text-xs text-amber-700">
                      This date is closed for bookings. Choose another date.
                    </p>
                  )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Booking Created At
                </label>
                <input
                  type="datetime-local"
                  value={createBookingForm.createdAt}
                  onChange={(e) =>
                    handleCreateBookingChange("createdAt", e.target.value)
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#9A7B1D]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assigned Doctor
                </label>
                <select
                  value={createBookingForm.assignedDoctorId}
                  onChange={(e) =>
                    handleCreateBookingChange(
                      "assignedDoctorId",
                      e.target.value,
                    )
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#9A7B1D]"
                >
                  <option value="">Not assigned</option>
                  {doctorOptions.map((doctor) => (
                    <option key={doctor.id} value={String(doctor.id)}>
                      Dr. {doctor.username}
                    </option>
                  ))}
                </select>
                {loadingDoctors && (
                  <p className="mt-2 text-xs text-gray-500">
                    Loading doctors...
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  value={createBookingForm.firstName}
                  onChange={(e) =>
                    handleCreateBookingChange("firstName", e.target.value)
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#9A7B1D]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  value={createBookingForm.lastName}
                  onChange={(e) =>
                    handleCreateBookingChange("lastName", e.target.value)
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#9A7B1D]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone *
                </label>
                <input
                  type="text"
                  value={createBookingForm.phone}
                  onChange={(e) =>
                    handleCreateBookingChange("phone", e.target.value)
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#9A7B1D]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={createBookingForm.email}
                  onChange={(e) =>
                    handleCreateBookingChange("email", e.target.value)
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#9A7B1D]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service *
                </label>
                <select
                  value={createBookingForm.serviceType}
                  onChange={(e) =>
                    handleCreateBookingChange("serviceType", e.target.value)
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#9A7B1D]"
                >
                  <option value="">Select service</option>
                  {availableServices.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Practitioner *
                </label>
                <select
                  value={createBookingForm.practitionerType}
                  onChange={(e) =>
                    handleCreateBookingChange(
                      "practitionerType",
                      e.target.value,
                    )
                  }
                  disabled={!createBookingForm.serviceType}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#9A7B1D] disabled:bg-gray-100"
                >
                  <option value="">Select practitioner</option>
                  {availablePractitioners.map((practitioner) => (
                    <option key={practitioner.id} value={practitioner.id}>
                      {practitioner.title}
                    </option>
                  ))}
                </select>
                {createBookingForm.serviceType &&
                  availablePractitioners.length === 0 && (
                    <p className="mt-2 text-xs text-amber-700">
                      No practitioners are currently enabled for this service.
                    </p>
                  )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ID Number
                </label>
                <input
                  type="text"
                  value={createBookingForm.idNumber}
                  onChange={(e) =>
                    handleCreateBookingChange("idNumber", e.target.value)
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#9A7B1D]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Medical Aid
                </label>
                <input
                  type="text"
                  value={createBookingForm.medicalAid}
                  onChange={(e) =>
                    handleCreateBookingChange("medicalAid", e.target.value)
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#9A7B1D]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Medical Aid Number
                </label>
                <input
                  type="text"
                  value={createBookingForm.medicalAidNumber}
                  onChange={(e) =>
                    handleCreateBookingChange(
                      "medicalAidNumber",
                      e.target.value,
                    )
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#9A7B1D]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason
                </label>
                <input
                  type="text"
                  value={createBookingForm.reason}
                  onChange={(e) =>
                    handleCreateBookingChange("reason", e.target.value)
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#9A7B1D]"
                />
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateBooking}
                disabled={creatingBooking}
                className="bg-[#9A7B1D] hover:bg-[#7d6418]"
              >
                {creatingBooking ? "Creating..." : "Create Booking"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showSameDayConflictDialog}
        onOpenChange={(open) => {
          setShowSameDayConflictDialog(open);
          if (!open) {
            setSameDayConflictTimes("");
          }
        }}
      >
        <DialogContent className="w-[calc(100vw-1rem)] sm:w-[92vw] max-w-lg">
          <DialogHeader>
            <DialogTitle>Existing Same-Day Booking Found</DialogTitle>
            <DialogDescription>
              This client already has booking(s) on {createBookingForm.date} at{" "}
              {sameDayConflictTimes || "another slot"}.
            </DialogDescription>
          </DialogHeader>

          <p className="text-sm text-gray-600">
            Choose whether to cancel the previous same-day booking(s) and
            replace them with this slot, or keep both sessions for the day.
          </p>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowSameDayConflictDialog(false);
                setSameDayConflictTimes("");
              }}
            >
              Back to Form
            </Button>
            <Button
              variant="outline"
              onClick={() => void handleSameDayConflictDecision(false)}
              disabled={creatingBooking}
            >
              Keep Both Sessions
            </Button>
            <Button
              onClick={() => void handleSameDayConflictDecision(true)}
              disabled={creatingBooking}
              className="bg-[#9A7B1D] hover:bg-[#7d6418]"
            >
              Cancel Previous and Replace
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showDetails}
        onOpenChange={(open) => {
          setShowDetails(open);
          if (!open) setShowRescheduleForm(false);
        }}
      >
        <DialogContent className="w-[calc(100vw-1rem)] sm:w-[92vw] max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
            <DialogDescription>
              {selectedBooking &&
                `${selectedBooking.first_name} ${selectedBooking.last_name}`}
            </DialogDescription>
          </DialogHeader>

          {selectedBooking && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Status</p>
                  <Badge
                    className={
                      selectedBooking.status === "confirmed"
                        ? "bg-green-100 text-green-800"
                        : selectedBooking.status === "pending"
                          ? "bg-amber-100 text-amber-800"
                          : selectedBooking.status === "completed"
                            ? "bg-indigo-100 text-indigo-800"
                            : "bg-red-100 text-red-800"
                    }
                  >
                    {selectedBooking.status.charAt(0).toUpperCase() +
                      selectedBooking.status.slice(1)}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Service</p>
                  <p className="text-sm mt-1">
                    {selectedBooking.service_type?.replace(/-/g, " ")}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Date</p>
                  <p className="text-sm mt-1">
                    {format(selectedBooking.start, "PPP")}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Time</p>
                  <p className="text-sm mt-1">
                    {format(selectedBooking.start, "p")}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-600">
                  Practitioner
                </p>
                <p className="text-sm mt-1">
                  {selectedBooking.practitioner_type?.replace(/-/g, " ")}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-600">Created</p>
                <p className="text-sm mt-1">
                  {selectedBooking.created_at
                    ? format(new Date(selectedBooking.created_at), "PPP p")
                    : "Unknown"}
                </p>
              </div>

              {selectedBooking.assigned_doctor_username && (
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Assigned Doctor
                  </p>
                  <p className="text-sm mt-1 text-blue-700 font-medium">
                    Dr. {selectedBooking.assigned_doctor_username}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Phone</p>
                  <p className="text-sm mt-1 truncate">
                    {selectedBooking.phone}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Email</p>
                  <p className="text-sm mt-1 truncate">
                    {selectedBooking.email || "N/A"}
                  </p>
                </div>
              </div>

              {selectedBooking.reason && (
                <div>
                  <p className="text-sm font-medium text-gray-600">Reason</p>
                  <p className="text-sm mt-1">{selectedBooking.reason}</p>
                </div>
              )}

              <div className="flex flex-col gap-2 pt-4">
                <div className="flex gap-2">
                  {selectedBooking.status === "pending" &&
                    canConfirmBooking && (
                      <Button
                        onClick={handleConfirmBooking}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-xs sm:text-sm"
                      >
                        <Check className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                        Confirm
                      </Button>
                    )}
                  {selectedBooking.status === "confirmed" &&
                    canCompleteBooking && (
                      <Button
                        onClick={handleCompleteBooking}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-xs sm:text-sm"
                      >
                        <Check className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                        Mark Complete
                      </Button>
                    )}
                  {selectedBooking.status === "confirmed" &&
                    canConfirmBooking && (
                      <Button
                        variant="outline"
                        onClick={handleUnconfirmBooking}
                        className="flex-1 text-amber-700 border-amber-600 hover:bg-amber-50 text-xs sm:text-sm"
                      >
                        Unconfirm
                      </Button>
                    )}
                  {(selectedBooking.status === "pending" ||
                    selectedBooking.status === "confirmed") && (
                    <Button
                      variant="outline"
                      className="flex-1 text-[#9A7B1D] border-[#9A7B1D] hover:bg-[#F5F1E8] text-xs sm:text-sm"
                      onClick={() => setShowRescheduleForm((prev) => !prev)}
                    >
                      <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      Reschedule
                    </Button>
                  )}
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setShowDetails(false);
                    setShowRescheduleForm(false);
                  }}
                >
                  Close
                </Button>
              </div>

              {showRescheduleForm && (
                <div className="pt-4 border-t border-gray-200 space-y-3">
                  <p className="text-sm font-semibold text-gray-800">
                    New Appointment Details
                  </p>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      New Date
                    </label>
                    <input
                      type="date"
                      value={rescheduleDate}
                      onChange={(e) => setRescheduleDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#9A7B1D]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      New Time
                    </label>
                    <select
                      value={rescheduleTime}
                      onChange={(e) => setRescheduleTime(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#9A7B1D]"
                    >
                      <option value="">Select time</option>
                      {rescheduleAvailableSlots.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                    {rescheduleDateObject &&
                      rescheduleAvailableSlots.length === 0 && (
                        <p className="mt-2 text-xs text-amber-700">
                          This date is closed for bookings. Choose another date.
                        </p>
                      )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleRescheduleSubmit}
                      size="sm"
                      className="flex-1 bg-[#9A7B1D] hover:bg-[#7d6418] text-white"
                    >
                      Confirm Reschedule
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowRescheduleForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
