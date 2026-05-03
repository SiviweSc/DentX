// @ts-nocheck
import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";
import { PDFDocument, StandardFonts, rgb } from "npm:pdf-lib";

const app = new Hono().basePath("/hyper-responder");

// Enable logger
app.use("*", logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Create Supabase client
const getSupabaseClient = () => {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );
};

const parseHexColor = (value: unknown) => {
  const raw = String(value ?? "").trim();
  if (!raw) {
    return "";
  }

  // Accept common DB input variants: #RRGGBB, RRGGBB, #RGB, RGB, 0xRRGGBB,
  // including values wrapped in quotes or ending with delimiters.
  const cleaned = raw.replace(/^[\s'"`]+|[\s'"`;]+$/g, "");
  const normalized = cleaned
    .replace(/^0x/i, "")
    .replace(/^#/, "")
    .toUpperCase();

  if (/^[0-9A-F]{3}$/.test(normalized)) {
    const expanded = normalized
      .split("")
      .map((character) => `${character}${character}`)
      .join("");
    return `#${expanded}`;
  }

  if (/^[0-9A-F]{6}$/.test(normalized)) {
    return `#${normalized}`;
  }

  return "";
};

const isValidHexColor = (value: unknown) =>
  /^#[0-9A-F]{6}$/.test(parseHexColor(value));

const requireBrandingText = (value: unknown, fieldName: string) => {
  const text = String(value || "").trim();
  if (!text) {
    throw new Error(`Active branding is missing '${fieldName}'`);
  }
  return text;
};

const requireBrandingHex = (value: unknown, fieldName: string) => {
  const hex = parseHexColor(value);
  if (!isValidHexColor(hex)) {
    const receivedPreview = JSON.stringify(
      String(value ?? "")
        .trim()
        .slice(0, 64),
    );
    throw new Error(
      `Active branding has invalid '${fieldName}'. Expected format: #RRGGBB. Received: ${receivedPreview}`,
    );
  }
  return hex;
};

const parseBrandingConfig = (rawConfig: any) => {
  if (!rawConfig || typeof rawConfig !== "object") {
    throw new Error("Active branding configuration not found");
  }

  return {
    primaryHex: requireBrandingHex(rawConfig.primary_hex, "primary_hex"),
    primaryLightHex: requireBrandingHex(
      rawConfig.primary_light_hex,
      "primary_light_hex",
    ),
    textHex: requireBrandingHex(rawConfig.text_hex, "text_hex"),
    mutedHex: requireBrandingHex(rawConfig.muted_hex, "muted_hex"),
    institutionName: requireBrandingText(
      rawConfig.institution_name,
      "institution_name",
    ),
    website: requireBrandingText(rawConfig.website, "website"),
    phone: requireBrandingText(rawConfig.phone, "phone"),
    location: requireBrandingText(rawConfig.location, "location"),
    logoBase64: String(rawConfig.logo_base64 || "").trim(),
  };
};

const resolveBrandingConfig = (rawConfig: any) => {
  if (!rawConfig || typeof rawConfig !== "object") {
    throw new Error("Active branding configuration not found");
  }

  const hasCamelCaseShape =
    "primaryHex" in rawConfig &&
    "primaryLightHex" in rawConfig &&
    "textHex" in rawConfig &&
    "mutedHex" in rawConfig;

  if (!hasCamelCaseShape) {
    return parseBrandingConfig(rawConfig);
  }

  return {
    primaryHex: requireBrandingHex(rawConfig.primaryHex, "primaryHex"),
    primaryLightHex: requireBrandingHex(
      rawConfig.primaryLightHex,
      "primaryLightHex",
    ),
    textHex: requireBrandingHex(rawConfig.textHex, "textHex"),
    mutedHex: requireBrandingHex(rawConfig.mutedHex, "mutedHex"),
    institutionName: requireBrandingText(
      rawConfig.institutionName,
      "institutionName",
    ),
    website: requireBrandingText(rawConfig.website, "website"),
    phone: requireBrandingText(rawConfig.phone, "phone"),
    location: requireBrandingText(rawConfig.location, "location"),
    logoBase64: String(rawConfig.logoBase64 || "").trim(),
  };
};

const getBrandingConfig = async (supabase: any) => {
  const { data, error } = await supabase
    .from("branding_settings")
    .select(
      "institution_name, website, phone, location, primary_hex, primary_light_hex, text_hex, muted_hex, logo_base64",
    )
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    if (String((error as any)?.code || "") === "42P01") {
      throw new Error(
        "branding_settings table is missing. Run the branding migration.",
      );
    }
    throw new Error(`Failed to read branding settings: ${error.message}`);
  }

  return parseBrandingConfig(data);
};

const EMPTY_ROLE_PERMISSIONS = {
  dashboard: false,
  calendar: false,
  bookings: false,
  bookingsConfirm: false,
  bookingsDelete: false,
  patients: false,
  practice: false,
  activity: false,
  settings: false,
  bookingsComplete: false,
  manageUsers: false,
  manageAvailability: false,
};

const PERMISSION_KEY_MAP: Record<string, string> = {
  "bookings.confirm": "bookingsConfirm",
  "bookings.complete": "bookingsComplete",
  "bookings.delete": "bookingsDelete",
  "settings.availability": "manageAvailability",
  "users.manage": "manageUsers",
};

const normalizeServiceTypeValue = (value: unknown) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");

const formatServiceTypeLabel = (serviceType: string) =>
  String(serviceType || "")
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const formatPractitionerLabel = (practitionerId: string) => {
  if (practitionerId === "not-sure") {
    return "I'm not sure";
  }

  return String(practitionerId || "")
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const getSupportedServiceTypes = async (
  supabase: ReturnType<typeof getSupabaseClient>,
) => {
  const { data, error } = await supabase
    .from("supported_service_types")
    .select("service_type, label")
    .order("service_type", { ascending: true });

  if (error) {
    if (String((error as any)?.code || "") !== "42P01") {
      throw error;
    }

    const { data: fallbackRows, error: fallbackError } = await supabase
      .from("service_availability")
      .select("service_id")
      .order("service_id", { ascending: true });

    if (fallbackError) {
      throw fallbackError;
    }

    return (fallbackRows || [])
      .map((row: any) => normalizeServiceTypeValue(row?.service_id))
      .filter(Boolean)
      .map((serviceType: string) => ({
        service_type: serviceType,
        label: formatServiceTypeLabel(serviceType),
      }));
  }

  return (data || [])
    .map((row: any) => ({
      service_type: normalizeServiceTypeValue(row?.service_type),
      label:
        String(row?.label || "").trim() ||
        formatServiceTypeLabel(normalizeServiceTypeValue(row?.service_type)),
    }))
    .filter((row: any) => Boolean(row.service_type));
};

const normalizeDoctorServiceTypes = async (
  supabase: ReturnType<typeof getSupabaseClient>,
  value: unknown,
) => {
  if (!Array.isArray(value)) {
    return [];
  }

  const supportedServiceTypes = await getSupportedServiceTypes(supabase);
  const supportedValues = new Set(
    supportedServiceTypes.map((row: any) =>
      normalizeServiceTypeValue(row?.service_type),
    ),
  );

  const unique = new Set<string>();
  for (const entry of value) {
    const normalized = normalizeServiceTypeValue(entry);
    if (supportedValues.has(normalized)) {
      unique.add(normalized);
    }
  }

  return Array.from(unique);
};

const normalizeRoleValue = (role: string | null | undefined) => {
  const normalized = String(role || "")
    .trim()
    .toLowerCase();
  return normalized || "admin";
};

const sanitizeRolePermissions = (value: unknown) => {
  const source =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};

  return {
    ...EMPTY_ROLE_PERMISSIONS,
    dashboard: source.dashboard === true,
    calendar: source.calendar === true,
    bookings: source.bookings === true,
    bookingsConfirm: source.bookingsConfirm === true,
    bookingsDelete: source.bookingsDelete === true,
    patients: source.patients === true,
    practice: source.practice === true,
    activity: source.activity === true,
    settings: source.settings === true,
    bookingsComplete: source.bookingsComplete === true,
    manageUsers: source.manageUsers === true,
    manageAvailability: source.manageAvailability === true,
  };
};

const mergeUserPermissions = (
  rolePermissions: Record<string, boolean>,
  userOverride: unknown,
) => {
  const source =
    userOverride && typeof userOverride === "object"
      ? (userOverride as Record<string, unknown>)
      : {};

  return {
    dashboard: rolePermissions.dashboard === true && source.dashboard !== false,
    calendar: rolePermissions.calendar === true && source.calendar !== false,
    bookings: rolePermissions.bookings === true && source.bookings !== false,
    bookingsConfirm:
      rolePermissions.bookingsConfirm === true &&
      source.bookingsConfirm !== false,
    bookingsDelete:
      rolePermissions.bookingsDelete === true &&
      source.bookingsDelete !== false,
    patients: rolePermissions.patients === true && source.patients !== false,
    practice: rolePermissions.practice === true && source.practice !== false,
    activity: rolePermissions.activity === true && source.activity !== false,
    settings: rolePermissions.settings === true && source.settings !== false,
    bookingsComplete:
      rolePermissions.bookingsComplete === true &&
      source.bookingsComplete !== false,
    manageUsers:
      rolePermissions.manageUsers === true && source.manageUsers !== false,
    manageAvailability:
      rolePermissions.manageAvailability === true &&
      source.manageAvailability !== false,
  };
};

const buildPermissionsOverride = (
  requestedPermissions: unknown,
  rolePermissions: Record<string, boolean>,
) => {
  const source =
    requestedPermissions && typeof requestedPermissions === "object"
      ? (requestedPermissions as Record<string, unknown>)
      : {};

  return Object.fromEntries(
    Object.entries(rolePermissions).filter(
      ([permissionKey, enabled]) =>
        enabled === true && source[permissionKey] === false,
    ),
  );
};

const SUPER_ADMIN_REQUIRED_PERMISSIONS = [
  "dashboard",
  "settings",
  "manageUsers",
] as const;

const hasRequiredSuperAdminAccess = (permissions: Record<string, boolean>) =>
  SUPER_ADMIN_REQUIRED_PERMISSIONS.every(
    (permissionKey) => permissions[permissionKey] === true,
  );

const getRoleDefinition = async (
  supabase: ReturnType<typeof getSupabaseClient>,
  role: string | null | undefined,
) => {
  const normalizedRole = normalizeRoleValue(role);

  const { data } = await supabase
    .from("role_definitions")
    .select("role, label, permissions")
    .eq("role", normalizedRole)
    .maybeSingle();

  if (data) {
    return {
      role: data.role,
      roleLabel: data.label || data.role,
      permissions: sanitizeRolePermissions(data.permissions),
    };
  }

  const { data: fallbackData } = await supabase
    .from("role_definitions")
    .select("role, label, permissions")
    .eq("role", "admin")
    .maybeSingle();

  if (fallbackData) {
    return {
      role: fallbackData.role,
      roleLabel: fallbackData.label || fallbackData.role,
      permissions: sanitizeRolePermissions(fallbackData.permissions),
    };
  }

  return {
    role: normalizedRole,
    roleLabel: normalizedRole,
    permissions: sanitizeRolePermissions(null),
  };
};

const hasPermission = (
  permissions: Record<string, boolean>,
  permission: string,
) => {
  const mappedPermission = PERMISSION_KEY_MAP[permission] || permission;
  return (
    permissions[mappedPermission] === true || permissions[permission] === true
  );
};

const isValidRole = async (
  supabase: ReturnType<typeof getSupabaseClient>,
  role: string,
) => {
  const { data } = await supabase
    .from("role_definitions")
    .select("role")
    .eq("role", normalizeRoleValue(role))
    .maybeSingle();

  return Boolean(data?.role);
};

const getDatePartFromIso = (value: string) => String(value || "").slice(0, 10);

const pickDoctorForBooking = async (
  supabase: ReturnType<typeof getSupabaseClient>,
  bookingDateValue: string,
  bookingTimeValue: string,
  currentAssignedDoctorId?: number | null,
) => {
  const bookingDatePart = getDatePartFromIso(bookingDateValue);

  const { data: doctors, error: doctorsError } = await supabase
    .from("admin_users")
    .select("id, username")
    .eq("role", "doctor")
    .eq("is_available", true)
    .order("id", { ascending: true });

  if (doctorsError) {
    throw doctorsError;
  }

  const activeDoctors = doctors || [];
  if (!activeDoctors.length) {
    return null;
  }

  const { data: conflictingBookings, error: bookingError } = await supabase
    .from("bookings")
    .select("assigned_doctor_id")
    .gte("date", `${bookingDatePart}T00:00:00`)
    .lt("date", `${bookingDatePart}T23:59:59`)
    .eq("time", bookingTimeValue)
    .in("status", ["confirmed", "completed"])
    .not("assigned_doctor_id", "is", null);

  if (bookingError) {
    throw bookingError;
  }

  const unavailableDoctorIds = new Set(
    (conflictingBookings || [])
      .map((booking: any) => Number(booking.assigned_doctor_id))
      .filter((id: number) => Number.isInteger(id)),
  );

  if (
    currentAssignedDoctorId &&
    activeDoctors.some(
      (doctor: any) => doctor.id === currentAssignedDoctorId,
    ) &&
    !unavailableDoctorIds.has(currentAssignedDoctorId)
  ) {
    return activeDoctors.find(
      (doctor: any) => doctor.id === currentAssignedDoctorId,
    );
  }

  return (
    activeDoctors.find((doctor: any) => !unavailableDoctorIds.has(doctor.id)) ||
    null
  );
};

const getEligibleDoctorsForServiceAndSlot = async (
  supabase: ReturnType<typeof getSupabaseClient>,
  {
    serviceType,
    bookingDatePart,
    bookingTime,
  }: {
    serviceType: string;
    bookingDatePart: string;
    bookingTime: string;
  },
) => {
  const { data: doctors, error: doctorsError } = await supabase
    .from("admin_users")
    .select("id, username")
    .eq("role", "doctor")
    .eq("is_available", true)
    .order("username", { ascending: true });

  if (doctorsError) {
    throw doctorsError;
  }

  const activeDoctors = (doctors || []).filter((doctor: any) =>
    Number.isInteger(Number(doctor?.id)),
  );

  if (!activeDoctors.length) {
    return [];
  }

  const doctorIdList = activeDoctors.map((doctor: any) => Number(doctor.id));
  let serviceScopedDoctorIds = new Set<number>(doctorIdList);

  const { data: doctorServiceRows, error: doctorServiceError } = await supabase
    .from("doctor_service_assignments")
    .select("doctor_id")
    .eq("service_type", serviceType)
    .in("doctor_id", doctorIdList);

  if (doctorServiceError) {
    // If migration has not been applied yet, keep backward compatibility.
    if (String((doctorServiceError as any)?.code || "") !== "42P01") {
      throw doctorServiceError;
    }
  } else {
    serviceScopedDoctorIds = new Set(
      (doctorServiceRows || [])
        .map((row: any) => Number(row.doctor_id))
        .filter((id: number) => Number.isInteger(id)),
    );
  }

  const { data: conflicts, error: conflictsError } = await supabase
    .from("bookings")
    .select("assigned_doctor_id")
    .gte("date", `${bookingDatePart}T00:00:00`)
    .lt("date", `${bookingDatePart}T23:59:59`)
    .eq("time", bookingTime)
    .in("status", ["confirmed", "completed"])
    .not("assigned_doctor_id", "is", null);

  if (conflictsError) {
    throw conflictsError;
  }

  const busyDoctorIds = new Set(
    (conflicts || [])
      .map((row: any) => Number(row.assigned_doctor_id))
      .filter((id: number) => Number.isInteger(id)),
  );

  return activeDoctors.filter(
    (doctor: any) =>
      serviceScopedDoctorIds.has(Number(doctor.id)) &&
      !busyDoctorIds.has(Number(doctor.id)),
  );
};

const getAppointmentDateTime = (
  bookingDateValue: string,
  bookingTimeValue: string,
) => {
  const datePart = getDatePartFromIso(bookingDateValue);
  const timePart = normalizeTimeValue(bookingTimeValue, "");

  if (!datePart || !timePart) {
    return null;
  }

  const appointment = new Date(`${datePart}T${timePart}:00`);
  if (Number.isNaN(appointment.getTime())) {
    return null;
  }

  return appointment;
};

const releaseExpiredUncheckedInBookings = async (
  supabase: ReturnType<typeof getSupabaseClient>,
) => {
  const today = new Date();
  const datePart = getDatePartFromIso(today.toISOString());
  const now = new Date();

  const { data: candidates, error } = await supabase
    .from("bookings")
    .select("id, first_name, last_name, date, time, source, checked_in_at")
    .eq("status", "confirmed")
    .gte("date", `${datePart}T00:00:00`)
    .lt("date", `${datePart}T23:59:59`)
    .is("checked_in_at", null);

  if (error) {
    throw error;
  }

  const expiredBookingIds: string[] = [];
  const expiredBookings = (candidates || []).filter((booking: any) => {
    const source = String(booking.source || "").toLowerCase();
    if (source.startsWith("walk-in")) {
      return false;
    }

    const appointment = getAppointmentDateTime(booking.date, booking.time);
    if (!appointment) {
      return false;
    }

    const cutoff = new Date(appointment.getTime() - 15 * 60 * 1000);
    return now > cutoff;
  });

  for (const booking of expiredBookings) {
    expiredBookingIds.push(booking.id);
  }

  if (!expiredBookingIds.length) {
    return { released: 0 };
  }

  const { error: updateError } = await supabase
    .from("bookings")
    .update({
      status: "cancelled",
      cancellation_reason:
        "Automatically unbooked: patient did not check in 15 minutes before appointment",
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .in("id", expiredBookingIds);

  if (updateError) {
    throw updateError;
  }

  await supabase.from("activity_log").insert(
    expiredBookingIds.map((bookingId) => ({
      type: "booking_auto_unbooked",
      user_name: "System",
      user_role: "system",
      description:
        "Booking automatically unbooked because patient did not check in before cutoff",
      booking_id: bookingId,
    })),
  );

  return { released: expiredBookingIds.length };
};

// Middleware to check admin authentication
const requireAuth = async (c: any, next: any) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const [username, password] = atob(authHeader.split(" ")[1]).split(":");

    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("admin_users")
      .select("*")
      .eq("username", username)
      .eq("password_hash", password)
      .single();

    if (error || !data) {
      return c.json({ error: "Invalid credentials" }, 401);
    }

    const roleDefinition = await getRoleDefinition(supabase, data.role);
    const effectivePermissions = mergeUserPermissions(
      roleDefinition.permissions,
      data.permissions_override,
    );

    c.set("user", {
      ...data,
      role: roleDefinition.role,
      roleLabel: roleDefinition.roleLabel,
      permissions: effectivePermissions,
    });
    await next();
  } catch (e) {
    return c.json({ error: "Invalid authorization header" }, 401);
  }
};

const requirePermission = (permission: string) => {
  return async (c: any, next: any) => {
    const user = c.get("user");
    if (!hasPermission(user?.permissions || {}, permission)) {
      return c.json(
        {
          error: "Forbidden",
          detail: `Role '${normalizeRoleValue(user?.role)}' lacks permission '${permission}'`,
        },
        403,
      );
    }

    await next();
  };
};

const requireSuperAdmin = async (c: any, next: any) => {
  const user = c.get("user");
  if (normalizeRoleValue(user?.role) !== "super_admin") {
    return c.json(
      {
        error: "Forbidden",
        detail: "Only Super Admin can access this resource",
      },
      403,
    );
  }

  await next();
};

const DEFAULT_AVAILABILITY_CONFIG = {
  services: {
    dental: {
      enabled: true,
      practitioners: {
        "general-dentist": true,
        "dental-therapist": true,
        emergency: true,
        "not-sure": true,
      },
    },
    medical: {
      enabled: true,
      practitioners: {
        "general-practitioner": true,
        "clinical-associate": true,
        "not-sure": true,
      },
    },
    "iv-therapy": {
      enabled: true,
      practitioners: {
        hydration: true,
        "vitamin-boost": true,
        immunity: true,
        consultation: true,
      },
    },
    physiotherapy: {
      enabled: true,
      practitioners: {
        "sports-injury": true,
        "pain-management": true,
        rehabilitation: true,
        "not-sure": true,
      },
    },
  },
  operatingHours: {
    sunday: { enabled: false, start: "09:00", end: "13:30" },
    monday: { enabled: true, start: "08:30", end: "16:30" },
    tuesday: { enabled: true, start: "08:30", end: "16:30" },
    wednesday: { enabled: true, start: "08:30", end: "16:30" },
    thursday: { enabled: true, start: "08:30", end: "16:30" },
    friday: { enabled: true, start: "08:30", end: "16:30" },
    saturday: { enabled: true, start: "09:00", end: "13:30" },
  },
};

const DAY_INDEX_TO_KEY = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

const normalizeTimeValue = (value: unknown, fallback: string) => {
  if (typeof value !== "string") {
    return fallback;
  }

  const match = value.match(/^(\d{2}):(\d{2})/);
  if (!match) {
    return fallback;
  }

  return `${match[1]}:${match[2]}`;
};

const timeStringToMinutes = (value: string) => {
  const normalized = normalizeTimeValue(value, "");
  if (!normalized) {
    return null;
  }

  const [hours, minutes] = normalized.split(":").map(Number);

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  return hours * 60 + minutes;
};

const isOperatingHoursRangeValid = (
  start: string,
  end: string,
  slotDurationMinutes = 30,
) => {
  const startMinutes = timeStringToMinutes(start);
  const endMinutes = timeStringToMinutes(end);

  if (startMinutes === null || endMinutes === null) {
    return false;
  }

  return endMinutes - startMinutes >= slotDurationMinutes;
};

const getDatePart = (value: string) => String(value || "").slice(0, 10);

const getOperatingDayKey = (date: Date) => DAY_INDEX_TO_KEY[date.getDay()];

const getAvailableTimeSlots = (dayConfig: any, slotDurationMinutes = 30) => {
  if (
    !dayConfig?.enabled ||
    !isOperatingHoursRangeValid(
      dayConfig.start,
      dayConfig.end,
      slotDurationMinutes,
    )
  ) {
    return [];
  }

  const startMinutes = timeStringToMinutes(dayConfig.start);
  const endMinutes = timeStringToMinutes(dayConfig.end);

  if (startMinutes === null || endMinutes === null) {
    return [];
  }

  const slots = [];

  for (
    let current = startMinutes;
    current + slotDurationMinutes <= endMinutes;
    current += slotDurationMinutes
  ) {
    const hours = String(Math.floor(current / 60)).padStart(2, "0");
    const minutes = String(current % 60).padStart(2, "0");
    slots.push(`${hours}:${minutes}`);
  }

  return slots;
};

const isTimeWithinOperatingHours = (config: any, date: Date, time: string) => {
  const dayKey = getOperatingDayKey(date);
  return getAvailableTimeSlots(config.operatingHours?.[dayKey]).includes(
    normalizeTimeValue(time, ""),
  );
};

const normalizePhoneValue = (value: string) =>
  String(value || "")
    .replace(/\s+/g, "")
    .replace(/[^\d+]/g, "");

const normalizeTextValue = (value: string) =>
  String(value || "")
    .trim()
    .toLowerCase();

const sanitizeFileNamePart = (value: string, fallback = "file") => {
  const cleaned = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);

  return cleaned || fallback;
};

const toPdfValue = (value: unknown) => {
  if (value === null || value === undefined) {
    return "N/A";
  }

  if (Array.isArray(value)) {
    return value.length > 0 ? JSON.stringify(value) : "N/A";
  }

  const text = String(value).trim();
  return text || "N/A";
};

const hexToRgb = (hex: string) => {
  const normalized = String(hex || "")
    .replace("#", "")
    .trim();

  if (normalized.length !== 6) {
    return rgb(0, 0, 0);
  }

  const red = parseInt(normalized.slice(0, 2), 16) / 255;
  const green = parseInt(normalized.slice(2, 4), 16) / 255;
  const blue = parseInt(normalized.slice(4, 6), 16) / 255;
  return rgb(red, green, blue);
};

const decodeBase64ToBytes = (base64Value: string) => {
  const decoded = atob(base64Value);
  return Uint8Array.from(decoded, (character) => character.charCodeAt(0));
};

const wrapTextByWidth = (
  text: string,
  font: any,
  fontSize: number,
  maxWidth: number,
) => {
  const raw = String(text || "")
    .replace(/\s+/g, " ")
    .trim();
  if (!raw) {
    return [""];
  }

  const words = raw.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const candidateLine = currentLine ? `${currentLine} ${word}` : word;
    const candidateWidth = font.widthOfTextAtSize(candidateLine, fontSize);

    if (candidateWidth <= maxWidth) {
      currentLine = candidateLine;
      continue;
    }

    if (currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      lines.push(word);
      currentLine = "";
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.length > 0 ? lines : [raw];
};

const generateMedicalIntakePdf = async (
  formData: any,
  booking: any,
  brandingConfig: any,
) => {
  const pdfDoc = await PDFDocument.create();
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const branding = resolveBrandingConfig(brandingConfig);

  const BRAND_PRIMARY = hexToRgb(branding.primaryHex);
  const BRAND_PRIMARY_LIGHT = hexToRgb(branding.primaryLightHex);
  const BRAND_TEXT = hexToRgb(branding.textHex);
  const BRAND_MUTED = hexToRgb(branding.mutedHex);

  let logoImage: any = null;
  try {
    const logoBytes = decodeBase64ToBytes(branding.logoBase64);
    logoImage = await pdfDoc.embedPng(logoBytes);
  } catch (_logoError) {
    logoImage = null;
  }

  const PAGE_WIDTH = 595.28;
  const PAGE_HEIGHT = 841.89;
  const MARGIN_X = 40;
  const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2;
  const HEADER_HEIGHT = 112;
  const FOOTER_HEIGHT = 36;
  const SECTION_PADDING_X = 14;
  const SECTION_PADDING_Y = 10;
  const ROW_LINE_HEIGHT = 13;

  const generatedAt = new Date();
  const generatedAtLabel = generatedAt.toLocaleString("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  const fullName =
    `${formData?.patient_first_name || booking?.first_name || ""} ${formData?.patient_surname || booking?.last_name || ""}`.trim() ||
    "Unknown Patient";

  let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - HEADER_HEIGHT - 22;

  const drawHeader = (targetPage: any, continuation = false) => {
    targetPage.drawRectangle({
      x: 0,
      y: PAGE_HEIGHT - HEADER_HEIGHT,
      width: PAGE_WIDTH,
      height: HEADER_HEIGHT,
      color: BRAND_PRIMARY,
    });

    if (logoImage) {
      const logoScale = Math.min(130 / logoImage.width, 48 / logoImage.height);
      const logoWidth = logoImage.width * logoScale;
      const logoHeight = logoImage.height * logoScale;
      const logoX = MARGIN_X;
      const logoY = PAGE_HEIGHT - 18 - logoHeight;

      targetPage.drawRectangle({
        x: logoX - 6,
        y: logoY - 5,
        width: logoWidth + 12,
        height: logoHeight + 10,
        color: rgb(1, 1, 1),
      });

      targetPage.drawImage(logoImage, {
        x: logoX,
        y: logoY,
        width: logoWidth,
        height: logoHeight,
      });
    }

    targetPage.drawText(branding.institutionName, {
      x: MARGIN_X + 150,
      y: PAGE_HEIGHT - 42,
      size: 19,
      font: boldFont,
      color: rgb(1, 1, 1),
    });

    targetPage.drawText(
      continuation ? "Medical Intake Form (Continued)" : "Medical Intake Form",
      {
        x: MARGIN_X + 150,
        y: PAGE_HEIGHT - 63,
        size: 12,
        font: regularFont,
        color: rgb(1, 1, 1),
      },
    );

    targetPage.drawText(`${branding.website} | ${branding.phone}`, {
      x: MARGIN_X + 150,
      y: PAGE_HEIGHT - 79,
      size: 9,
      font: regularFont,
      color: rgb(1, 1, 1),
    });

    targetPage.drawRectangle({
      x: MARGIN_X,
      y: PAGE_HEIGHT - HEADER_HEIGHT - 8,
      width: CONTENT_WIDTH,
      height: 26,
      color: BRAND_PRIMARY_LIGHT,
    });

    targetPage.drawText(`Patient: ${fullName}`, {
      x: MARGIN_X + 10,
      y: PAGE_HEIGHT - HEADER_HEIGHT + 1,
      size: 9,
      font: boldFont,
      color: BRAND_TEXT,
    });

    targetPage.drawText(`Generated: ${generatedAtLabel}`, {
      x: MARGIN_X + CONTENT_WIDTH - 170,
      y: PAGE_HEIGHT - HEADER_HEIGHT + 1,
      size: 9,
      font: regularFont,
      color: BRAND_TEXT,
    });
  };

  const addPage = () => {
    page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    drawHeader(page, true);
    y = PAGE_HEIGHT - HEADER_HEIGHT - 22;
  };

  const getRowHeight = (label: string, value: unknown) => {
    const lineCount = wrapTextByWidth(
      `${toPdfValue(value)}`,
      regularFont,
      10,
      CONTENT_WIDTH - SECTION_PADDING_X * 2 - 130,
    ).length;
    return Math.max(1, lineCount) * ROW_LINE_HEIGHT + 2;
  };

  const drawSection = (
    title: string,
    rows: Array<{ label: string; value: unknown }>,
  ) => {
    const rowsHeight = rows.reduce(
      (sum, row) => sum + getRowHeight(row.label, row.value),
      0,
    );
    const sectionHeight =
      SECTION_PADDING_Y * 2 +
      18 +
      rowsHeight +
      Math.max(0, rows.length - 1) * 3;

    if (y - sectionHeight < FOOTER_HEIGHT + 14) {
      addPage();
    }

    const sectionY = y - sectionHeight;
    page.drawRectangle({
      x: MARGIN_X,
      y: sectionY,
      width: CONTENT_WIDTH,
      height: sectionHeight,
      color: rgb(0.99, 0.99, 0.99),
      borderColor: BRAND_PRIMARY_LIGHT,
      borderWidth: 1,
    });

    page.drawText(title, {
      x: MARGIN_X + SECTION_PADDING_X,
      y: y - SECTION_PADDING_Y - 4,
      size: 11,
      font: boldFont,
      color: BRAND_PRIMARY,
    });

    let rowY = y - SECTION_PADDING_Y - 20;
    rows.forEach((row) => {
      const valueLines = wrapTextByWidth(
        `${toPdfValue(row.value)}`,
        regularFont,
        10,
        CONTENT_WIDTH - SECTION_PADDING_X * 2 - 130,
      );

      page.drawText(`${row.label}:`, {
        x: MARGIN_X + SECTION_PADDING_X,
        y: rowY,
        size: 9,
        font: boldFont,
        color: BRAND_TEXT,
      });

      valueLines.forEach((line, index) => {
        page.drawText(line, {
          x: MARGIN_X + SECTION_PADDING_X + 130,
          y: rowY - index * ROW_LINE_HEIGHT,
          size: 10,
          font: regularFont,
          color: BRAND_TEXT,
        });
      });

      rowY -= Math.max(1, valueLines.length) * ROW_LINE_HEIGHT + 3;
    });

    y = sectionY - 12;
  };

  const familyDetails = Array.isArray(formData?.family_details)
    ? formData.family_details
    : [];
  const formattedFamilyDetails =
    familyDetails.length === 0
      ? "No family details provided"
      : familyDetails
          .map(
            (detail: any, index: number) =>
              `${index + 1}. ${toPdfValue(detail?.name)} | ${toPdfValue(detail?.relationship)} | Age: ${toPdfValue(detail?.age)} | ${toPdfValue(detail?.health_status)}`,
          )
          .join("\n");

  drawHeader(page);

  drawSection("Patient Details", [
    {
      label: "Full Name",
      value:
        `${formData?.patient_first_name || booking?.first_name || ""} ${formData?.patient_surname || booking?.last_name || ""}`.trim(),
    },
    {
      label: "ID Number",
      value: formData?.patient_id_number || booking?.id_number,
    },
    { label: "Date of Birth", value: formData?.patient_date_of_birth },
    { label: "Phone", value: formData?.patient_cell || booking?.phone },
    { label: "Email", value: formData?.patient_email || booking?.email },
    { label: "Address", value: formData?.patient_address },
  ]);

  drawSection("Responsible Person", [
    {
      label: "Name",
      value:
        `${formData?.responsible_first_name || ""} ${formData?.responsible_surname || ""}`.trim(),
    },
    { label: "Relationship", value: formData?.responsible_relationship },
    { label: "Phone", value: formData?.responsible_cell },
  ]);

  drawSection("Medical Aid", [
    {
      label: "Medical Aid Name",
      value: formData?.medical_aid_name || booking?.medical_aid,
    },
    {
      label: "Medical Aid Number",
      value: formData?.medical_aid_number || booking?.medical_aid_number,
    },
    { label: "Account Number", value: formData?.account_number },
  ]);

  drawSection("Emergency Contact", [
    { label: "Name", value: formData?.nearest_name },
    { label: "Relationship", value: formData?.nearest_relationship },
    { label: "Phone", value: formData?.nearest_cell },
    { label: "Address", value: formData?.nearest_address },
  ]);

  drawSection("Referral and Family Details", [
    { label: "Referred By", value: formData?.referred_by_name },
    { label: "Family Details", value: formattedFamilyDetails },
  ]);

  drawSection("Signatures and Consent", [
    { label: "Patient Signature", value: formData?.patient_signature },
    { label: "Witness Signature", value: formData?.witness_signature },
    { label: "Date Signed", value: formData?.signature_date },
    {
      label: "Booking Reference",
      value: booking?.id || formData?.booking_id,
    },
  ]);

  const allPages = pdfDoc.getPages();
  allPages.forEach((targetPage, index) => {
    targetPage.drawLine({
      start: { x: MARGIN_X, y: FOOTER_HEIGHT },
      end: { x: PAGE_WIDTH - MARGIN_X, y: FOOTER_HEIGHT },
      thickness: 0.8,
      color: BRAND_PRIMARY_LIGHT,
    });

    targetPage.drawText(branding.location, {
      x: MARGIN_X,
      y: 24,
      size: 8,
      font: regularFont,
      color: BRAND_MUTED,
    });

    targetPage.drawText(
      `Medical Intake PDF | ${branding.website} | Page ${index + 1}/${allPages.length}`,
      {
        x: MARGIN_X,
        y: 12,
        size: 8,
        font: regularFont,
        color: BRAND_MUTED,
      },
    );
  });

  return await pdfDoc.save();
};

const ensurePatientExistsForBooking = async (supabase: any, booking: any) => {
  const bookingIdNumber = String(booking.id_number || "").trim();
  const bookingPhone = normalizePhoneValue(booking.phone || "");
  const bookingFirstName = normalizeTextValue(booking.first_name || "");
  const bookingLastName = normalizeTextValue(booking.last_name || "");
  let existingPatient: { id: string } | null = null;

  if (bookingIdNumber) {
    const { data: idMatch, error: idError } = await supabase
      .from("patients")
      .select("id")
      .eq("id_number", bookingIdNumber)
      .maybeSingle();

    if (idError) {
      console.error("Failed to check patient by ID number:", idError);
    }

    if (idMatch) {
      existingPatient = idMatch;
    }
  }

  if (!existingPatient) {
    const { data: nameMatchedPatients, error: nameError } = await supabase
      .from("patients")
      .select("id, first_name, last_name, phone")
      .ilike("first_name", booking.first_name || "")
      .ilike("last_name", booking.last_name || "")
      .limit(100);

    if (nameError) {
      console.error("Failed to check patient by full name:", nameError);
    }

    const matchedByNameAndPhone = (nameMatchedPatients || []).find(
      (patient: any) =>
        normalizePhoneValue(patient.phone || "") === bookingPhone &&
        normalizeTextValue(patient.first_name || "") === bookingFirstName &&
        normalizeTextValue(patient.last_name || "") === bookingLastName,
    );

    if (matchedByNameAndPhone) {
      existingPatient = { id: matchedByNameAndPhone.id };
    }
  }

  if (!existingPatient) {
    const { error: insertError } = await supabase.from("patients").insert({
      first_name: booking.first_name,
      last_name: booking.last_name,
      email: booking.email || null,
      phone: booking.phone,
      id_number: booking.id_number || null,
      medical_aid: booking.medical_aid || null,
      medical_aid_number: booking.medical_aid_number || null,
      last_visit: new Date().toISOString(),
    });

    if (insertError) {
      throw insertError;
    }

    return;
  }

  const { error: updateError } = await supabase
    .from("patients")
    .update({
      email: booking.email || null,
      medical_aid: booking.medical_aid || null,
      medical_aid_number: booking.medical_aid_number || null,
      last_visit: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", existingPatient.id);

  if (updateError) {
    throw updateError;
  }
};

const isSameClientBooking = (candidate: any, incoming: any) => {
  const candidateId = String(candidate?.id_number || "").trim();
  const incomingId = String(
    incoming?.idNumber || incoming?.id_number || "",
  ).trim();

  if (incomingId && candidateId && candidateId === incomingId) {
    return true;
  }

  const incomingPhone = normalizePhoneValue(incoming?.phone || "");
  const candidatePhone = normalizePhoneValue(candidate?.phone || "");
  const incomingFirstName = normalizeTextValue(
    incoming?.firstName || incoming?.first_name || "",
  );
  const incomingLastName = normalizeTextValue(
    incoming?.lastName || incoming?.last_name || "",
  );
  const candidateFirstName = normalizeTextValue(candidate?.first_name || "");
  const candidateLastName = normalizeTextValue(candidate?.last_name || "");

  return (
    incomingPhone &&
    candidatePhone &&
    incomingPhone === candidatePhone &&
    incomingFirstName &&
    incomingLastName &&
    incomingFirstName === candidateFirstName &&
    incomingLastName === candidateLastName
  );
};

const normalizeAvailabilityConfig = (config: any) => {
  const normalized = JSON.parse(JSON.stringify(DEFAULT_AVAILABILITY_CONFIG));

  if (config?.services && typeof config.services === "object") {
    for (const [serviceId, incomingServiceRaw] of Object.entries(
      config.services,
    )) {
      const incomingService =
        incomingServiceRaw && typeof incomingServiceRaw === "object"
          ? (incomingServiceRaw as Record<string, any>)
          : {};

      if (!normalized.services[serviceId]) {
        normalized.services[serviceId] = {
          enabled: true,
          practitioners: {},
        };
      }

      if (typeof incomingService.enabled === "boolean") {
        normalized.services[serviceId].enabled = incomingService.enabled;
      }

      const incomingPractitioners =
        incomingService.practitioners &&
        typeof incomingService.practitioners === "object"
          ? incomingService.practitioners
          : {};

      for (const [practitionerId, practitionerEnabled] of Object.entries(
        incomingPractitioners,
      )) {
        if (typeof practitionerEnabled === "boolean") {
          normalized.services[serviceId].practitioners[practitionerId] =
            practitionerEnabled;
        }
      }
    }
  }

  for (const [dayKey, dayConfig] of Object.entries(normalized.operatingHours)) {
    const incomingDay = config?.operatingHours?.[dayKey];

    if (typeof incomingDay?.enabled === "boolean") {
      dayConfig.enabled = incomingDay.enabled;
    }

    dayConfig.start = normalizeTimeValue(incomingDay?.start, dayConfig.start);
    dayConfig.end = normalizeTimeValue(incomingDay?.end, dayConfig.end);
  }

  return normalized;
};

const fetchAvailabilityConfigFromDb = async (supabase: any) => {
  const [servicesResult, practitionersResult, operatingHoursResult] =
    await Promise.all([
      supabase.from("service_availability").select("service_id, enabled"),
      supabase
        .from("practitioner_availability")
        .select("service_id, practitioner_id, enabled"),
      supabase
        .from("operating_hours")
        .select("day_of_week, enabled, start_time, end_time"),
    ]);

  const config = {
    services: {} as Record<
      string,
      { enabled: boolean; practitioners: Record<string, boolean> }
    >,
    operatingHours: JSON.parse(
      JSON.stringify(DEFAULT_AVAILABILITY_CONFIG.operatingHours),
    ),
  };

  for (const [serviceId, serviceConfig] of Object.entries(
    DEFAULT_AVAILABILITY_CONFIG.services,
  )) {
    config.services[serviceId] = {
      enabled: serviceConfig.enabled,
      practitioners: { ...serviceConfig.practitioners },
    };
  }

  if (!servicesResult.error) {
    for (const service of servicesResult.data || []) {
      const serviceId = normalizeServiceTypeValue(service.service_id);
      if (!serviceId) continue;

      if (!config.services[serviceId]) {
        config.services[serviceId] = {
          enabled: Boolean(service.enabled),
          practitioners: {},
        };
      } else {
        config.services[serviceId].enabled = Boolean(service.enabled);
      }
    }
  }

  if (!practitionersResult.error) {
    for (const practitioner of practitionersResult.data || []) {
      const serviceId = normalizeServiceTypeValue(practitioner.service_id);
      const practitionerId = String(practitioner.practitioner_id || "").trim();
      if (!serviceId || !practitionerId) continue;

      if (!config.services[serviceId]) {
        config.services[serviceId] = {
          enabled: true,
          practitioners: {},
        };
      }

      config.services[serviceId].practitioners[practitionerId] = Boolean(
        practitioner.enabled,
      );
    }
  }

  if (!operatingHoursResult.error) {
    for (const row of operatingHoursResult.data || []) {
      const dayKey = DAY_INDEX_TO_KEY[row.day_of_week];
      if (dayKey && config.operatingHours[dayKey]) {
        config.operatingHours[dayKey] = {
          enabled: row.enabled,
          start: normalizeTimeValue(
            row.start_time,
            config.operatingHours[dayKey].start,
          ),
          end: normalizeTimeValue(
            row.end_time,
            config.operatingHours[dayKey].end,
          ),
        };
      }
    }
  }

  return normalizeAvailabilityConfig(config);
};

const fetchServiceCatalogFromDb = async (supabase: any) => {
  const [serviceTypesResult, serviceAvailabilityResult, practitionerResult] =
    await Promise.all([
      getSupportedServiceTypes(supabase),
      supabase.from("service_availability").select("service_id"),
      supabase
        .from("practitioner_availability")
        .select("service_id, practitioner_id"),
    ]);

  const serviceLabelById = new Map<string, string>();

  for (const row of serviceTypesResult || []) {
    const serviceId = normalizeServiceTypeValue(row?.service_type);
    if (!serviceId) continue;
    serviceLabelById.set(
      serviceId,
      String(row?.label || "").trim() || formatServiceTypeLabel(serviceId),
    );
  }

  for (const row of serviceAvailabilityResult.data || []) {
    const serviceId = normalizeServiceTypeValue(row?.service_id);
    if (!serviceId || serviceLabelById.has(serviceId)) continue;
    serviceLabelById.set(serviceId, formatServiceTypeLabel(serviceId));
  }

  const practitionerByService = new Map<string, Set<string>>();
  for (const row of practitionerResult.data || []) {
    const serviceId = normalizeServiceTypeValue(row?.service_id);
    const practitionerId = String(row?.practitioner_id || "").trim();
    if (!serviceId || !practitionerId) continue;

    if (!practitionerByService.has(serviceId)) {
      practitionerByService.set(serviceId, new Set<string>());
    }

    practitionerByService.get(serviceId)?.add(practitionerId);
  }

  const serviceCatalog = Array.from(serviceLabelById.entries())
    .map(([serviceId, serviceLabel]) => ({
      id: serviceId,
      title: serviceLabel,
      practitioners: Array.from(practitionerByService.get(serviceId) || [])
        .sort((a, b) => a.localeCompare(b))
        .map((practitionerId) => ({
          id: practitionerId,
          title: formatPractitionerLabel(practitionerId),
        })),
    }))
    .sort((a, b) => a.title.localeCompare(b.title));

  return serviceCatalog;
};

// Health check endpoint
app.get("/make-server-34100c2d/health", (c) => {
  return c.json({ status: "ok" });
});

app.get("/make-server-34100c2d/availability", async (c) => {
  try {
    const supabase = getSupabaseClient();
    return c.json({
      success: true,
      config: await fetchAvailabilityConfigFromDb(supabase),
    });
  } catch (error) {
    console.error("Availability fetch exception:", error);
    return c.json({ success: true, config: DEFAULT_AVAILABILITY_CONFIG });
  }
});

app.get("/make-server-34100c2d/service-types", async (c) => {
  try {
    const supabase = getSupabaseClient();
    const serviceTypes = await getSupportedServiceTypes(supabase);
    return c.json({ success: true, serviceTypes });
  } catch (error) {
    console.error("Service type fetch exception:", error);
    return c.json({ error: "Failed to fetch service types" }, 500);
  }
});

app.get("/make-server-34100c2d/service-catalog", async (c) => {
  try {
    const supabase = getSupabaseClient();
    const serviceCatalog = await fetchServiceCatalogFromDb(supabase);
    return c.json({ success: true, services: serviceCatalog });
  } catch (error) {
    console.error("Service catalog fetch exception:", error);
    return c.json({ error: "Failed to fetch service catalog" }, 500);
  }
});

app.post(
  "/make-server-34100c2d/service-types",
  requireAuth,
  requireSuperAdmin,
  async (c) => {
    try {
      const { serviceType, label } = await c.req.json();
      const normalizedServiceType = normalizeServiceTypeValue(serviceType);
      const normalizedLabel =
        String(label || "").trim() ||
        formatServiceTypeLabel(normalizedServiceType);

      if (!normalizedServiceType) {
        return c.json({ error: "serviceType is required" }, 400);
      }

      const supabase = getSupabaseClient();
      const { error: insertError } = await supabase
        .from("supported_service_types")
        .upsert(
          {
            service_type: normalizedServiceType,
            label: normalizedLabel,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "service_type" },
        );

      if (insertError) {
        throw insertError;
      }

      const { error: availabilityError } = await supabase
        .from("service_availability")
        .upsert(
          {
            service_id: normalizedServiceType,
            enabled: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "service_id" },
        );

      if (availabilityError) {
        throw availabilityError;
      }

      const { error: practitionerError } = await supabase
        .from("practitioner_availability")
        .upsert(
          {
            service_id: normalizedServiceType,
            practitioner_id: "not-sure",
            enabled: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "service_id,practitioner_id" },
        );

      if (practitionerError) {
        throw practitionerError;
      }

      return c.json({
        success: true,
        serviceType: {
          service_type: normalizedServiceType,
          label: normalizedLabel,
        },
      });
    } catch (error) {
      console.error("Service type create error:", error);
      return c.json({ error: "Failed to create service type" }, 500);
    }
  },
);

app.put(
  "/make-server-34100c2d/availability",
  requireAuth,
  requirePermission("settings.availability"),
  async (c) => {
    try {
      const { config } = await c.req.json();
      const normalizedConfig = normalizeAvailabilityConfig(config);

      const supabase = getSupabaseClient();
      const serviceRows = Object.entries(normalizedConfig.services).map(
        ([serviceId, serviceConfig]: any) => ({
          service_id: serviceId,
          enabled: serviceConfig.enabled,
        }),
      );

      const practitionerRows = Object.entries(
        normalizedConfig.services,
      ).flatMap(([serviceId, serviceConfig]: any) =>
        Object.entries(serviceConfig.practitioners).map(
          ([practitionerId, enabled]) => ({
            service_id: serviceId,
            practitioner_id: practitionerId,
            enabled,
          }),
        ),
      );

      const operatingHoursRows = Object.entries(
        normalizedConfig.operatingHours,
      ).map(([dayKey, dayConfig]: any) => ({
        day_of_week: DAY_INDEX_TO_KEY.indexOf(dayKey),
        enabled: dayConfig.enabled,
        start_time: dayConfig.start,
        end_time: dayConfig.end,
      }));

      const { error: servicesError } = await supabase
        .from("service_availability")
        .upsert(serviceRows, { onConflict: "service_id" });

      if (servicesError) {
        throw servicesError;
      }

      const { error: practitionersError } = await supabase
        .from("practitioner_availability")
        .upsert(practitionerRows, {
          onConflict: "service_id,practitioner_id",
        });

      if (practitionersError) {
        throw practitionersError;
      }

      const { error: operatingHoursError } = await supabase
        .from("operating_hours")
        .upsert(operatingHoursRows, { onConflict: "day_of_week" });

      if (operatingHoursError) {
        throw operatingHoursError;
      }

      return c.json({ success: true, config: normalizedConfig });
    } catch (error) {
      console.error("Availability update error:", error);
      return c.json(
        { error: "Failed to update availability: " + error.message },
        500,
      );
    }
  },
);

// Admin login endpoint
app.post("/make-server-34100c2d/auth/login", async (c) => {
  console.log("=== LOGIN ATTEMPT ===");
  try {
    const { username, password } = await c.req.json();
    console.log("Username:", username);
    console.log("Password length:", password?.length);

    const supabase = getSupabaseClient();
    console.log("Supabase client created");

    // First check if table exists by trying to query it
    const { data: testQuery, error: testError } = await supabase
      .from("admin_users")
      .select("count");

    if (testError) {
      console.error("❌ Table check error:", testError);
      return c.json(
        {
          success: false,
          error: "Database table error: " + testError.message,
          hint: "Please run the SQL migration first",
        },
        500,
      );
    }

    console.log("✅ Table exists, checking credentials...");

    const { data, error } = await supabase
      .from("admin_users")
      .select("*")
      .eq("username", username)
      .eq("password_hash", password)
      .single();

    console.log("Query result - Data:", data ? "Found" : "Not found");
    console.log("Query result - Error:", error);

    if (error || !data) {
      console.error("❌ Login failed - Invalid credentials");
      console.error("Error details:", error);

      // Check if user exists with different password
      const { data: userCheck } = await supabase
        .from("admin_users")
        .select("username")
        .eq("username", username)
        .single();

      if (userCheck) {
        console.log("User exists but password wrong");
        return c.json({ success: false, error: "Invalid password" }, 401);
      } else {
        console.log("User does not exist");
        return c.json({ success: false, error: "User not found" }, 401);
      }
    }

    console.log("✅ Login successful for:", username);

    // Update last login
    await supabase
      .from("admin_users")
      .update({ last_login: new Date().toISOString() })
      .eq("id", data.id);

    // Log activity
    const roleDefinition = await getRoleDefinition(supabase, data.role);

    await supabase.from("activity_log").insert({
      type: "login",
      user_name: username,
      user_role: roleDefinition.role,
      description: "Admin logged in successfully",
    });

    console.log("✅ Returning success response");

    return c.json({
      success: true,
      user: {
        id: data.id,
        username: data.username,
        role: roleDefinition.role,
        roleLabel: roleDefinition.roleLabel,
        permissions: mergeUserPermissions(
          roleDefinition.permissions,
          data.permissions_override,
        ),
      },
      token: btoa(`${username}:${password}`),
    });
  } catch (error) {
    console.error("❌ Login error:", error);
    return c.json(
      { success: false, error: "Login failed: " + error.message },
      500,
    );
  }
});

// Get all bookings
app.get("/make-server-34100c2d/bookings", requireAuth, async (c) => {
  try {
    const supabase = getSupabaseClient();
    await releaseExpiredUncheckedInBookings(supabase);

    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return c.json({ success: true, bookings: data || [] });
  } catch (error) {
    console.error("Get bookings error:", error);
    return c.json({ error: "Failed to fetch bookings: " + error.message }, 500);
  }
});

// Create booking
app.post("/make-server-34100c2d/bookings", async (c) => {
  try {
    const bookingData = await c.req.json();

    const supabase = getSupabaseClient();
    const availabilityConfig = await fetchAvailabilityConfigFromDb(supabase);
    const bookingDatePart = getDatePart(bookingData.date);
    const bookingTime = normalizeTimeValue(bookingData.time, "");
    const bookingSource = String(bookingData.source || "website");
    const isWalkInSource = bookingSource.startsWith("walk-in");
    const shouldConfirmImmediately =
      isWalkInSource &&
      (bookingData.confirmedByAdmin === true ||
        bookingData.confirmed_by_admin === true);

    if (!bookingDatePart || !bookingTime) {
      return c.json({ error: "Invalid booking date or time" }, 400);
    }

    const bookingDate = new Date(`${bookingDatePart}T12:00:00`);

    if (!availabilityConfig.services?.[bookingData.serviceType]?.enabled) {
      return c.json({ error: "That service is currently unavailable" }, 400);
    }

    if (
      availabilityConfig.services?.[bookingData.serviceType]?.practitioners?.[
        bookingData.practitionerType
      ] !== true
    ) {
      return c.json(
        { error: "That practitioner is currently unavailable" },
        400,
      );
    }

    if (
      !isTimeWithinOperatingHours(availabilityConfig, bookingDate, bookingTime)
    ) {
      return c.json({ error: "That time is outside operating hours" }, 400);
    }

    if (shouldConfirmImmediately) {
      const { data: slotPendingBookings, error: slotPendingBookingsError } =
        await supabase
          .from("bookings")
          .select("id")
          .gte("date", `${bookingDatePart}T00:00:00`)
          .lt("date", `${bookingDatePart}T23:59:59`)
          .eq("time", bookingTime)
          .eq("status", "pending")
          .limit(1);

      if (slotPendingBookingsError) {
        throw slotPendingBookingsError;
      }

      if ((slotPendingBookings || []).length > 0) {
        return c.json(
          {
            error:
              "This slot already has a pending booking, so this walk-in cannot be auto-confirmed.",
            code: "SLOT_HAS_PENDING_BOOKING",
          },
          409,
        );
      }
    }

    const allowAdditionalSession =
      bookingData.allowAdditionalSession === true ||
      bookingData.allow_additional_session === true;
    const cancelPreviousSameDay =
      bookingData.cancelPreviousSameDay === true ||
      bookingData.cancel_previous_same_day === true;

    const { data: sameDayCandidates, error: sameDayCandidatesError } =
      await supabase
        .from("bookings")
        .select(
          "id, first_name, last_name, phone, id_number, date, time, status, service_type",
        )
        .gte("date", `${bookingDatePart}T00:00:00`)
        .lt("date", `${bookingDatePart}T23:59:59`)
        .in("status", ["pending", "confirmed", "completed"])
        .order("time", { ascending: true });

    if (sameDayCandidatesError) {
      throw sameDayCandidatesError;
    }

    const sameClientSameDayBookings = (sameDayCandidates || []).filter(
      (candidate: any) => isSameClientBooking(candidate, bookingData),
    );

    const sameClientSameSlotBookings = sameClientSameDayBookings.filter(
      (candidate: any) =>
        normalizeTimeValue(candidate.time, "") === bookingTime,
    );

    if (sameClientSameSlotBookings.length > 0) {
      return c.json(
        {
          error: "This client already has a booking for that slot",
          code: "CLIENT_ALREADY_BOOKED_SAME_SLOT",
          existingBookings: sameClientSameSlotBookings,
        },
        409,
      );
    }

    if (
      sameClientSameDayBookings.length > 0 &&
      !allowAdditionalSession &&
      !cancelPreviousSameDay
    ) {
      return c.json(
        {
          error:
            "This client already has another booking on this day. Choose whether to cancel previous slot(s) or keep both sessions.",
          code: "CLIENT_HAS_OTHER_SLOT_SAME_DAY",
          existingBookings: sameClientSameDayBookings,
        },
        409,
      );
    }

    if (cancelPreviousSameDay && sameClientSameDayBookings.length > 0) {
      const cancellableBookingIds = sameClientSameDayBookings
        .filter((candidate: any) =>
          ["pending", "confirmed"].includes(String(candidate.status || "")),
        )
        .map((candidate: any) => candidate.id)
        .filter(Boolean);

      if (cancellableBookingIds.length > 0) {
        const { error: cancelError } = await supabase
          .from("bookings")
          .update({
            status: "cancelled",
            cancellation_reason:
              "Cancelled to allow replacement booking on the same day",
            cancelled_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .in("id", cancellableBookingIds);

        if (cancelError) {
          throw cancelError;
        }
      }
    }

    const createdAtValue = bookingData.createdAt || bookingData.created_at;
    let createdAtIso: string | null = null;

    if (createdAtValue) {
      const parsedCreatedAt = new Date(createdAtValue);
      if (Number.isNaN(parsedCreatedAt.getTime())) {
        return c.json({ error: "Invalid booking created timestamp" }, 400);
      }
      createdAtIso = parsedCreatedAt.toISOString();
    }

    let assignedDoctorId: number | null = null;
    let assignedDoctorUsername: string | null = null;
    const requestedDoctorIdRaw =
      bookingData.assignedDoctorId || bookingData.assigned_doctor_id;
    const requestedDoctorId = requestedDoctorIdRaw
      ? Number(requestedDoctorIdRaw)
      : null;

    if (
      requestedDoctorId !== null &&
      (!Number.isInteger(requestedDoctorId) || requestedDoctorId <= 0)
    ) {
      return c.json({ error: "Invalid doctor selected" }, 400);
    }

    if (shouldConfirmImmediately) {
      const eligibleDoctors = await getEligibleDoctorsForServiceAndSlot(
        supabase,
        {
          serviceType: String(bookingData.serviceType || ""),
          bookingDatePart,
          bookingTime,
        },
      );

      if (!eligibleDoctors.length) {
        return c.json(
          {
            error: "No available doctor found for this service and slot.",
            code: "NO_ELIGIBLE_DOCTOR_FOR_SERVICE",
          },
          409,
        );
      }

      if (requestedDoctorId !== null) {
        const selectedDoctor = eligibleDoctors.find(
          (doctor: any) => Number(doctor.id) === requestedDoctorId,
        );

        if (!selectedDoctor) {
          return c.json(
            {
              error:
                "The selected doctor is not available for this service and slot.",
              code: "DOCTOR_NOT_ELIGIBLE_FOR_SERVICE_SLOT",
            },
            409,
          );
        }

        assignedDoctorId = Number(selectedDoctor.id);
        assignedDoctorUsername = String(selectedDoctor.username || "Doctor");
      } else if (eligibleDoctors.length === 1) {
        assignedDoctorId = Number(eligibleDoctors[0].id);
        assignedDoctorUsername = String(
          eligibleDoctors[0].username || "Doctor",
        );
      } else {
        return c.json(
          {
            error:
              "Multiple doctors are available for this service. Please select one.",
            code: "MULTIPLE_DOCTORS_ASSIGN_REQUIRED",
            availableDoctors: eligibleDoctors.map((doctor: any) => ({
              id: Number(doctor.id),
              username: String(doctor.username || "Doctor"),
            })),
          },
          409,
        );
      }
    } else if (requestedDoctorId !== null) {
      const { data: doctor, error: doctorError } = await supabase
        .from("admin_users")
        .select("id, username, role")
        .eq("id", requestedDoctorId)
        .maybeSingle();

      if (doctorError) {
        throw doctorError;
      }

      if (!doctor || normalizeRoleValue(doctor.role) !== "doctor") {
        return c.json({ error: "Doctor not found" }, 404);
      }

      assignedDoctorId = Number(doctor.id);
      assignedDoctorUsername = String(doctor.username || "Doctor");
    }

    // Insert booking
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        service_type: bookingData.serviceType,
        practitioner_type: bookingData.practitionerType,
        date: bookingData.date,
        time: bookingTime,
        reason: bookingData.reason || "",
        first_name: bookingData.firstName,
        last_name: bookingData.lastName,
        email: bookingData.email || "",
        phone: bookingData.phone,
        id_number: bookingData.idNumber || "",
        medical_aid: bookingData.medicalAid || "",
        medical_aid_number: bookingData.medicalAidNumber || "",
        source: bookingSource,
        status: shouldConfirmImmediately ? "confirmed" : "pending",
        confirmed_at: shouldConfirmImmediately
          ? createdAtIso || new Date().toISOString()
          : null,
        assigned_doctor_id: assignedDoctorId,
        assigned_doctor_username: assignedDoctorUsername,
        assigned_at: assignedDoctorId
          ? createdAtIso || new Date().toISOString()
          : null,
        created_at: createdAtIso || undefined,
      })
      .select()
      .single();

    if (bookingError) {
      console.error("Booking insert error:", bookingError);
      throw bookingError;
    }

    // Log activity
    await supabase.from("activity_log").insert({
      type: "booking_created",
      user_name: bookingData.source === "website" ? "Website User" : "Admin",
      description: `New booking created for ${bookingData.firstName} ${bookingData.lastName} via ${bookingData.source || "website"}`,
      booking_id: booking.id,
    });

    await supabase.from("booking_contacts").insert({
      booking_id: booking.id,
      first_name: bookingData.firstName,
      last_name: bookingData.lastName,
      email: bookingData.email || "",
      phone: bookingData.phone,
      id_number: bookingData.idNumber || "",
    });

    await ensurePatientExistsForBooking(supabase, booking);

    return c.json({ success: true, booking, bookingId: booking.id });
  } catch (error) {
    console.error("Create booking error:", error);
    return c.json({ error: "Failed to create booking: " + error.message }, 500);
  }
});

// Check in an online booking from the walk-in desk
app.post("/make-server-34100c2d/bookings/check-in", async (c) => {
  try {
    const { query } = await c.req.json();
    const searchValue = String(query || "").trim();
    const safeSearchValue = searchValue.replace(/[,]/g, " ").trim();

    if (!safeSearchValue) {
      return c.json({ error: "Phone or ID number is required" }, 400);
    }

    const supabase = getSupabaseClient();
    await releaseExpiredUncheckedInBookings(supabase);

    const todayPart = getDatePartFromIso(new Date().toISOString());

    const { data: matches, error } = await supabase
      .from("bookings")
      .select(
        "id, first_name, last_name, date, time, phone, email, id_number, medical_aid, medical_aid_number, source, status, checked_in_at",
      )
      .eq("status", "confirmed")
      .gte("date", `${todayPart}T00:00:00`)
      .lt("date", `${todayPart}T23:59:59`)
      .or(
        `phone.ilike.%${safeSearchValue}%,id_number.ilike.%${safeSearchValue}%`,
      )
      .order("time", { ascending: true });

    if (error) {
      throw error;
    }

    const onlineBookings = (matches || []).filter((booking: any) => {
      const source = String(booking.source || "").toLowerCase();
      return !source.startsWith("walk-in");
    });

    if (!onlineBookings.length) {
      return c.json(
        {
          error:
            "No confirmed online booking found for today with that phone or ID",
        },
        404,
      );
    }

    const now = new Date();
    const selectedBooking =
      onlineBookings.find((booking: any) => !booking.checked_in_at) ||
      onlineBookings[0];
    const appointment = getAppointmentDateTime(
      selectedBooking.date,
      selectedBooking.time,
    );

    if (!appointment) {
      return c.json({ error: "Booking has invalid date/time" }, 400);
    }

    const cutoff = new Date(appointment.getTime() - 15 * 60 * 1000);
    if (!selectedBooking.checked_in_at && now > cutoff) {
      await releaseExpiredUncheckedInBookings(supabase);
      return c.json(
        {
          error:
            "Check-in window missed. This booking has been automatically unbooked.",
        },
        409,
      );
    }

    let checkedInBooking = selectedBooking;

    if (!selectedBooking.checked_in_at) {
      const { data: updatedBooking, error: checkInError } = await supabase
        .from("bookings")
        .update({
          checked_in_at: now.toISOString(),
          checked_in_source: "walk-in-desk",
          updated_at: now.toISOString(),
        })
        .eq("id", selectedBooking.id)
        .select(
          "id, first_name, last_name, date, time, phone, email, id_number, medical_aid, medical_aid_number, checked_in_at",
        )
        .single();

      if (checkInError) {
        throw checkInError;
      }

      checkedInBooking = updatedBooking;

      await supabase.from("activity_log").insert({
        type: "booking_checked_in",
        user_name: "Walk-In Desk",
        user_role: "reception",
        description: `Online booking checked in for ${checkedInBooking.first_name} ${checkedInBooking.last_name}`,
        booking_id: checkedInBooking.id,
      });
    }

    return c.json({ success: true, booking: checkedInBooking });
  } catch (error) {
    console.error("Check-in error:", error);
    return c.json(
      { error: "Failed to check in booking: " + error.message },
      500,
    );
  }
});

// Save medical intake form data
app.post("/make-server-34100c2d/medical-intake", async (c) => {
  try {
    const formData = await c.req.json();
    const bookingId = formData.booking_id;

    if (!bookingId) {
      return c.json({ error: "Booking ID is required" }, 400);
    }

    const supabase = getSupabaseClient();

    // Verify booking exists
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select(
        "id, first_name, last_name, phone, id_number, email, medical_aid, medical_aid_number",
      )
      .eq("id", bookingId)
      .maybeSingle();

    if (bookingError) {
      throw bookingError;
    }

    if (!booking) {
      return c.json({ error: "Booking not found" }, 404);
    }

    // Try to find existing patient by id_number, then strict full-name + phone
    let patientId: string | null = null;
    const idNumber = formData.patient_id_number || booking.id_number;
    const phone = formData.patient_cell || booking.phone;
    const firstName = formData.patient_first_name || booking.first_name;
    const lastName = formData.patient_surname || booking.last_name;

    // Search by id_number first (most reliable)
    if (idNumber) {
      const { data: existingPatient } = await supabase
        .from("patients")
        .select("id")
        .eq("id_number", idNumber)
        .maybeSingle();

      if (existingPatient) {
        patientId = existingPatient.id;
      }
    }

    // If not found, search by strict full-name + phone to avoid collisions on shared numbers
    if (!patientId && phone) {
      const normalizedPhone = normalizePhoneValue(phone || "");
      const normalizedFirstName = normalizeTextValue(firstName || "");
      const normalizedLastName = normalizeTextValue(lastName || "");

      const { data: nameMatchedPatients } = await supabase
        .from("patients")
        .select("id, first_name, last_name, phone")
        .ilike("first_name", firstName || "")
        .ilike("last_name", lastName || "")
        .limit(100);

      const matchedByNameAndPhone = (nameMatchedPatients || []).find(
        (patient: any) =>
          normalizePhoneValue(patient.phone || "") === normalizedPhone &&
          normalizeTextValue(patient.first_name || "") ===
            normalizedFirstName &&
          normalizeTextValue(patient.last_name || "") === normalizedLastName,
      );

      if (matchedByNameAndPhone) {
        patientId = matchedByNameAndPhone.id;
      }
    }

    // If still not found, create new patient record
    if (!patientId) {
      const { data: newPatient, error: insertPatientError } = await supabase
        .from("patients")
        .insert({
          first_name: firstName,
          last_name: lastName,
          phone: phone,
          id_number: idNumber || null,
          email: formData.patient_email || booking.email || null,
          medical_aid: formData.medical_aid_name || booking.medical_aid || null,
          medical_aid_number:
            formData.medical_aid_number || booking.medical_aid_number || null,
          date_of_birth: formData.patient_date_of_birth || null,
          address: formData.patient_address || null,
        })
        .select("id")
        .single();

      if (insertPatientError) {
        throw insertPatientError;
      }

      patientId = newPatient.id;
    }

    // Save medical intake form using canonical fields + full payload backup
    const { data: medicalIntake, error: insertError } = await supabase
      .from("medical_intake")
      .insert({
        patient_id: patientId,
        booking_id: bookingId,
        account_number: formData.account_number || null,
        first_name: firstName || null,
        last_name: lastName || null,
        date_of_birth: formData.patient_date_of_birth || null,
        id_number: idNumber || null,
        phone: phone || null,
        email: formData.patient_email || booking.email || null,
        responsible_name:
          `${formData.responsible_first_name || ""} ${formData.responsible_surname || ""}`.trim() ||
          null,
        responsible_phone: formData.responsible_cell || null,
        medical_aid: formData.medical_aid_name || booking.medical_aid || null,
        medical_aid_number:
          formData.medical_aid_number || booking.medical_aid_number || null,
        emergency_contact_name: formData.nearest_name || null,
        emergency_contact_relationship: formData.nearest_relationship || null,
        emergency_contact_phone: formData.nearest_cell || null,
        emergency_contact_address: formData.nearest_address || null,
        referral_source: formData.referred_by_name || null,
        family_details: Array.isArray(formData.family_details)
          ? formData.family_details
          : [],
        form_payload: formData,
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    const submissionDate = new Date();
    const year = String(submissionDate.getFullYear());
    const month = String(submissionDate.getMonth() + 1).padStart(2, "0");
    const patientNameSlug = sanitizeFileNamePart(
      `${firstName}-${lastName}`,
      "patient",
    );
    const fileName = `medical-intake-${patientNameSlug}-${submissionDate
      .toISOString()
      .slice(0, 10)}.pdf`;
    const filePath = `${patientId}/consent-forms/${year}/${month}/${Date.now()}-${fileName}`;

    const brandingConfig = await getBrandingConfig(supabase);
    const pdfBytes = await generateMedicalIntakePdf(
      formData,
      booking,
      brandingConfig,
    );

    const { error: uploadError } = await supabase.storage
      .from("patient-files")
      .upload(filePath, pdfBytes, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { error: documentError } = await supabase
      .from("patient_documents")
      .insert({
        patient_id: patientId,
        category: "consent-form",
        title: "Medical Intake Form",
        file_name: fileName,
        file_path: filePath,
        mime_type: "application/pdf",
        size_bytes: Number(pdfBytes.length || 0),
        uploaded_by: "Patient Portal",
      });

    if (documentError) {
      throw documentError;
    }

    const { error: submissionRecordError } = await supabase
      .from("medical_form_submissions")
      .insert({
        patient_id: patientId,
        booking_id: bookingId,
        medical_intake_id: medicalIntake.id,
        storage_bucket: "patient-files",
        file_name: fileName,
        file_path: filePath,
        form_payload: formData,
      });

    if (
      submissionRecordError &&
      String((submissionRecordError as any)?.code || "") !== "42P01"
    ) {
      throw submissionRecordError;
    }

    // Log activity
    await supabase.from("activity_log").insert({
      type: "medical_intake_submitted",
      user_name: "Patient Portal",
      user_role: "patient",
      description: `Medical intake form submitted for ${firstName} ${lastName}`,
      booking_id: bookingId,
      patient_id: patientId,
    });

    return c.json({
      success: true,
      medicalIntake,
      intakeDocument: {
        fileName,
        filePath,
        bucket: "patient-files",
      },
    });
  } catch (error) {
    console.error("Medical intake error:", error);
    return c.json(
      { error: "Failed to save medical intake: " + error.message },
      500,
    );
  }
});

// Lookup booking status and previous medical form before filling intake
app.post("/make-server-34100c2d/medical-intake/lookup", async (c) => {
  try {
    const { query } = await c.req.json();
    const searchValue = String(query || "").trim();
    const safeSearchValue = searchValue.replace(/[,]/g, " ").trim();

    if (!safeSearchValue) {
      return c.json({ error: "Phone or ID number is required" }, 400);
    }

    const supabase = getSupabaseClient();

    const { data: matches, error: bookingError } = await supabase
      .from("bookings")
      .select(
        "id, first_name, last_name, date, time, phone, email, id_number, medical_aid, medical_aid_number, status, created_at",
      )
      .in("status", ["confirmed", "completed"])
      .or(
        `phone.ilike.%${safeSearchValue}%,id_number.ilike.%${safeSearchValue}%`,
      )
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(50);

    if (bookingError) {
      throw bookingError;
    }

    if (!matches || matches.length === 0) {
      return c.json({
        success: true,
        canFill: false,
        requiresConfirmation: true,
        message:
          "No confirmed booking found yet. Admin must confirm your booking before you can fill the form.",
      });
    }

    const booking = matches[0];
    const bookingIds = matches.map((record: any) => record.id).filter(Boolean);

    let previousForm: any = null;

    if (bookingIds.length > 0) {
      const { data: bookingLinkedForms, error: bookingLinkedFormsError } =
        await supabase
          .from("medical_intake")
          .select("*")
          .in("booking_id", bookingIds)
          .order("created_at", { ascending: false })
          .limit(1);

      if (bookingLinkedFormsError) {
        throw bookingLinkedFormsError;
      }

      if (bookingLinkedForms && bookingLinkedForms.length > 0) {
        previousForm = bookingLinkedForms[0];
      }
    }

    if (!previousForm) {
      const { data: identifierForms, error: identifierFormsError } =
        await supabase
          .from("medical_intake")
          .select("*")
          .or(
            `phone.eq.${booking.phone || ""},id_number.eq.${booking.id_number || ""}`,
          )
          .order("created_at", { ascending: false })
          .limit(1);

      if (identifierFormsError) {
        throw identifierFormsError;
      }

      if (identifierForms && identifierForms.length > 0) {
        previousForm = identifierForms[0];
      }
    }

    return c.json({
      success: true,
      canFill: true,
      requiresConfirmation: false,
      booking,
      previousForm,
    });
  } catch (error) {
    console.error("Medical intake lookup error:", error);
    return c.json(
      { error: "Failed to lookup booking for medical form: " + error.message },
      500,
    );
  }
});

// Update booking status
app.put("/make-server-34100c2d/bookings/:id", requireAuth, async (c) => {
  try {
    const bookingId = c.req.param("id");
    const updates = await c.req.json();
    const user = c.get("user");
    const supabase = getSupabaseClient();

    const { data: existingBooking, error: existingBookingError } =
      await supabase
        .from("bookings")
        .select("id, date, time, status, assigned_doctor_id")
        .eq("id", bookingId)
        .single();

    if (existingBookingError || !existingBooking) {
      return c.json({ error: "Booking not found" }, 404);
    }

    if (updates?.status === "confirmed") {
      if (!hasPermission(user?.permissions || {}, "bookings.confirm")) {
        return c.json(
          {
            error: "Forbidden",
            detail: "You do not have permission to confirm bookings",
          },
          403,
        );
      }

      const requestedDoctorId = updates?.doctor_id
        ? Number(updates.doctor_id)
        : null;
      delete updates.doctor_id;

      if (!requestedDoctorId) {
        return c.json(
          {
            error: "Doctor selection is required to confirm this booking",
            code: "DOCTOR_SELECTION_REQUIRED",
          },
          400,
        );
      }

      let assignedDoctor: { id: number; username: string } | null = null;

      // Validate the requested doctor is available and not double-booked
      const bookingDatePart = getDatePartFromIso(existingBooking.date);
      const bookingTime = normalizeTimeValue(
        updates?.time || existingBooking.time,
        existingBooking.time,
      );

      const { data: doctorRow } = await supabase
        .from("admin_users")
        .select("id, username, is_available")
        .eq("id", requestedDoctorId)
        .eq("role", "doctor")
        .maybeSingle();

      if (!doctorRow) {
        return c.json({ error: "Doctor not found" }, 404);
      }
      if (!doctorRow.is_available) {
        return c.json(
          { error: "The selected doctor is currently unavailable" },
          409,
        );
      }

      const { data: conflict } = await supabase
        .from("bookings")
        .select("id")
        .gte("date", `${bookingDatePart}T00:00:00`)
        .lt("date", `${bookingDatePart}T23:59:59`)
        .eq("time", bookingTime)
        .eq("assigned_doctor_id", requestedDoctorId)
        .in("status", ["confirmed", "completed"])
        .neq("id", existingBooking.id)
        .limit(1);

      if (conflict && conflict.length > 0) {
        return c.json(
          { error: "The selected doctor already has a booking at this time" },
          409,
        );
      }

      assignedDoctor = { id: doctorRow.id, username: doctorRow.username };

      if (!assignedDoctor) {
        return c.json(
          {
            error: "No doctor available for this slot",
            detail: "Please choose another time or mark a doctor as available",
          },
          409,
        );
      }

      updates.assigned_doctor_id = assignedDoctor.id;
      updates.assigned_doctor_username = assignedDoctor.username;
      updates.assigned_at = new Date().toISOString();
      updates.confirmed_at = new Date().toISOString();
    }

    if (updates?.status === "completed") {
      if (!hasPermission(user?.permissions || {}, "bookings.complete")) {
        return c.json(
          {
            error: "Forbidden",
            detail: "Only users with Doctor role can complete bookings",
          },
          403,
        );
      }

      if (
        normalizeRoleValue(user?.role) === "doctor" &&
        Number(existingBooking.assigned_doctor_id) !== Number(user?.id)
      ) {
        return c.json(
          {
            error: "Forbidden",
            detail: "Doctors can only complete bookings assigned to them",
          },
          403,
        );
      }
    }

    if (updates?.status === "pending") {
      if (!hasPermission(user?.permissions || {}, "bookings.confirm")) {
        return c.json(
          {
            error: "Forbidden",
            detail: "You do not have permission to unconfirm bookings",
          },
          403,
        );
      }

      updates.assigned_doctor_id = null;
      updates.assigned_doctor_username = null;
      updates.assigned_at = null;
      updates.confirmed_at = null;
    }

    // Update booking
    const { data: booking, error } = await supabase
      .from("bookings")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", bookingId)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return c.json({ error: "Booking not found" }, 404);
      }
      throw error;
    }

    if (updates.status === "confirmed" && booking) {
      try {
        await ensurePatientExistsForBooking(supabase, booking);
      } catch (patientSyncError) {
        console.error(
          "Failed to sync patient after booking confirmation:",
          patientSyncError,
        );
      }
    }

    // Log activity
    await supabase.from("activity_log").insert({
      type: "booking_updated",
      user_name: user?.username || "Admin",
      user_role: normalizeRoleValue(user?.role),
      description: `Booking ${bookingId} updated - Status: ${updates.status || "updated"}`,
      booking_id: bookingId,
    });

    return c.json({ success: true, booking });
  } catch (error) {
    console.error("Update booking error:", error);
    return c.json({ error: "Failed to update booking: " + error.message }, 500);
  }
});

// Delete booking
app.delete(
  "/make-server-34100c2d/bookings/:id",
  requireAuth,
  requirePermission("bookings.delete"),
  async (c) => {
    try {
      const bookingId = c.req.param("id");

      const supabase = getSupabaseClient();
      const user = c.get("user");

      // Get booking details before deleting
      const { data: booking } = await supabase
        .from("bookings")
        .select("*")
        .eq("id", bookingId)
        .single();

      if (!booking) {
        return c.json({ error: "Booking not found" }, 404);
      }

      // Delete booking
      const { error } = await supabase
        .from("bookings")
        .delete()
        .eq("id", bookingId);

      if (error) {
        throw error;
      }

      // Log activity
      await supabase.from("activity_log").insert({
        type: "booking_deleted",
        user_name: user?.username || "Admin",
        user_role: normalizeRoleValue(user?.role),
        description: `Booking deleted for ${booking.first_name} ${booking.last_name}`,
        booking_id: bookingId,
      });

      return c.json({ success: true });
    } catch (error) {
      console.error("Delete booking error:", error);
      return c.json(
        { error: "Failed to delete booking: " + error.message },
        500,
      );
    }
  },
);

// User management
app.get(
  "/make-server-34100c2d/roles",
  requireAuth,
  requireSuperAdmin,
  async (c) => {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from("role_definitions")
        .select("role, label, permissions")
        .order("label", { ascending: true });

      if (error) {
        throw error;
      }

      return c.json({
        success: true,
        roles: (data || []).map((roleDefinition) => ({
          role: roleDefinition.role,
          label: roleDefinition.label || roleDefinition.role,
          permissions: sanitizeRolePermissions(roleDefinition.permissions),
        })),
      });
    } catch (error) {
      console.error("Get roles error:", error);
      return c.json({ error: "Failed to fetch roles: " + error.message }, 500);
    }
  },
);

app.get("/make-server-34100c2d/available-doctors", requireAuth, async (c) => {
  try {
    const date = c.req.query("date") || "";
    const time = c.req.query("time") || "";
    const serviceType = String(c.req.query("serviceType") || "").trim();

    if (!date || !time) {
      return c.json({ error: "date and time query params required" }, 400);
    }

    const supabase = getSupabaseClient();
    const bookingDatePart = getDatePartFromIso(date);

    if (serviceType) {
      const eligibleDoctors = await getEligibleDoctorsForServiceAndSlot(
        supabase,
        {
          serviceType,
          bookingDatePart,
          bookingTime: time,
        },
      );

      return c.json({
        success: true,
        doctors: eligibleDoctors.map((doctor: any) => ({
          id: Number(doctor.id),
          username: String(doctor.username || "Doctor"),
        })),
      });
    }

    const { data: doctors, error: doctorsError } = await supabase
      .from("admin_users")
      .select("id, username")
      .eq("role", "doctor")
      .eq("is_available", true)
      .order("username", { ascending: true });

    if (doctorsError) throw doctorsError;

    const { data: conflicts } = await supabase
      .from("bookings")
      .select("assigned_doctor_id")
      .gte("date", `${bookingDatePart}T00:00:00`)
      .lt("date", `${bookingDatePart}T23:59:59`)
      .eq("time", time)
      .in("status", ["confirmed", "completed"])
      .not("assigned_doctor_id", "is", null);

    const busyIds = new Set(
      (conflicts || []).map((b: any) => Number(b.assigned_doctor_id)),
    );
    const available = (doctors || []).filter((d: any) => !busyIds.has(d.id));

    return c.json({ success: true, doctors: available });
  } catch (error) {
    console.error("Available doctors error:", error);
    return c.json({ error: "Failed to fetch available doctors" }, 500);
  }
});

app.get("/make-server-34100c2d/eligible-doctors", async (c) => {
  try {
    const date = String(c.req.query("date") || "").trim();
    const time = String(c.req.query("time") || "").trim();
    const serviceType = String(c.req.query("serviceType") || "").trim();

    if (!date || !time || !serviceType) {
      return c.json(
        { error: "date, time, and serviceType query params are required" },
        400,
      );
    }

    const bookingDatePart = getDatePartFromIso(date);
    const bookingTime = normalizeTimeValue(time, "");

    if (!bookingDatePart || !bookingTime) {
      return c.json({ error: "Invalid date or time" }, 400);
    }

    const supabase = getSupabaseClient();
    const eligibleDoctors = await getEligibleDoctorsForServiceAndSlot(
      supabase,
      {
        serviceType,
        bookingDatePart,
        bookingTime,
      },
    );

    return c.json({
      success: true,
      doctors: eligibleDoctors.map((doctor: any) => ({
        id: Number(doctor.id),
        username: String(doctor.username || "Doctor"),
      })),
    });
  } catch (error) {
    console.error("Eligible doctors error:", error);
    return c.json({ error: "Failed to fetch eligible doctors" }, 500);
  }
});

app.get("/make-server-34100c2d/doctors", requireAuth, async (c) => {
  try {
    const user = c.get("user");
    const isDoctor = normalizeRoleValue(user?.role) === "doctor";
    const canManageUsers = hasPermission(
      user?.permissions || {},
      "users.manage",
    );
    const isAdmin = normalizeRoleValue(user?.role) === "admin";

    if (!isDoctor && !canManageUsers && !isAdmin) {
      return c.json({ error: "Forbidden" }, 403);
    }

    const supabase = getSupabaseClient();
    let query = supabase
      .from("admin_users")
      .select("id, username, role, is_available")
      .eq("role", "doctor")
      .order("username", { ascending: true });

    if (isDoctor) {
      query = query.eq("id", Number(user?.id));
    }

    const { data, error } = await query;
    if (error) {
      throw error;
    }

    const doctorRows = data || [];
    const doctorIds = doctorRows
      .map((doctor: any) => Number(doctor.id))
      .filter((id: number) => Number.isInteger(id));

    let serviceTypeByDoctorId = new Map<number, string[]>();

    if (doctorIds.length > 0) {
      const { data: serviceRows, error: serviceError } = await supabase
        .from("doctor_service_assignments")
        .select("doctor_id, service_type")
        .in("doctor_id", doctorIds);

      if (!serviceError) {
        serviceTypeByDoctorId = (serviceRows || []).reduce(
          (map: Map<number, string[]>, row: any) => {
            const doctorId = Number(row.doctor_id);
            const serviceType = String(row.service_type || "").trim();
            if (!Number.isInteger(doctorId) || !serviceType) {
              return map;
            }

            const current = map.get(doctorId) || [];
            if (!current.includes(serviceType)) {
              current.push(serviceType);
              map.set(doctorId, current);
            }

            return map;
          },
          new Map<number, string[]>(),
        );
      }
    }

    return c.json({
      success: true,
      doctors: doctorRows.map((doctor: any) => ({
        ...doctor,
        serviceTypes: serviceTypeByDoctorId.get(Number(doctor.id)) || [],
      })),
    });
  } catch (error) {
    console.error("Get doctors error:", error);
    return c.json({ error: "Failed to fetch doctors: " + error.message }, 500);
  }
});

app.put(
  "/make-server-34100c2d/doctors/:id/availability",
  requireAuth,
  async (c) => {
    try {
      const doctorId = Number(c.req.param("id"));
      const { isAvailable } = await c.req.json();
      const user = c.get("user");

      if (typeof isAvailable !== "boolean") {
        return c.json({ error: "isAvailable must be a boolean" }, 400);
      }

      const isDoctor = normalizeRoleValue(user?.role) === "doctor";
      const canManageUsers = hasPermission(
        user?.permissions || {},
        "users.manage",
      );
      const isAdmin = normalizeRoleValue(user?.role) === "admin";

      if (isDoctor && Number(user?.id) !== doctorId) {
        return c.json(
          { error: "Doctors can only change their own availability" },
          403,
        );
      }

      if (!isDoctor && !canManageUsers && !isAdmin) {
        return c.json({ error: "Forbidden" }, 403);
      }

      const supabase = getSupabaseClient();
      const { data: doctor, error: doctorError } = await supabase
        .from("admin_users")
        .select("id, username, role")
        .eq("id", doctorId)
        .maybeSingle();

      if (doctorError) {
        throw doctorError;
      }

      if (!doctor || normalizeRoleValue(doctor.role) !== "doctor") {
        return c.json({ error: "Doctor not found" }, 404);
      }

      const { error } = await supabase
        .from("admin_users")
        .update({ is_available: isAvailable })
        .eq("id", doctorId);

      if (error) {
        throw error;
      }

      await supabase.from("activity_log").insert({
        type: "doctor_availability_updated",
        user_name: user?.username || "Admin",
        user_role: normalizeRoleValue(user?.role),
        description: `Doctor ${doctor.username} marked as ${isAvailable ? "available" : "on leave"}`,
      });

      return c.json({ success: true });
    } catch (error) {
      console.error("Update doctor availability error:", error);
      return c.json(
        { error: "Failed to update doctor availability: " + error.message },
        500,
      );
    }
  },
);

app.get(
  "/make-server-34100c2d/users",
  requireAuth,
  requireSuperAdmin,
  async (c) => {
    try {
      const supabase = getSupabaseClient();
      const [
        { data: users, error: usersError },
        { data: roles, error: rolesError },
      ] = await Promise.all([
        supabase
          .from("admin_users")
          .select(
            "id, username, role, created_at, last_login, permissions_override",
          )
          .order("created_at", { ascending: false }),
        supabase.from("role_definitions").select("role, label, permissions"),
      ]);

      if (usersError) {
        throw usersError;
      }

      if (rolesError) {
        throw rolesError;
      }

      const roleLabelByKey = new Map(
        (roles || []).map((roleDefinition) => [
          String(roleDefinition.role || "").toLowerCase(),
          roleDefinition.label || roleDefinition.role,
        ]),
      );
      const roleDefinitionByKey = new Map(
        (roles || []).map((roleDefinition: any) => [
          String(roleDefinition.role || "").toLowerCase(),
          {
            role: String(roleDefinition.role || "").toLowerCase(),
            label: roleDefinition.label || roleDefinition.role,
            permissions: sanitizeRolePermissions(roleDefinition.permissions),
          },
        ]),
      );

      const doctorIds = (users || [])
        .filter((record: any) => normalizeRoleValue(record.role) === "doctor")
        .map((record: any) => Number(record.id))
        .filter((id: number) => Number.isInteger(id));

      let serviceTypeByDoctorId = new Map<number, string[]>();

      if (doctorIds.length > 0) {
        const { data: serviceRows } = await supabase
          .from("doctor_service_assignments")
          .select("doctor_id, service_type")
          .in("doctor_id", doctorIds);

        serviceTypeByDoctorId = (serviceRows || []).reduce(
          (map: Map<number, string[]>, row: any) => {
            const doctorId = Number(row.doctor_id);
            const serviceType = String(row.service_type || "").trim();
            if (!Number.isInteger(doctorId) || !serviceType) {
              return map;
            }

            const current = map.get(doctorId) || [];
            if (!current.includes(serviceType)) {
              current.push(serviceType);
              map.set(doctorId, current);
            }

            return map;
          },
          new Map<number, string[]>(),
        );
      }

      return c.json({
        success: true,
        users: (users || []).map((record) => {
          const normalizedRole = normalizeRoleValue(record.role);
          return {
            ...record,
            role: normalizedRole,
            roleLabel: roleLabelByKey.get(normalizedRole) || normalizedRole,
            permissionsOverride:
              record.permissions_override &&
              typeof record.permissions_override === "object"
                ? record.permissions_override
                : {},
            effectivePermissions: mergeUserPermissions(
              roleDefinitionByKey.get(normalizedRole)?.permissions ||
                sanitizeRolePermissions(null),
              record.permissions_override,
            ),
            doctorServices:
              normalizedRole === "doctor"
                ? serviceTypeByDoctorId.get(Number(record.id)) || []
                : [],
          };
        }),
      });
    } catch (error) {
      console.error("Get users error:", error);
      return c.json({ error: "Failed to fetch users: " + error.message }, 500);
    }
  },
);

app.post(
  "/make-server-34100c2d/users",
  requireAuth,
  requireSuperAdmin,
  async (c) => {
    try {
      const { username, password, role, doctorServices } = await c.req.json();
      if (!username || !password) {
        return c.json({ error: "Username and password are required" }, 400);
      }

      if (!role) {
        return c.json({ error: "Role is required" }, 400);
      }

      const supabase = getSupabaseClient();
      const normalizedRole = normalizeRoleValue(role);
      const roleExists = await isValidRole(supabase, normalizedRole);
      const normalizedDoctorServices = await normalizeDoctorServiceTypes(
        supabase,
        doctorServices,
      );

      if (!roleExists) {
        return c.json({ error: "Invalid role selected" }, 400);
      }

      if (
        normalizedRole === "doctor" &&
        normalizedDoctorServices.length === 0
      ) {
        return c.json(
          {
            error:
              "At least one service must be selected when creating a doctor account",
          },
          400,
        );
      }

      const { data: createdUser, error } = await supabase
        .from("admin_users")
        .insert({
          username,
          password_hash: password,
          role: normalizedRole,
        })
        .select("id")
        .single();

      if (error) {
        throw error;
      }

      if (normalizedRole === "doctor" && createdUser?.id) {
        const { error: assignError } = await supabase
          .from("doctor_service_assignments")
          .insert(
            normalizedDoctorServices.map((serviceType) => ({
              doctor_id: Number(createdUser.id),
              service_type: serviceType,
            })),
          );

        if (assignError) {
          throw assignError;
        }
      }

      return c.json({ success: true });
    } catch (error) {
      console.error("Create user error:", error);
      return c.json({ error: "Failed to create user: " + error.message }, 500);
    }
  },
);

app.put(
  "/make-server-34100c2d/roles/:role",
  requireAuth,
  requireSuperAdmin,
  async (c) => {
    try {
      const roleKey = normalizeRoleValue(c.req.param("role"));
      const { permissions } = await c.req.json();

      const supabase = getSupabaseClient();
      const roleDefinition = await getRoleDefinition(supabase, roleKey);

      if (normalizeRoleValue(roleDefinition.role) !== roleKey) {
        return c.json({ error: "Role not found" }, 404);
      }

      const normalizedPermissions = sanitizeRolePermissions(permissions);

      if (
        roleKey === "super_admin" &&
        !hasRequiredSuperAdminAccess(normalizedPermissions)
      ) {
        return c.json(
          {
            error:
              "Super Admin role must retain Dashboard, Settings, and Manage Users access",
          },
          400,
        );
      }

      const { error } = await supabase
        .from("role_definitions")
        .update({
          permissions: normalizedPermissions,
          updated_at: new Date().toISOString(),
        })
        .eq("role", roleKey);

      if (error) {
        throw error;
      }

      return c.json({
        success: true,
        role: {
          role: roleKey,
          permissions: normalizedPermissions,
        },
      });
    } catch (error) {
      console.error("Update role permissions error:", error);
      return c.json(
        { error: "Failed to update role permissions: " + error.message },
        500,
      );
    }
  },
);

app.put(
  "/make-server-34100c2d/users/:id",
  requireAuth,
  requireSuperAdmin,
  async (c) => {
    try {
      const userId = c.req.param("id");
      const { role, password, doctorServices, userPermissions } =
        await c.req.json();
      const updates: any = {};
      const supabase = getSupabaseClient();
      const actingUser = c.get("user");
      const numericUserId = Number(userId);

      const { data: existingUser, error: existingUserError } = await supabase
        .from("admin_users")
        .select("id, role")
        .eq("id", numericUserId)
        .maybeSingle();

      if (existingUserError) {
        throw existingUserError;
      }

      if (!existingUser) {
        return c.json({ error: "User not found" }, 404);
      }

      const normalizedDoctorServices = await normalizeDoctorServiceTypes(
        supabase,
        doctorServices,
      );

      if (role) {
        const normalizedRole = normalizeRoleValue(role);
        const roleExists = await isValidRole(supabase, normalizedRole);
        if (!roleExists) {
          return c.json({ error: "Invalid role selected" }, 400);
        }

        updates.role = normalizedRole;
      }

      if (password) {
        updates.password_hash = password;
      }

      const targetRole = normalizeRoleValue(
        updates.role || existingUser.role || "",
      );
      const currentRole = normalizeRoleValue(existingUser.role);
      const targetRoleDefinition = await getRoleDefinition(
        supabase,
        targetRole,
      );
      const isEditingSelf = Number(actingUser?.id) === numericUserId;

      if (
        isEditingSelf &&
        normalizeRoleValue(actingUser?.role) === "super_admin" &&
        targetRole !== "super_admin"
      ) {
        return c.json(
          {
            error: "Super Admin cannot remove their own Super Admin role",
          },
          400,
        );
      }

      if (
        targetRole === "doctor" &&
        currentRole !== "doctor" &&
        doctorServices === undefined
      ) {
        return c.json(
          {
            error:
              "Select at least one service when changing this user to doctor",
          },
          400,
        );
      }

      if (
        targetRole === "doctor" &&
        doctorServices !== undefined &&
        normalizedDoctorServices.length === 0
      ) {
        return c.json(
          {
            error: "At least one service must be selected for a doctor account",
          },
          400,
        );
      }

      if (Object.keys(updates).length === 0 && doctorServices === undefined) {
        if (userPermissions === undefined) {
          return c.json({ error: "No updates provided" }, 400);
        }
      }

      if (Object.keys(updates).length > 0) {
        const { error } = await supabase
          .from("admin_users")
          .update(updates)
          .eq("id", numericUserId);

        if (error) {
          throw error;
        }
      }

      if (userPermissions !== undefined) {
        const effectivePermissions = mergeUserPermissions(
          targetRoleDefinition.permissions,
          buildPermissionsOverride(
            userPermissions,
            targetRoleDefinition.permissions,
          ),
        );

        if (
          isEditingSelf &&
          normalizeRoleValue(actingUser?.role) === "super_admin" &&
          !hasRequiredSuperAdminAccess(effectivePermissions)
        ) {
          return c.json(
            {
              error:
                "Super Admin cannot remove their own Dashboard, Settings, or Manage Users access",
            },
            400,
          );
        }

        const permissionsOverride = buildPermissionsOverride(
          userPermissions,
          targetRoleDefinition.permissions,
        );

        const { error: permissionsError } = await supabase
          .from("admin_users")
          .update({ permissions_override: permissionsOverride })
          .eq("id", numericUserId);

        if (permissionsError) {
          throw permissionsError;
        }
      }

      if (targetRole === "doctor") {
        if (doctorServices !== undefined) {
          const { error: deleteError } = await supabase
            .from("doctor_service_assignments")
            .delete()
            .eq("doctor_id", numericUserId);

          if (deleteError) {
            throw deleteError;
          }

          if (normalizedDoctorServices.length > 0) {
            const { error: insertError } = await supabase
              .from("doctor_service_assignments")
              .insert(
                normalizedDoctorServices.map((serviceType) => ({
                  doctor_id: numericUserId,
                  service_type: serviceType,
                })),
              );

            if (insertError) {
              throw insertError;
            }
          }
        }
      } else {
        const { error: clearError } = await supabase
          .from("doctor_service_assignments")
          .delete()
          .eq("doctor_id", numericUserId);

        if (clearError) {
          throw clearError;
        }
      }

      return c.json({ success: true });
    } catch (error) {
      console.error("Update user error:", error);
      return c.json({ error: "Failed to update user: " + error.message }, 500);
    }
  },
);

// Get all patients
app.get("/make-server-34100c2d/patients", requireAuth, async (c) => {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("patients")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    // Get booking counts for each patient
    const patientsWithBookings = await Promise.all(
      (data || []).map(async (patient) => {
        const { count } = await supabase
          .from("bookings")
          .select("*", { count: "exact", head: true })
          .eq("id_number", patient.id_number);

        return {
          ...patient,
          bookings: Array(count || 0).fill(null),
        };
      }),
    );

    return c.json({ success: true, patients: patientsWithBookings });
  } catch (error) {
    console.error("Get patients error:", error);
    return c.json({ error: "Failed to fetch patients: " + error.message }, 500);
  }
});

// Get all booking contacts
app.get("/make-server-34100c2d/booking-contacts", requireAuth, async (c) => {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("booking_contacts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    const bookingContacts = (data || []).map((contact) => ({
      id: contact.id,
      firstName: contact.first_name,
      lastName: contact.last_name,
      email: contact.email,
      phone: contact.phone,
      idNumber: contact.id_number,
      createdAt: contact.created_at,
      bookingId: contact.booking_id,
      status: "active",
    }));

    return c.json({ success: true, bookingContacts });
  } catch (error) {
    console.error("Get booking contacts error:", error);
    return c.json(
      { error: "Failed to fetch booking contacts: " + error.message },
      500,
    );
  }
});
// Get activity log
app.get(
  "/make-server-34100c2d/activity",
  requireAuth,
  requireSuperAdmin,
  async (c) => {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from("activity_log")
        .select("*")
        .order("timestamp", { ascending: false })
        .limit(100);

      if (error) {
        throw error;
      }

      // Transform to match expected format
      const activities = (data || []).map((log) => ({
        type: log.type,
        user: log.user_name,
        timestamp: log.timestamp,
        description: log.description,
        bookingId: log.booking_id,
      }));

      return c.json({ success: true, activities });
    } catch (error) {
      console.error("Get activity error:", error);
      return c.json(
        { error: "Failed to fetch activity log: " + error.message },
        500,
      );
    }
  },
);

