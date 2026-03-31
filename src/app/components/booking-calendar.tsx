import { useState, useEffect } from "react";
import {
  Calendar as BigCalendar,
  dateFnsLocalizer,
  Event,
} from "react-big-calendar";
import {
  format,
  parse,
  startOfWeek,
  getDay,
  addHours,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
} from "date-fns";
import { enUS } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { supabase } from "../../../utils/supabase/client";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Check, X, Clock, RefreshCw } from "lucide-react";
import { toast } from "sonner";

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
}

const CALENDAR_TIME_SLOTS = [
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

interface BookingCalendarProps {
  onClose?: () => void;
}

export function BookingCalendar({ onClose }: BookingCalendarProps) {
  const [events, setEvents] = useState<BookingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<BookingEvent | null>(
    null,
  );
  const [showDetails, setShowDetails] = useState(false);
  const [view, setView] = useState<"month" | "week" | "day">("month");
  const [showRescheduleForm, setShowRescheduleForm] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);

      // Fetch all non-cancelled bookings
      const { data: bookingsData, error } = await supabase
        .from("bookings")
        .select("*")
        .neq("status", "cancelled")
        .order("date", { ascending: true });

      if (error) {
        console.error("Error fetching bookings:", error);
        toast.error("Failed to load bookings");
        return;
      }

      // Transform bookings to calendar events
      const calendarEvents: BookingEvent[] = (bookingsData || []).map(
        (booking) => {
          // Parse date and time
          const bookingDate = new Date(booking.date);
          const [hours, minutes] = booking.time.split(":").map(Number);
          bookingDate.setHours(hours, minutes, 0, 0);

          // Create end time (30 minute appointment)
          const endTime = new Date(bookingDate);
          endTime.setMinutes(endTime.getMinutes() + 30);

          return {
            id: booking.id,
            title: `${booking.first_name} ${booking.last_name} - ${booking.service_type?.replace("-", " ")}`,
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

  const handleSelectEvent = (event: BookingEvent) => {
    setSelectedBooking(event);
    setShowRescheduleForm(false);
    setShowDetails(true);
  };

  const handleRescheduleSubmit = async () => {
    if (!selectedBooking || !rescheduleDate || !rescheduleTime) {
      toast.error("Please select both date and time");
      return;
    }

    try {
      const { error } = await supabase
        .from("bookings")
        .update({
          date: rescheduleDate,
          time: rescheduleTime,
          status: "pending",
        })
        .eq("id", selectedBooking.id);

      if (error) {
        toast.error("Failed to reschedule booking");
        return;
      }

      toast.success(
        "Booking rescheduled! Status reset to pending for re-confirmation.",
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

    try {
      const { error } = await supabase
        .from("bookings")
        .update({ status: "confirmed" })
        .eq("id", selectedBooking.id);

      if (error) {
        toast.error("Failed to confirm booking");
        return;
      }

      toast.success("Booking confirmed!");
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

    try {
      const { error } = await supabase
        .from("bookings")
        .update({ status: "completed" })
        .eq("id", selectedBooking.id);

      if (error) {
        toast.error("Failed to complete booking");
        return;
      }

      toast.success("Booking marked as completed!");
      setShowDetails(false);
      setSelectedBooking(null);
      fetchBookings();
    } catch (err) {
      console.error("Error:", err);
      toast.error("Failed to complete booking");
    }
  };

  // Custom event style getter
  const eventStyleGetter = (event: BookingEvent) => {
    let backgroundColor = "";
    let borderColor = "";

    if (event.status === "confirmed") {
      backgroundColor = "#10b981"; // Green
      borderColor = "#059669";
    } else if (event.status === "pending") {
      backgroundColor = "#f59e0b"; // Amber
      borderColor = "#d97706";
    } else if (event.status === "completed") {
      backgroundColor = "#6366f1"; // Indigo
      borderColor = "#4f46e5";
    } else if (event.status === "cancelled") {
      backgroundColor = "#ef4444"; // Red
      borderColor = "#dc2626";
    }

    return {
      style: {
        backgroundColor,
        borderRadius: "6px",
        opacity: 1,
        color: "white",
        border: `2px solid ${borderColor}`,
        display: "block",
        fontWeight: 500,
      },
    };
  };

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
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Bookings Calendar
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            View and manage all bookings in calendar format
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={view === "month" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("month")}
            className={view === "month" ? "bg-[#9A7B1D]" : ""}
          >
            Month
          </Button>
          <Button
            variant={view === "week" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("week")}
            className={view === "week" ? "bg-[#9A7B1D]" : ""}
          >
            Week
          </Button>
          <Button
            variant={view === "day" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("day")}
            className={view === "day" ? "bg-[#9A7B1D]" : ""}
          >
            Day
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="mb-4 bg-gray-50 p-4 rounded-lg flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span className="text-sm font-medium text-gray-700">Confirmed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-amber-500 rounded"></div>
          <span className="text-sm font-medium text-gray-700">Pending</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-indigo-500 rounded"></div>
          <span className="text-sm font-medium text-gray-700">Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span className="text-sm font-medium text-gray-700">Cancelled</span>
        </div>
      </div>

      {/* Calendar */}
      <div className="flex-1 bg-white rounded-lg border border-gray-200 overflow-hidden">
        <BigCalendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: "100%" }}
          onSelectEvent={handleSelectEvent}
          eventPropGetter={eventStyleGetter}
          view={view}
          onView={() => {}}
          views={["month", "week", "day"]}
          popup
          selectable
          defaultDate={new Date()}
        />
      </div>

      {/* Booking Details Dialog */}
      <Dialog
        open={showDetails}
        onOpenChange={(open) => {
          setShowDetails(open);
          if (!open) setShowRescheduleForm(false);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
            <DialogDescription>
              {selectedBooking &&
                `${selectedBooking.first_name} ${selectedBooking.last_name}`}
            </DialogDescription>
          </DialogHeader>

          {selectedBooking && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
                    {selectedBooking.service_type?.replace("-", " ")}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                  {selectedBooking.practitioner_type?.replace("-", " ")}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Phone</p>
                  <p className="text-sm mt-1">{selectedBooking.phone}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Email</p>
                  <p className="text-sm mt-1">
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

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4">
                {selectedBooking.status === "pending" && (
                  <Button
                    onClick={handleConfirmBooking}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Confirm
                  </Button>
                )}
                {selectedBooking.status === "confirmed" && (
                  <Button
                    onClick={handleCompleteBooking}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Mark Complete
                  </Button>
                )}
                {(selectedBooking.status === "pending" ||
                  selectedBooking.status === "confirmed") && (
                  <Button
                    variant="outline"
                    className="flex-1 text-[#9A7B1D] border-[#9A7B1D] hover:bg-[#F5F1E8]"
                    onClick={() => {
                      setRescheduleDate(selectedBooking.date_str);
                      setRescheduleTime(selectedBooking.time_str);
                      setShowRescheduleForm((prev) => !prev);
                    }}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reschedule
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowDetails(false);
                    setShowRescheduleForm(false);
                  }}
                >
                  Close
                </Button>
              </div>

              {/* Inline Reschedule Form */}
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
                      {CALENDAR_TIME_SLOTS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
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
