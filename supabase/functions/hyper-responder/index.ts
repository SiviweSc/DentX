// @ts-nocheck
import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";

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

const EMPTY_ROLE_PERMISSIONS = {
  dashboard: false,
  calendar: false,
  bookings: false,
  bookingsConfirm: false,
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
  "settings.availability": "manageAvailability",
  "users.manage": "manageUsers",
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
    patients: source.patients === true,
    practice: source.practice === true,
    activity: source.activity === true,
    settings: source.settings === true,
    bookingsComplete: source.bookingsComplete === true,
    manageUsers: source.manageUsers === true,
    manageAvailability: source.manageAvailability === true,
  };
};

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

    c.set("user", {
      ...data,
      role: roleDefinition.role,
      roleLabel: roleDefinition.roleLabel,
      permissions: roleDefinition.permissions,
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

const ensurePatientExistsForBooking = async (supabase: any, booking: any) => {
  const bookingIdNumber = String(booking.id_number || "").trim();
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
    const bookingPhone = normalizePhoneValue(booking.phone || "");
    const bookingFirstName = normalizeTextValue(booking.first_name || "");
    const bookingLastName = normalizeTextValue(booking.last_name || "");

    const { data: samePhonePatients, error: phoneError } = await supabase
      .from("patients")
      .select("id, first_name, last_name, phone")
      .eq("phone", booking.phone || "");

    if (phoneError) {
      console.error("Failed to check patient by phone:", phoneError);
    }

    const matchedByNameAndPhone = (samePhonePatients || []).find(
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

const normalizeAvailabilityConfig = (config: any) => {
  const normalized = JSON.parse(JSON.stringify(DEFAULT_AVAILABILITY_CONFIG));

  if (!config?.services) {
    return normalized;
  }

  for (const [serviceId, serviceConfig] of Object.entries(
    normalized.services,
  )) {
    const incomingService = config.services?.[serviceId];

    if (typeof incomingService?.enabled === "boolean") {
      serviceConfig.enabled = incomingService.enabled;
    }

    for (const practitionerId of Object.keys(serviceConfig.practitioners)) {
      const enabled = incomingService?.practitioners?.[practitionerId];
      if (typeof enabled === "boolean") {
        serviceConfig.practitioners[practitionerId] = enabled;
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

  const config = JSON.parse(JSON.stringify(DEFAULT_AVAILABILITY_CONFIG));

  if (!servicesResult.error) {
    for (const service of servicesResult.data || []) {
      if (config.services[service.service_id]) {
        config.services[service.service_id].enabled = service.enabled;
      }
    }
  }

  if (!practitionersResult.error) {
    for (const practitioner of practitionersResult.data || []) {
      if (
        config.services[practitioner.service_id]?.practitioners[
          practitioner.practitioner_id
        ] !== undefined
      ) {
        config.services[practitioner.service_id].practitioners[
          practitioner.practitioner_id
        ] = practitioner.enabled;
      }
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
        username: data.username,
        role: roleDefinition.role,
        roleLabel: roleDefinition.roleLabel,
        permissions: roleDefinition.permissions,
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
        source: bookingData.source || "website",
        status: "pending",
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

    // Create/update patient record
    if (bookingData.idNumber) {
      // Check if patient exists
      const { data: existingPatient } = await supabase
        .from("patients")
        .select("*")
        .eq("id_number", bookingData.idNumber)
        .single();

      if (existingPatient) {
        // Update existing patient
        await supabase
          .from("patients")
          .update({
            last_visit: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id_number", bookingData.idNumber);
      } else {
        // Create new patient
        await supabase.from("patients").insert({
          first_name: bookingData.firstName,
          last_name: bookingData.lastName,
          email: bookingData.email || "",
          phone: bookingData.phone,
          id_number: bookingData.idNumber,
          medical_aid: bookingData.medicalAid || "",
          medical_aid_number: bookingData.medicalAidNumber || "",
          last_visit: new Date().toISOString(),
        });
      }
    }

    return c.json({ success: true, booking, bookingId: booking.id });
  } catch (error) {
    console.error("Create booking error:", error);
    return c.json({ error: "Failed to create booking: " + error.message }, 500);
  }
});

// Update booking status
app.put("/make-server-34100c2d/bookings/:id", requireAuth, async (c) => {
  try {
    const bookingId = c.req.param("id");
    const updates = await c.req.json();
    const user = c.get("user");

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
    }

    const supabase = getSupabaseClient();

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
app.delete("/make-server-34100c2d/bookings/:id", requireAuth, async (c) => {
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
    return c.json({ error: "Failed to delete booking: " + error.message }, 500);
  }
});

// User management
app.get("/make-server-34100c2d/roles", requireAuth, async (c) => {
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
});

app.get(
  "/make-server-34100c2d/users",
  requireAuth,
  requirePermission("users.manage"),
  async (c) => {
    try {
      const supabase = getSupabaseClient();
      const [
        { data: users, error: usersError },
        { data: roles, error: rolesError },
      ] = await Promise.all([
        supabase
          .from("admin_users")
          .select("id, username, role, created_at, last_login")
          .order("created_at", { ascending: false }),
        supabase.from("role_definitions").select("role, label"),
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

      return c.json({
        success: true,
        users: (users || []).map((record) => {
          const normalizedRole = normalizeRoleValue(record.role);
          return {
            ...record,
            role: normalizedRole,
            roleLabel: roleLabelByKey.get(normalizedRole) || normalizedRole,
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
  requirePermission("users.manage"),
  async (c) => {
    try {
      const { username, password, role } = await c.req.json();
      if (!username || !password) {
        return c.json({ error: "Username and password are required" }, 400);
      }

      if (!role) {
        return c.json({ error: "Role is required" }, 400);
      }

      const supabase = getSupabaseClient();
      const normalizedRole = normalizeRoleValue(role);
      const roleExists = await isValidRole(supabase, normalizedRole);

      if (!roleExists) {
        return c.json({ error: "Invalid role selected" }, 400);
      }

      const { error } = await supabase.from("admin_users").insert({
        username,
        password_hash: password,
        role: normalizedRole,
      });

      if (error) {
        throw error;
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
  requirePermission("users.manage"),
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
  requirePermission("users.manage"),
  async (c) => {
    try {
      const userId = c.req.param("id");
      const { role, password } = await c.req.json();
      const updates: any = {};
      const supabase = getSupabaseClient();

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

      if (Object.keys(updates).length === 0) {
        return c.json({ error: "No updates provided" }, 400);
      }

      const { error } = await supabase
        .from("admin_users")
        .update(updates)
        .eq("id", Number(userId));

      if (error) {
        throw error;
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
app.get("/make-server-34100c2d/activity", requireAuth, async (c) => {
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
});

// Get booked slots for a specific date
app.get("/make-server-34100c2d/booked-slots/:date", async (c) => {
  try {
    const dateParam = c.req.param("date");
    const requestDate = new Date(dateParam).toISOString().split("T")[0];

    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("bookings")
      .select("time")
      .gte("date", `${requestDate}T00:00:00`)
      .lt("date", `${requestDate}T23:59:59`)
      .in("status", ["pending", "confirmed"]);

    if (error) {
      throw error;
    }

    const bookedSlots = (data || []).map((booking) => booking.time);

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
