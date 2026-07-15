// @ts-nocheck
import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";

const app = new Hono().basePath("/hyper-responder");

app.use("*", logger(console.log));

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

const getSupabaseClient = () => {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );
};

const normalizePhoneValue = (value: string) =>
  String(value || "")
    .replace(/\s+/g, "")
    .replace(/[^\d+]/g, "");

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

    c.set("user", data);
    await next();
  } catch {
    return c.json({ error: "Invalid authorization header" }, 401);
  }
};

app.get("/make-server-34100c2d/health", (c) => {
  return c.json({ status: "ok" });
});

const handleAvailabilityRequest = async (c: any) => {
  return c.json({ success: true, config: null });
};

const handleServiceCatalogRequest = async (c: any) => {
  return c.json({ success: true, services: [] });
};

app.get("/make-server-34100c2d/availability", handleAvailabilityRequest);
app.get("/availability", handleAvailabilityRequest);
app.get("/make-server-34100c2d/service-catalog", handleServiceCatalogRequest);
app.get("/service-catalog", handleServiceCatalogRequest);

app.post("/make-server-34100c2d/auth/login", async (c) => {
  try {
    const { username, password } = await c.req.json();

    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("admin_users")
      .select("*")
      .eq("username", username)
      .eq("password_hash", password)
      .single();

    if (error || !data) {
      return c.json({ success: false, error: "Invalid credentials" }, 401);
    }

    await supabase
      .from("admin_users")
      .update({ last_login: new Date().toISOString() })
      .eq("id", data.id);

    await supabase.from("activity_log").insert({
      type: "login",
      user_name: username,
      description: "Admin logged in successfully",
    });

    return c.json({
      success: true,
      user: {
        username: data.username,
        role: data.role,
      },
      token: btoa(`${username}:${password}`),
    });
  } catch (error) {
    return c.json(
      { success: false, error: "Login failed: " + (error as Error).message },
      500,
    );
  }
});

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
    return c.json(
      { error: "Failed to fetch bookings: " + (error as Error).message },
      500,
    );
  }
});

app.post("/make-server-34100c2d/bookings", async (c) => {
  try {
    const bookingData = await c.req.json();
    const supabase = getSupabaseClient();

    const bookingDatePart = String(bookingData.date || "").slice(0, 10);
    const bookingTime = String(bookingData.time || "").trim();
    const normalizedBookingPhone = normalizePhoneValue(bookingData.phone || "");

    if (bookingDatePart && bookingTime && normalizedBookingPhone) {
      const { data: sameSlotCandidates, error: sameSlotCandidatesError } =
        await supabase
          .from("bookings")
          .select("id, phone")
          .gte("date", `${bookingDatePart}T00:00:00`)
          .lt("date", `${bookingDatePart}T23:59:59`)
          .eq("time", bookingTime)
          .in("status", ["pending", "confirmed", "completed"]);

      if (sameSlotCandidatesError) {
        throw sameSlotCandidatesError;
      }

      const hasSameSlotDuplicate = (sameSlotCandidates || []).some(
        (candidate: any) =>
          normalizePhoneValue(candidate?.phone || "") ===
          normalizedBookingPhone,
      );

      if (hasSameSlotDuplicate) {
        return c.json(
          {
            error: "This client already has a booking for that slot",
            code: "CLIENT_ALREADY_BOOKED_SAME_SLOT",
          },
          409,
        );
      }
    }

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
      if (
        bookingError.code === "23505" &&
        String(bookingError.message || "").includes(
          "bookings_active_phone_slot_unique_idx",
        )
      ) {
        return c.json(
          {
            error: "This client already has a booking for that slot",
            code: "CLIENT_ALREADY_BOOKED_SAME_SLOT",
          },
          409,
        );
      }

      throw bookingError;
    }

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

    if (bookingData.idNumber) {
      const { data: existingPatient } = await supabase
        .from("patients")
        .select("*")
        .eq("id_number", bookingData.idNumber)
        .single();

      if (existingPatient) {
        await supabase
          .from("patients")
          .update({
            last_visit: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id_number", bookingData.idNumber);
      } else {
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
    return c.json(
      { error: "Failed to create booking: " + (error as Error).message },
      500,
    );
  }
});

app.put("/make-server-34100c2d/bookings/:id", requireAuth, async (c) => {
  try {
    const bookingId = c.req.param("id");
    const updates = await c.req.json();

    const supabase = getSupabaseClient();
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

    await supabase.from("activity_log").insert({
      type: "booking_updated",
      user_name: "Admin",
      description: `Booking ${bookingId} updated - Status: ${updates.status || "updated"}`,
      booking_id: bookingId,
    });

    return c.json({ success: true, booking });
  } catch (error) {
    return c.json(
      { error: "Failed to update booking: " + (error as Error).message },
      500,
    );
  }
});

app.delete("/make-server-34100c2d/bookings/:id", requireAuth, async (c) => {
  try {
    const bookingId = c.req.param("id");

    const supabase = getSupabaseClient();
    const { data: booking } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .single();

    if (!booking) {
      return c.json({ error: "Booking not found" }, 404);
    }

    const { error } = await supabase
      .from("bookings")
      .delete()
      .eq("id", bookingId);

    if (error) {
      throw error;
    }

    await supabase.from("activity_log").insert({
      type: "booking_deleted",
      user_name: "Admin",
      description: `Booking deleted for ${booking.first_name} ${booking.last_name}`,
      booking_id: bookingId,
    });

    return c.json({ success: true });
  } catch (error) {
    return c.json(
      { error: "Failed to delete booking: " + (error as Error).message },
      500,
    );
  }
});

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

    const patientsWithBookings = await Promise.all(
      (data || []).map(async (patient: any) => {
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
    return c.json(
      { error: "Failed to fetch patients: " + (error as Error).message },
      500,
    );
  }
});

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

    const bookingContacts = (data || []).map((contact: any) => ({
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
    return c.json(
      {
        error: "Failed to fetch booking contacts: " + (error as Error).message,
      },
      500,
    );
  }
});

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

    const activities = (data || []).map((log: any) => ({
      type: log.type,
      user: log.user_name,
      timestamp: log.timestamp,
      description: log.description,
      bookingId: log.booking_id,
    }));

    return c.json({ success: true, activities });
  } catch (error) {
    return c.json(
      { error: "Failed to fetch activity log: " + (error as Error).message },
      500,
    );
  }
});

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

    const bookedSlots = (data || []).map((booking: any) => booking.time);

    return c.json({ success: true, bookedSlots });
  } catch (error) {
    return c.json(
      { error: "Failed to fetch booked slots: " + (error as Error).message },
      500,
    );
  }
});

Deno.serve(app.fetch);