// Get booked slots for a specific date
app.get("/make-server-34100c2d/booked-slots/:date", async (c) => {
  try {
    const dateParam = c.req.param("date");
    const requestDate = new Date(dateParam).toISOString().split("T")[0];

    const supabase = getSupabaseClient();
    await releaseExpiredUncheckedInBookings(supabase);

    const [
      { data: bookings, error },
      { count: availableDoctorCount, error: doctorsError },
    ] = await Promise.all([
      supabase
        .from("bookings")
        .select("time")
        .gte("date", `${requestDate}T00:00:00`)
        .lt("date", `${requestDate}T23:59:59`)
        .eq("status", "confirmed"),
      supabase
        .from("admin_users")
        .select("id", { count: "exact", head: true })
        .eq("role", "doctor")
        .eq("is_available", true),
    ]);

    if (error || doctorsError) {
      throw error || doctorsError;
    }

    const slotCounts = new Map<string, number>();
    for (const booking of bookings || []) {
      const slot = booking.time;
      slotCounts.set(slot, (slotCounts.get(slot) || 0) + 1);
    }

    const availableCount = Number(availableDoctorCount || 0);
    const bookedSlots = Array.from(slotCounts.entries())
      .filter(([, count]) => availableCount > 0 && count >= availableCount)
      .map(([slot]) => slot);

    return c.json({ success: true, bookedSlots });
  } catch (error) {
    console.error("Get booked slots error:", error);
    return c.json(
      { error: "Failed to fetch booked slots: " + error.message },
      500,
    );
  }
});

Deno.serve(app.fetch);
