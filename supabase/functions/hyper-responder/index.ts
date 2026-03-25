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

    c.set("user", data);
    await next();
  } catch (e) {
    return c.json({ error: "Invalid authorization header" }, 401);
  }
};

// Health check endpoint
app.get("/make-server-34100c2d/health", (c) => {
  return c.json({ status: "ok" });
});

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
    await supabase.from("activity_log").insert({
      type: "login",
      user_name: username,
      description: "Admin logged in successfully",
    });

    console.log("✅ Returning success response");

    return c.json({
      success: true,
      user: {
        username: data.username,
        role: data.role,
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

    // Insert booking
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        service_type: bookingData.serviceType,
        practitioner_type: bookingData.practitionerType,
        date: bookingData.date,
        time: bookingData.time,
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

    // Log activity
    await supabase.from("activity_log").insert({
      type: "booking_updated",
      user_name: "Admin",
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
      user_name: "Admin",
      description: `Booking deleted for ${booking.first_name} ${booking.last_name}`,
      booking_id: bookingId,
    });

    return c.json({ success: true });
  } catch (error) {
    console.error("Delete booking error:", error);
    return c.json({ error: "Failed to delete booking: " + error.message }, 500);
  }
});

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
