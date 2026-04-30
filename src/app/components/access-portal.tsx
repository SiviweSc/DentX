import React, { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import {
  ArrowLeft,
  CheckCircle,
  FileText,
  Lock,
  Search,
  User,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  supabaseAdminApiBaseUrls,
  supabase,
} from "../../../utils/supabase/client";
import {
  DEFAULT_AVAILABILITY_CONFIG,
  fetchAvailabilityConfig,
  getAvailableTimeSlots,
  isPractitionerEnabled,
  isDateBookable,
  isServiceEnabled,
  SERVICE_CATALOG,
  isTimeWithinOperatingHours,
} from "../lib/availability";
import logo from "../../assets/cadae8615ee9587c8f09fa141332814475e43e29.png";
import MedicalIntakeForm, {
  type MedicalIntakeData,
} from "./medical-intake-form";
import { Button } from "./ui/button";
import { Calendar } from "./ui/calendar";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  normalizeUserRole,
  sanitizeRolePermissions,
  type RolePermissions,
  type UserRole,
} from "../lib/roles";

type PortalScreen =
  | "select-role"
  | "admin-login"
  | "walkin-type"
  | "online-checkin"
  | "medical-form-search"
  | "medical-intake"
  | "returning-search"
  | "returning-service"
  | "returning-slot"
  | "new-details"
  | "new-service"
  | "new-slot"
  | "confirm-booking";

type WalkInSource = "walk-in-existing" | "walk-in-new";
type MedicalFormOrigin =
  | "select-role"
  | "walkin-type"
  | "returning-search"
  | "new-details";
type MedicalIntakeOrigin = "online-checkin" | "medical-form-search";

interface AccessPortalProps {
  onClose: () => void;
  onLoginSuccess: (session: {
    id: number;
    token: string;
    username: string;
    role: UserRole;
    roleLabel?: string;
    permissions?: Partial<RolePermissions>;
  }) => void;
}

interface PatientSearchResult {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  email: string | null;
  id_number: string | null;
  medical_aid: string | null;
  medical_aid_number: string | null;
}

interface WalkInDetails {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  idNumber: string;
  medicalAid: string;
  medicalAidNumber: string;
}

interface MedicalIntakeContextData {
  bookingId: string;
  patientName: string;
  initialData: Partial<MedicalIntakeData>;
  previousForm?: any;
}

const EMPTY_WALKIN_DETAILS: WalkInDetails = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  idNumber: "",
  medicalAid: "",
  medicalAidNumber: "",
};

const getNormalizedToday = () => {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  return today;
};

class AccessPortalErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; errorMessage: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error("Access portal crashed:", error);
    this.setState({
      errorMessage: error?.message || "Unknown access portal error",
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="max-w-md w-full rounded-xl border border-gray-200 bg-white p-6 text-center">
            <h2 className="text-xl text-gray-900">Something went wrong</h2>
            <p className="text-sm text-gray-500 mt-2">
              The access portal hit an unexpected error. Please reload and try
              again.
            </p>
            {this.state.errorMessage && (
              <p className="text-xs text-red-600 mt-2 break-words">
                {this.state.errorMessage}
              </p>
            )}
            <Button
              onClick={() => window.location.reload()}
              className="mt-4 bg-[#9A7B1D] hover:bg-[#7d6418]"
            >
              Reload page
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function AccessPortalContent({ onClose, onLoginSuccess }: AccessPortalProps) {
  const [screen, setScreen] = useState<PortalScreen>("select-role");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [checkinPhone, setCheckinPhone] = useState("");
  const [checkinId, setCheckinId] = useState("");
  const [checkinLoading, setCheckinLoading] = useState(false);
  const [formLookupQuery, setFormLookupQuery] = useState("");
  const [formLookupLoading, setFormLookupLoading] = useState(false);
  const [medicalFormOrigin, setMedicalFormOrigin] =
    useState<MedicalFormOrigin>("walkin-type");
  const [medicalIntakeOrigin, setMedicalIntakeOrigin] =
    useState<MedicalIntakeOrigin>("medical-form-search");
  const [medicalIntakeContext, setMedicalIntakeContext] =
    useState<MedicalIntakeContextData | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<PatientSearchResult[]>([]);
  const [selectedPatient, setSelectedPatient] =
    useState<PatientSearchResult | null>(null);

  const [newWalkInDetails, setNewWalkInDetails] =
    useState<WalkInDetails>(EMPTY_WALKIN_DETAILS);
  const [walkInServiceType, setWalkInServiceType] = useState("");
  const [walkInPractitionerType, setWalkInPractitionerType] = useState("");
  const [pendingBookingSource, setPendingBookingSource] =
    useState<WalkInSource | null>(null);

  const [availabilityConfig, setAvailabilityConfig] = useState(
    DEFAULT_AVAILABILITY_CONFIG,
  );
  const [availabilityLoading, setAvailabilityLoading] = useState(true);
  const [slotDate, setSlotDate] = useState<Date | undefined>(
    getNormalizedToday(),
  );
  const [slotTime, setSlotTime] = useState("");
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [savingBooking, setSavingBooking] = useState(false);

  const isValidAvailabilityConfig = (
    value: unknown,
  ): value is typeof DEFAULT_AVAILABILITY_CONFIG => {
    return !!value && typeof value === "object" && "services" in (value as any);
  };

  const safeAvailabilityConfig = isValidAvailabilityConfig(availabilityConfig)
    ? availabilityConfig
    : DEFAULT_AVAILABILITY_CONFIG;

  const resetSlotSelection = () => {
    setSlotDate(getNormalizedToday());
    setSlotTime("");
    setBookedSlots([]);
  };

  const resetWalkInSelection = () => {
    setWalkInServiceType("");
    setWalkInPractitionerType("");
    setPendingBookingSource(null);
    resetSlotSelection();
  };

  useEffect(() => {
    const loadAvailability = async () => {
      setAvailabilityLoading(true);
      try {
        const config = await fetchAvailabilityConfig();
        setAvailabilityConfig(
          isValidAvailabilityConfig(config)
            ? config
            : DEFAULT_AVAILABILITY_CONFIG,
        );
      } catch (error) {
        console.error("Failed to load availability config:", error);
        setAvailabilityConfig(DEFAULT_AVAILABILITY_CONFIG);
      }
      setAvailabilityLoading(false);
    };

    void loadAvailability();
  }, []);

  useEffect(() => {
    if (screen !== "returning-search") return;

    const query = searchTerm.trim();
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      try {
        setSearching(true);
        const normalizedQuery = query
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, " ")
          .trim();
        const searchTokens = normalizedQuery.split(/\s+/).filter(Boolean);
        const firstToken = searchTokens[0] || normalizedQuery;
        const lastToken =
          searchTokens.length > 1
            ? searchTokens[searchTokens.length - 1]
            : firstToken;

        const { data, error } = await supabase
          .from("patients")
          .select(
            "id, first_name, last_name, phone, email, id_number, medical_aid, medical_aid_number",
          )
          .or(
            `first_name.ilike.%${firstToken}%,last_name.ilike.%${firstToken}%,first_name.ilike.%${lastToken}%,last_name.ilike.%${lastToken}%,phone.ilike.%${query}%`,
          )
          .order("first_name", { ascending: true })
          .limit(60);

        if (error) {
          console.error("Patient search failed:", error);
          toast.error("Could not search patients");
          setSearchResults([]);
          return;
        }

        const rankedResults = ((data as PatientSearchResult[]) || [])
          .map((patient) => {
            const fullName =
              `${patient.first_name || ""} ${patient.last_name || ""}`
                .toLowerCase()
                .replace(/[^a-z0-9\s]/g, " ")
                .trim();
            const compactName = fullName.replace(/\s+/g, " ");
            const startsWithBonus = compactName.startsWith(normalizedQuery)
              ? 100
              : 0;
            const includesBonus = compactName.includes(normalizedQuery)
              ? 50
              : 0;
            const tokenScore = searchTokens.reduce((score, token) => {
              if (compactName.startsWith(token)) return score + 20;
              if (compactName.includes(token)) return score + 10;
              return score;
            }, 0);

            return {
              patient,
              score: startsWithBonus + includesBonus + tokenScore,
            };
          })
          .filter((result) => result.score > 0)
          .sort((left, right) => right.score - left.score)
          .map((result) => result.patient)
          .slice(0, 20);

        setSearchResults(rankedResults);
      } catch (error) {
        console.error("Patient search failed:", error);
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [searchTerm, screen]);

  useEffect(() => {
    if ((screen === "returning-slot" || screen === "new-slot") && !slotDate) {
      setSlotDate(getNormalizedToday());
    }
  }, [screen, slotDate]);

  useEffect(() => {
    if (!slotDate) return;

    const fetchBookedSlots = async () => {
      try {
        const response = await apiFetchPublic(
          `/booked-slots/${toLocalDateString(slotDate)}`,
        );
        if (!response) {
          setBookedSlots([]);
          return;
        }

        const data = await parseApiResponse(response, "Booked slots endpoint");
        setBookedSlots(Array.isArray(data.bookedSlots) ? data.bookedSlots : []);
      } catch (error) {
        console.error("Could not fetch booked slots:", error);
        setBookedSlots([]);
      }
    };

    void fetchBookedSlots();
  }, [slotDate]);

  const availableTimes = useMemo(
    () =>
      slotDate ? getAvailableTimeSlots(safeAvailabilityConfig, slotDate) : [],
    [safeAvailabilityConfig, slotDate],
  );

  const openTimes = useMemo(
    () =>
      availableTimes.filter(
        (time) =>
          !bookedSlots.includes(time) &&
          !isPastTimeSlot(time, slotDate) &&
          !!slotDate &&
          isTimeWithinOperatingHours(safeAvailabilityConfig, slotDate, time),
      ),
    [safeAvailabilityConfig, availableTimes, bookedSlots, slotDate],
  );

  const availableWalkInServices = useMemo(
    () =>
      SERVICE_CATALOG.filter((service) =>
        isServiceEnabled(safeAvailabilityConfig, service.id),
      ),
    [safeAvailabilityConfig],
  );

  const availableWalkInPractitioners = useMemo(() => {
    const selectedService = SERVICE_CATALOG.find(
      (service) => service.id === walkInServiceType,
    );

    if (!selectedService) {
      return [];
    }

    return selectedService.practitioners.filter((practitioner) =>
      isPractitionerEnabled(
        safeAvailabilityConfig,
        selectedService.id,
        practitioner.id,
      ),
    );
  }, [safeAvailabilityConfig, walkInServiceType]);

  const selectedService = useMemo(
    () => SERVICE_CATALOG.find((service) => service.id === walkInServiceType),
    [walkInServiceType],
  );

  const selectedPractitioner = useMemo(
    () =>
      selectedService?.practitioners.find(
        (practitioner) => practitioner.id === walkInPractitionerType,
      ) || null,
    [selectedService, walkInPractitionerType],
  );

  const tryLoginRequest = async () => {
    let lastResponse: Response | null = null;

    for (const baseUrl of supabaseAdminApiBaseUrls) {
      const response = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      lastResponse = response;
      if (response.status === 404) continue;
      return response;
    }

    return lastResponse;
  };

  const handleAdminLoginSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoginLoading(true);

    try {
      const response = await tryLoginRequest();
      if (!response) {
        toast.error("Admin API did not respond.");
        return;
      }

      const rawBody = await response.text();
      let data: any = {};
      try {
        data = rawBody ? JSON.parse(rawBody) : {};
      } catch {
        data = { error: rawBody };
      }

      if (response.ok && data.success && data.token) {
        toast.success("Login successful!");
        onLoginSuccess({
          id: Number(data?.user?.id || 0),
          token: data.token,
          username: data?.user?.username || username,
          role: normalizeUserRole(data?.user?.role),
          roleLabel: data?.user?.roleLabel,
          permissions: sanitizeRolePermissions(data?.user?.permissions),
        });
        return;
      }

      toast.error(data.error || "Invalid credentials");
    } catch (error) {
      console.error("Login failed:", error);
      toast.error("Network error while logging in");
    } finally {
      setLoginLoading(false);
    }
  };

  const apiFetchPublic = async (path: string, init?: RequestInit) => {
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

  const toLocalDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const normalizeCalendarDate = (date: Date) => {
    const normalized = new Date(date);
    normalized.setHours(12, 0, 0, 0);
    return normalized;
  };

  function isSameDay(left: Date, right: Date) {
    return (
      left.getFullYear() === right.getFullYear() &&
      left.getMonth() === right.getMonth() &&
      left.getDate() === right.getDate()
    );
  }

  function isPastTimeSlot(time: string, date: Date | undefined) {
    if (!date || !isSameDay(date, new Date())) {
      return false;
    }

    const [hours, minutes] = time.split(":").map(Number);
    const slotTimeDate = new Date(date);
    slotTimeDate.setHours(hours, minutes, 0, 0);
    return slotTimeDate <= new Date();
  }

  const handleContinueToReturningService = (patient: PatientSearchResult) => {
    setSelectedPatient(patient);
    resetWalkInSelection();
    setScreen("returning-service");
  };

  const handleContinueToNewService = () => {
    if (
      !newWalkInDetails.firstName.trim() ||
      !newWalkInDetails.lastName.trim() ||
      !newWalkInDetails.phone.trim()
    ) {
      toast.error("First name, last name, and phone are required");
      return;
    }

    resetWalkInSelection();
    setScreen("new-service");
  };

  const handleContinueFromServiceSelection = (source: WalkInSource) => {
    if (!walkInServiceType) {
      toast.error("Please select a service");
      return;
    }

    if (!walkInPractitionerType) {
      toast.error("Please select a practitioner");
      return;
    }

    resetSlotSelection();
    setPendingBookingSource(source);
    setScreen(source === "walk-in-existing" ? "returning-slot" : "new-slot");
  };

  const handleCreateWalkInBooking = async (source: WalkInSource) => {
    if (!slotDate || !slotTime) {
      toast.error("Please choose a date and time");
      return;
    }

    const details =
      source === "walk-in-existing" && selectedPatient
        ? {
            firstName: selectedPatient.first_name || "",
            lastName: selectedPatient.last_name || "",
            phone: selectedPatient.phone || "",
            email: selectedPatient.email || "",
            idNumber: selectedPatient.id_number || "",
            medicalAid: selectedPatient.medical_aid || "",
            medicalAidNumber: selectedPatient.medical_aid_number || "",
          }
        : newWalkInDetails;

    if (!details.firstName || !details.lastName || !details.phone) {
      toast.error("Patient details are incomplete");
      return;
    }

    try {
      setSavingBooking(true);

      const bookingData = {
        serviceType: walkInServiceType,
        practitionerType: walkInPractitionerType,
        date: `${toLocalDateString(slotDate)}T09:00:00`,
        time: slotTime,
        reason:
          source === "walk-in-existing"
            ? "Walk-in booking (existing patient)"
            : "Walk-in booking (new patient)",
        firstName: details.firstName,
        lastName: details.lastName,
        email: details.email,
        phone: details.phone,
        idNumber: details.idNumber,
        medicalAid: details.medicalAid,
        medicalAidNumber: details.medicalAidNumber,
        source,
      };

      const response = await apiFetchPublic(`/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bookingData),
      });

      if (!response) {
        throw new Error("No response from booking endpoint");
      }

      await parseApiResponse(response, "Create booking endpoint");
      toast.success(
        "Walk-in slot booked. Admin must confirm the booking before the form can be filled.",
      );

      setSearchTerm("");
      setSearchResults([]);
      setSelectedPatient(null);
      setNewWalkInDetails(EMPTY_WALKIN_DETAILS);
      resetWalkInSelection();
      setScreen("walkin-type");
    } catch (error) {
      console.error("Booking failed:", error);
      toast.error("Failed to create booking");
    } finally {
      setSavingBooking(false);
    }
  };

  const handleOnlineBookingCheckIn = async () => {
    const query = checkinPhone.trim() || checkinId.trim();

    if (!query) {
      toast.error("Enter the patient's phone number or ID number");
      return;
    }

    try {
      setCheckinLoading(true);

      const response = await apiFetchPublic(`/bookings/check-in`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      });

      if (!response) {
        throw new Error("No response from check-in endpoint");
      }

      const data = await parseApiResponse(response, "Check-in endpoint");
      const booking = data.booking;
      const patientName =
        `${booking?.first_name || ""} ${booking?.last_name || ""}`.trim();

      setMedicalIntakeContext({
        bookingId: String(booking?.id || ""),
        patientName: patientName || "Patient",
        initialData: {
          patient_first_name: booking?.first_name || "",
          patient_surname: booking?.last_name || "",
          patient_cell: booking?.phone || "",
          patient_email: booking?.email || "",
          patient_id_number: booking?.id_number || "",
          medical_aid_name: booking?.medical_aid || "",
          medical_aid_number: booking?.medical_aid_number || "",
        },
      });

      toast.success("Check-in successful");
      setMedicalIntakeOrigin("online-checkin");
      setScreen("medical-intake");
    } catch (error) {
      console.error("Check-in failed:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to check in booking",
      );
    } finally {
      setCheckinLoading(false);
    }
  };

  const handleMedicalIntakeSubmit = async (formData: MedicalIntakeData) => {
    if (!medicalIntakeContext?.bookingId) {
      toast.error("Missing booking context for medical form");
      return;
    }

    const response = await apiFetchPublic(`/medical-intake`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...formData,
        booking_id: medicalIntakeContext.bookingId,
      }),
    });

    if (!response) {
      throw new Error("No response from medical intake endpoint");
    }

    await parseApiResponse(response, "Medical intake endpoint");

    setMedicalIntakeContext(null);
    setCheckinPhone("");
    setCheckinId("");
    setFormLookupQuery("");
    setScreen("walkin-type");
  };

  const handleMedicalFormLookup = async () => {
    const query = formLookupQuery.trim();

    if (!query) {
      toast.error("Enter phone number or ID number");
      return;
    }

    try {
      setFormLookupLoading(true);

      const response = await apiFetchPublic(`/medical-intake/lookup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      });

      if (!response) {
        throw new Error("No response from medical form lookup endpoint");
      }

      const data = await parseApiResponse(
        response,
        "Medical form lookup endpoint",
      );

      if (!data?.canFill || !data?.booking) {
        toast.error(
          data?.message ||
            "No confirmed booking found. Admin must confirm the booking first.",
        );
        return;
      }

      const booking = data.booking;
      const previousForm = data.previousForm || null;
      const previousPayload = previousForm?.form_payload || {};
      const patientName =
        `${booking?.first_name || ""} ${booking?.last_name || ""}`.trim() ||
        "Patient";

      setMedicalIntakeContext({
        bookingId: String(booking?.id || ""),
        patientName,
        previousForm,
        initialData: {
          patient_first_name:
            previousPayload.patient_first_name || booking?.first_name || "",
          patient_surname:
            previousPayload.patient_surname || booking?.last_name || "",
          patient_cell: previousPayload.patient_cell || booking?.phone || "",
          patient_email: previousPayload.patient_email || booking?.email || "",
          patient_id_number:
            previousPayload.patient_id_number || booking?.id_number || "",
          medical_aid_name:
            previousPayload.medical_aid_name || booking?.medical_aid || "",
          medical_aid_number:
            previousPayload.medical_aid_number ||
            booking?.medical_aid_number ||
            "",
        },
      });

      if (previousForm) {
        toast.success(
          "Previous medical form found. You can review and update it.",
        );
      } else {
        toast.success("Booking confirmed. Please complete the medical form.");
      }

      setMedicalIntakeOrigin("medical-form-search");
      setScreen("medical-intake");
    } catch (error) {
      console.error("Medical form lookup failed:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not check booking status",
      );
    } finally {
      setFormLookupLoading(false);
    }
  };

  const renderTopBar = () => (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        <button
          onClick={() => {
            if (screen === "select-role") {
              onClose();
              return;
            }

            if (
              screen === "admin-login" ||
              screen === "walkin-type" ||
              screen === "online-checkin"
            ) {
              setScreen("select-role");
              return;
            }

            if (screen === "medical-form-search") {
              setScreen(medicalFormOrigin);
              return;
            }

            if (screen === "returning-search" || screen === "new-details") {
              setScreen("walkin-type");
              return;
            }

            if (screen === "returning-service") {
              setScreen("returning-search");
              return;
            }

            if (screen === "new-service") {
              setScreen("new-details");
              return;
            }

            if (screen === "returning-slot") {
              setScreen("returning-service");
              return;
            }

            if (screen === "new-slot") {
              setScreen("new-service");
              return;
            }

            if (screen === "medical-intake") {
              setMedicalIntakeContext(null);
              setScreen(medicalIntakeOrigin);
              return;
            }

            if (screen === "confirm-booking") {
              setScreen(
                pendingBookingSource === "walk-in-existing"
                  ? "returning-slot"
                  : "new-slot",
              );
              return;
            }
          }}
          className="flex items-center gap-2 text-gray-600 hover:text-[#9A7B1D]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back</span>
        </button>

        <img src={logo} alt="DentX Quarters" className="h-12 sm:h-14" />

        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-gray-100 text-gray-500"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  const renderSlotPicker = (title: string, onContinue: () => void) => (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6">
        <h2 className="text-xl text-gray-900 mb-2">{title}</h2>
        <p className="text-sm text-gray-500 mb-4">Select an available slot</p>

        <Calendar
          mode="single"
          selected={slotDate}
          onSelect={(nextDate) => {
            if (!nextDate) return;
            if (Number.isNaN(nextDate.getTime())) return;
            const normalizedDate = normalizeCalendarDate(nextDate);
            setSlotDate(normalizedDate);
            setSlotTime("");
          }}
          disabled={(date) => !isDateBookable(safeAvailabilityConfig, date)}
          className="rounded-md border"
        />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6">
        <h3 className="text-base text-gray-900 mb-3">Available Times</h3>

        {availabilityLoading ? (
          <p className="text-sm text-gray-500">Loading availability...</p>
        ) : !slotDate ? (
          <p className="text-sm text-gray-500">Select a date first.</p>
        ) : openTimes.length === 0 ? (
          <p className="text-sm text-gray-500">No open slots for this date.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {openTimes.map((time) => (
              <button
                key={time}
                type="button"
                onClick={() => setSlotTime(time)}
                className={`rounded-md border px-3 py-2 text-sm transition-colors ${
                  slotTime === time
                    ? "bg-[#9A7B1D] border-[#9A7B1D] text-white"
                    : "bg-white border-gray-200 hover:border-[#9A7B1D]"
                }`}
              >
                {time}
              </button>
            ))}
          </div>
        )}

        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {slotDate && slotTime
              ? `${(() => {
                  try {
                    return format(slotDate, "EEE, d MMM yyyy");
                  } catch {
                    return "Selected day";
                  }
                })()} at ${slotTime}`
              : "No slot selected"}
          </div>
          <Button
            onClick={onContinue}
            disabled={!slotDate || !slotTime}
            className="bg-[#9A7B1D] hover:bg-[#7d6418]"
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );

  const renderWalkInServiceScreen = (title: string, onContinue: () => void) => (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6">
        <h2 className="text-2xl text-gray-900 mb-2">{title}</h2>
        <p className="text-sm text-gray-500 mb-6">
          Select a service and practitioner before choosing a slot.
        </p>

        {availabilityLoading ? (
          <p className="text-sm text-gray-500">Loading services...</p>
        ) : (
          <>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Service</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {availableWalkInServices.map((service) => (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => {
                    setWalkInServiceType(service.id);
                    setWalkInPractitionerType("");
                  }}
                  className={`rounded-lg border p-3 text-left transition-colors ${
                    walkInServiceType === service.id
                      ? "border-[#9A7B1D] bg-[#9A7B1D]/10"
                      : "border-gray-200 hover:border-[#9A7B1D]"
                  }`}
                >
                  <p className="text-sm text-gray-900">{service.title}</p>
                </button>
              ))}
            </div>

            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Practitioner
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {availableWalkInPractitioners.length === 0 ? (
                <p className="text-sm text-gray-500 sm:col-span-2">
                  Select a service to view available practitioners.
                </p>
              ) : (
                availableWalkInPractitioners.map((practitioner) => (
                  <button
                    key={practitioner.id}
                    type="button"
                    onClick={() => setWalkInPractitionerType(practitioner.id)}
                    className={`rounded-lg border p-3 text-left transition-colors ${
                      walkInPractitionerType === practitioner.id
                        ? "border-[#9A7B1D] bg-[#9A7B1D]/10"
                        : "border-gray-200 hover:border-[#9A7B1D]"
                    }`}
                  >
                    <p className="text-sm text-gray-900">
                      {practitioner.title}
                    </p>
                  </button>
                ))
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <Button
                onClick={onContinue}
                className="bg-[#9A7B1D] hover:bg-[#7d6418]"
              >
                Continue to Slots
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {renderTopBar()}

      {screen === "select-role" && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
          <h1 className="text-2xl sm:text-3xl text-center text-gray-900 mb-2">
            Welcome to DentX Access Portal
          </h1>
          <p className="text-center text-gray-500 mb-8">
            Continue as admin, walk-in client, or online check-in
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              type="button"
              onClick={() => setScreen("admin-login")}
              className="rounded-xl border border-gray-200 bg-white p-6 text-left hover:border-[#9A7B1D]"
            >
              <Lock className="w-6 h-6 text-[#9A7B1D] mb-3" />
              <h2 className="text-lg text-gray-900 mb-1">Admin Login</h2>
              <p className="text-sm text-gray-500">
                Access the full admin dashboard.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setScreen("walkin-type")}
              className="rounded-xl border border-gray-200 bg-white p-6 text-left hover:border-[#9A7B1D]"
            >
              <Users className="w-6 h-6 text-[#9A7B1D] mb-3" />
              <h2 className="text-lg text-gray-900 mb-1">Walk-in Client</h2>
              <p className="text-sm text-gray-500">
                Book a slot for returning or new walk-in patients.
              </p>
            </button>
            <button
              type="button"
              onClick={() => {
                setCheckinPhone("");
                setCheckinId("");
                setMedicalIntakeContext(null);
                setMedicalIntakeOrigin("online-checkin");
                setScreen("online-checkin");
              }}
              className="rounded-xl border border-gray-200 bg-white p-6 text-left hover:border-[#9A7B1D]"
            >
              <CheckCircle className="w-6 h-6 text-[#9A7B1D] mb-3" />
              <h2 className="text-lg text-gray-900 mb-1">Online Check-in</h2>
              <p className="text-sm text-gray-500">
                Check in an existing online booking and complete the medical
                file.
              </p>
            </button>
          </div>
        </div>
      )}

      {screen === "select-role" && (
        <div className="fixed bottom-0 left-0 right-0 pb-4 text-center">
          <p className="text-sm text-gray-500">
            <span className="font-bold text-gray-700">
              A System bt Test Africa Projects
            </span>
          </p>
        </div>
      )}

      {screen === "admin-login" && (
        <div className="max-w-md mx-auto px-4 py-10">
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-xl text-gray-900 mb-5">Admin Login</h2>

            <form onSubmit={handleAdminLoginSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="portal-username">Username</Label>
                <Input
                  id="portal-username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="Admin"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="portal-password">Password</Label>
                <Input
                  id="portal-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={loginLoading}
                className="w-full bg-[#9A7B1D] hover:bg-[#7d6418]"
              >
                {loginLoading ? "Logging in..." : "Login"}
              </Button>
            </form>
          </div>
        </div>
      )}

      {screen === "walkin-type" && (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
          <h2 className="text-2xl text-gray-900 text-center mb-2">
            Walk-in Client Type
          </h2>
          <p className="text-gray-500 text-center mb-8">
            Select returning client or new client.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setSearchResults([]);
                setSelectedPatient(null);
                resetWalkInSelection();
                setScreen("returning-search");
              }}
              className="rounded-xl border border-gray-200 bg-white p-6 text-left hover:border-[#9A7B1D]"
            >
              <User className="w-6 h-6 text-[#9A7B1D] mb-3" />
              <h3 className="text-lg text-gray-900 mb-1">Returning Client</h3>
              <p className="text-sm text-gray-500">
                Search existing patient and book a slot.
              </p>
            </button>

            <button
              type="button"
              onClick={() => {
                setNewWalkInDetails(EMPTY_WALKIN_DETAILS);
                resetWalkInSelection();
                setScreen("new-details");
              }}
              className="rounded-xl border border-gray-200 bg-white p-6 text-left hover:border-[#9A7B1D]"
            >
              <Users className="w-6 h-6 text-[#9A7B1D] mb-3" />
              <h3 className="text-lg text-gray-900 mb-1">New Client</h3>
              <p className="text-sm text-gray-500">
                Capture new patient details, then book a slot.
              </p>
            </button>

            <button
              type="button"
              onClick={() => {
                setFormLookupQuery("");
                setMedicalIntakeContext(null);
                setMedicalFormOrigin("walkin-type");
                setMedicalIntakeOrigin("medical-form-search");
                setScreen("medical-form-search");
              }}
              className="rounded-xl border border-gray-200 bg-white p-6 text-left hover:border-[#9A7B1D]"
            >
              <FileText className="w-6 h-6 text-[#9A7B1D] mb-3" />
              <h3 className="text-lg text-gray-900 mb-1">Fill Medical Form</h3>
              <p className="text-sm text-gray-500">
                Search booking and complete the medical form once admin
                confirms.
              </p>
            </button>
          </div>
        </div>
      )}

      {screen === "medical-form-search" && (
        <div className="max-w-md mx-auto px-4 py-10">
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-xl text-gray-900 mb-2">Fill Medical Form</h2>
            <p className="text-sm text-gray-500 mb-5">
              Search by phone or ID. If your booking is confirmed by admin, you
              will continue to the medical form.
            </p>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="medical-form-lookup">Phone or ID Number</Label>
                <Input
                  id="medical-form-lookup"
                  value={formLookupQuery}
                  onChange={(event) => setFormLookupQuery(event.target.value)}
                  placeholder="e.g. 0821234567 or ID number"
                />
              </div>

              <Button
                onClick={() => void handleMedicalFormLookup()}
                disabled={formLookupLoading || !formLookupQuery.trim()}
                className="w-full bg-[#9A7B1D] hover:bg-[#7d6418]"
              >
                {formLookupLoading ? "Checking booking..." : "Find Booking"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {screen === "online-checkin" && (
        <div className="max-w-md mx-auto px-4 py-10">
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-xl text-gray-900 mb-2">Online Check-in</h2>
            <p className="text-sm text-gray-500 mb-5">
              Enter the patient's phone number or ID number to locate
              today&apos;s confirmed online booking.
            </p>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="checkin-phone">Phone Number</Label>
                <Input
                  id="checkin-phone"
                  value={checkinPhone}
                  onChange={(event) => setCheckinPhone(event.target.value)}
                  placeholder="e.g. 0821234567"
                />
              </div>

              <div className="text-center text-xs uppercase tracking-wide text-gray-400">
                or
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="checkin-id">ID Number</Label>
                <Input
                  id="checkin-id"
                  value={checkinId}
                  onChange={(event) => setCheckinId(event.target.value)}
                  placeholder="South African ID number"
                />
              </div>

              <Button
                onClick={() => void handleOnlineBookingCheckIn()}
                disabled={
                  checkinLoading || (!checkinPhone.trim() && !checkinId.trim())
                }
                className="w-full bg-[#9A7B1D] hover:bg-[#7d6418]"
              >
                {checkinLoading ? "Checking In..." : "Check In"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {screen === "medical-intake" && medicalIntakeContext && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-4">
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Completing medical file for {medicalIntakeContext.patientName}
          </div>

          {medicalIntakeContext.previousForm && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
              <p className="font-semibold mb-1">Previous Medical Form Found</p>
              <p>
                Last submitted:{" "}
                {medicalIntakeContext.previousForm.created_at
                  ? (() => {
                      try {
                        return format(
                          new Date(
                            medicalIntakeContext.previousForm.created_at,
                          ),
                          "d MMM yyyy, HH:mm",
                        );
                      } catch {
                        return "Unknown";
                      }
                    })()
                  : "Unknown"}
              </p>
            </div>
          )}

          <MedicalIntakeForm
            initialData={medicalIntakeContext.initialData}
            onSubmit={handleMedicalIntakeSubmit}
            onCancel={() => {
              setMedicalIntakeContext(null);
              setScreen(medicalIntakeOrigin);
            }}
          />
        </div>
      )}

      {screen === "returning-search" && (
        <div className="min-h-[70vh] px-4 py-10 flex items-center justify-center">
          <div className="w-full max-w-2xl">
            <div className="flex justify-end mb-4">
              <Button
                variant="outline"
                onClick={() => {
                  setFormLookupQuery("");
                  setMedicalFormOrigin("returning-search");
                  setMedicalIntakeOrigin("medical-form-search");
                  setScreen("medical-form-search");
                }}
              >
                Fill Medical Form
              </Button>
            </div>

            <img
              src={logo}
              alt="DentX Quarters"
              className="h-20 mx-auto mb-6"
            />
            <h2 className="text-2xl text-center text-gray-900 mb-2">
              Find Returning Patient
            </h2>
            <p className="text-center text-gray-500 mb-6">
              Search by first name or last name
            </p>

            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search patient name..."
                className="pl-10 h-11"
              />
            </div>

            <div className="rounded-xl border border-gray-200 bg-white max-h-80 overflow-auto">
              {searching ? (
                <p className="p-4 text-sm text-gray-500">Searching...</p>
              ) : searchTerm.trim().length < 2 ? (
                <p className="p-4 text-sm text-gray-500">
                  Enter at least 2 characters to search.
                </p>
              ) : searchResults.length === 0 ? (
                <p className="p-4 text-sm text-gray-500">No patients found.</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {searchResults.map((patient) => (
                    <button
                      key={patient.id}
                      type="button"
                      onClick={() => handleContinueToReturningService(patient)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50"
                    >
                      <p className="text-sm text-gray-900">
                        {(patient.first_name || "").trim()}{" "}
                        {(patient.last_name || "").trim()}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {patient.phone || "No phone"}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {screen === "returning-service" &&
        renderWalkInServiceScreen(
          "Returning Client: Service & Practitioner",
          () => handleContinueFromServiceSelection("walk-in-existing"),
        )}

      {screen === "returning-slot" &&
        renderSlotPicker(
          `Select Slot for ${(selectedPatient?.first_name || "").trim()} ${(selectedPatient?.last_name || "").trim()}`,
          () => {
            setPendingBookingSource("walk-in-existing");
            setScreen("confirm-booking");
          },
        )}

      {screen === "new-details" && (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
          <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6">
            <div className="flex justify-end mb-4">
              <Button
                variant="outline"
                onClick={() => {
                  setFormLookupQuery("");
                  setMedicalFormOrigin("new-details");
                  setMedicalIntakeOrigin("medical-form-search");
                  setScreen("medical-form-search");
                }}
              >
                Fill Medical Form
              </Button>
            </div>

            <h2 className="text-2xl text-gray-900 mb-2">New Client Details</h2>
            <p className="text-sm text-gray-500 mb-6">
              Capture patient details before selecting a slot.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="new-first-name">First name</Label>
                <Input
                  id="new-first-name"
                  value={newWalkInDetails.firstName}
                  onChange={(event) =>
                    setNewWalkInDetails((prev) => ({
                      ...prev,
                      firstName: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-last-name">Last name</Label>
                <Input
                  id="new-last-name"
                  value={newWalkInDetails.lastName}
                  onChange={(event) =>
                    setNewWalkInDetails((prev) => ({
                      ...prev,
                      lastName: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-phone">Phone</Label>
                <Input
                  id="new-phone"
                  value={newWalkInDetails.phone}
                  onChange={(event) =>
                    setNewWalkInDetails((prev) => ({
                      ...prev,
                      phone: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-email">Email</Label>
                <Input
                  id="new-email"
                  type="email"
                  value={newWalkInDetails.email}
                  onChange={(event) =>
                    setNewWalkInDetails((prev) => ({
                      ...prev,
                      email: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-id-number">ID Number</Label>
                <Input
                  id="new-id-number"
                  value={newWalkInDetails.idNumber}
                  onChange={(event) =>
                    setNewWalkInDetails((prev) => ({
                      ...prev,
                      idNumber: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-medical-aid">Medical Aid</Label>
                <Input
                  id="new-medical-aid"
                  value={newWalkInDetails.medicalAid}
                  onChange={(event) =>
                    setNewWalkInDetails((prev) => ({
                      ...prev,
                      medicalAid: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="new-medical-aid-number">
                  Medical Aid Number
                </Label>
                <Input
                  id="new-medical-aid-number"
                  value={newWalkInDetails.medicalAidNumber}
                  onChange={(event) =>
                    setNewWalkInDetails((prev) => ({
                      ...prev,
                      medicalAidNumber: event.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button
                onClick={handleContinueToNewService}
                className="bg-[#9A7B1D] hover:bg-[#7d6418]"
              >
                Continue to Service
              </Button>
            </div>
          </div>
        </div>
      )}

      {screen === "new-service" &&
        renderWalkInServiceScreen("New Client: Service & Practitioner", () =>
          handleContinueFromServiceSelection("walk-in-new"),
        )}

      {screen === "new-slot" &&
        renderSlotPicker("Select Slot for New Walk-in Client", () => {
          setPendingBookingSource("walk-in-new");
          setScreen("confirm-booking");
        })}

      {screen === "confirm-booking" && (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
          <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6">
            <h2 className="text-2xl text-gray-900 mb-2">Confirm Booking</h2>
            <p className="text-sm text-gray-500 mb-6">
              Review details before submitting the booking.
            </p>

            <div className="space-y-3 text-sm text-gray-700">
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">Client Type</span>
                <span>
                  {pendingBookingSource === "walk-in-existing"
                    ? "Returning Client"
                    : "New Client"}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">Patient</span>
                <span>
                  {pendingBookingSource === "walk-in-existing"
                    ? `${selectedPatient?.first_name || ""} ${selectedPatient?.last_name || ""}`.trim() ||
                      "Unknown"
                    : `${newWalkInDetails.firstName} ${newWalkInDetails.lastName}`.trim() ||
                      "Unknown"}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">Service</span>
                <span>{selectedService?.title || "Not selected"}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">Practitioner</span>
                <span>{selectedPractitioner?.title || "Not selected"}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">Date & Time</span>
                <span>
                  {slotDate && slotTime
                    ? `${(() => {
                        try {
                          return format(slotDate, "EEE, d MMM yyyy");
                        } catch {
                          return "Selected day";
                        }
                      })()} at ${slotTime}`
                    : "Not selected"}
                </span>
              </div>
            </div>

            <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              Admin must confirm this booking before a medical form can be
              filled.
            </div>

            <div className="mt-8 flex justify-end">
              <Button
                onClick={() =>
                  pendingBookingSource &&
                  void handleCreateWalkInBooking(pendingBookingSource)
                }
                disabled={!pendingBookingSource || savingBooking}
                className="bg-[#9A7B1D] hover:bg-[#7d6418]"
              >
                {savingBooking ? "Submitting..." : "Confirm & Book"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function AccessPortal(props: AccessPortalProps) {
  return (
    <AccessPortalErrorBoundary>
      <AccessPortalContent {...props} />
    </AccessPortalErrorBoundary>
  );
}
