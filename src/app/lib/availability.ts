import { supabaseAdminApiBaseUrls } from "../../../utils/supabase/client";

export interface PractitionerCatalogItem {
  id: string;
  title: string;
  durationMinutes?: number;
}

export interface ServiceCatalogItem {
  id: string;
  title: string;
  practitioners: PractitionerCatalogItem[];
}

export interface AvailabilityServiceConfig {
  enabled: boolean;
  practitioners: Record<string, boolean>;
  practitionerDurations: Record<string, number>;
}

export type OperatingDayKey =
  | "sunday"
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday";

export interface OperatingHoursDayConfig {
  enabled: boolean;
  start: string;
  end: string;
}

export type BlockedSlotFrequency = "once" | "weekly";

export interface BlockedSlotRule {
  id: string;
  enabled: boolean;
  reason: string;
  frequency: BlockedSlotFrequency;
  date: string | null;
  dayOfWeek: OperatingDayKey | null;
  start: string;
  end: string;
}

export interface AvailabilityConfig {
  services: Record<string, AvailabilityServiceConfig>;
  operatingHours: Record<OperatingDayKey, OperatingHoursDayConfig>;
  blockedSlots: BlockedSlotRule[];
}

export const DEFAULT_APPOINTMENT_DURATION_MINUTES = 30;
export const BASE_SLOT_MINUTES = 30;

const normalizeDurationMinutes = (
  value: unknown,
  fallback = DEFAULT_APPOINTMENT_DURATION_MINUTES,
) => {
  const numeric = Number(value);

  if (!Number.isFinite(numeric) || numeric <= 0) {
    return fallback;
  }

  const roundedToSlot = Math.max(
    BASE_SLOT_MINUTES,
    Math.round(numeric / BASE_SLOT_MINUTES) * BASE_SLOT_MINUTES,
  );

  return roundedToSlot;
};

export const OPERATING_DAYS: Array<{
  key: OperatingDayKey;
  label: string;
}> = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
];

const DAY_INDEX_TO_KEY: OperatingDayKey[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

const formatLabelFromSlug = (value: string) => {
  if (value === "not-sure") {
    return "I'm not sure";
  }

  return String(value || "")
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const DEFAULT_OPERATING_HOURS: Record<
  OperatingDayKey,
  OperatingHoursDayConfig
> = {
  sunday: { enabled: false, start: "09:00", end: "13:30" },
  monday: { enabled: true, start: "08:30", end: "16:30" },
  tuesday: { enabled: true, start: "08:30", end: "16:30" },
  wednesday: { enabled: true, start: "08:30", end: "16:30" },
  thursday: { enabled: true, start: "08:30", end: "16:30" },
  friday: { enabled: true, start: "08:30", end: "16:30" },
  saturday: { enabled: true, start: "09:00", end: "13:30" },
};

export const SERVICE_CATALOG: ServiceCatalogItem[] = [
  {
    id: "dental",
    title: "Dental Care",
    practitioners: [
      {
        id: "slim-wires-bite-blocks",
        title: "Slim wires/Bite blocks (1 Hour)",
        durationMinutes: 60,
      },
      {
        id: "ortho-review-brace-check-up",
        title: "Ortho review / Brace check up (30 Min)",
        durationMinutes: 30,
      },
      {
        id: "consultation-brace-consultation",
        title: "Consultation / Brace consultation (30 Min)",
        durationMinutes: 30,
      },
      {
        id: "crown-denture-consult",
        title: "Crown / Denture consult (30 Min)",
        durationMinutes: 30,
      },
      {
        id: "crown-installation",
        title: "Crown installation (2 Hours)",
        durationMinutes: 120,
      },
      {
        id: "brace-removal-slim-wire-or-bite-blocks-removal",
        title: "Brace removal / Slim wire or Bite blocks removal (1 Hour)",
        durationMinutes: 60,
      },
      {
        id: "teeth-filling",
        title: "Teeth filling (1 Hour)",
        durationMinutes: 60,
      },
      {
        id: "gold-silver-removal",
        title: "Gold / silver removal (1 Hour)",
        durationMinutes: 60,
      },
      {
        id: "teeth-cleaning",
        title: "Teeth cleaning (30 Min)",
        durationMinutes: 30,
      },
      {
        id: "teeth-whitening",
        title: "Teeth whitening (1 Hour 30 Min)",
        durationMinutes: 90,
      },
      {
        id: "root-canal-treatment",
        title: "Root canal treatment (1 Hour)",
        durationMinutes: 60,
      },
      {
        id: "normal-extraction",
        title: "Normal extraction (30 Min)",
        durationMinutes: 30,
      },
      {
        id: "surgical-extraction",
        title: "Surgical extraction (1 Hour)",
        durationMinutes: 60,
      },
      {
        id: "brace-installation",
        title: "Brace installation (1 Hour)",
        durationMinutes: 60,
      },
      { id: "not-sure", title: "I'm not sure" },
    ],
  },
  {
    id: "medical",
    title: "General Medicine",
    practitioners: [
      {
        id: "general-practitioner",
        title: "General Practitioner",
        durationMinutes: 30,
      },
      {
        id: "clinical-associate",
        title: "Clinical Associate",
        durationMinutes: 30,
      },
      { id: "not-sure", title: "I'm not sure", durationMinutes: 30 },
    ],
  },
  {
    id: "iv-therapy",
    title: "IV Drip Therapy",
    practitioners: [
      { id: "hydration", title: "Hydration Therapy", durationMinutes: 30 },
      { id: "vitamin-boost", title: "Vitamin Boost", durationMinutes: 30 },
      { id: "immunity", title: "Immunity Support", durationMinutes: 30 },
      {
        id: "consultation",
        title: "General Consultation",
        durationMinutes: 30,
      },
    ],
  },
  {
    id: "physiotherapy",
    title: "Physiotherapy",
    practitioners: [
      { id: "sports-injury", title: "Sports Injury", durationMinutes: 30 },
      { id: "pain-management", title: "Pain Management", durationMinutes: 30 },
      { id: "rehabilitation", title: "Rehabilitation", durationMinutes: 30 },
      { id: "not-sure", title: "I'm not sure", durationMinutes: 30 },
    ],
  },
];

export const DEFAULT_AVAILABILITY_CONFIG: AvailabilityConfig = {
  services: Object.fromEntries(
    SERVICE_CATALOG.map((service) => [
      service.id,
      {
        enabled: true,
        practitioners: Object.fromEntries(
          service.practitioners.map((practitioner) => [practitioner.id, true]),
        ),
        practitionerDurations: Object.fromEntries(
          service.practitioners.map((practitioner) => [
            practitioner.id,
            normalizeDurationMinutes(practitioner.durationMinutes),
          ]),
        ),
      },
    ]),
  ),
  operatingHours: DEFAULT_OPERATING_HOURS,
  blockedSlots: [],
};

const cloneDefaultConfig = (): AvailabilityConfig =>
  JSON.parse(JSON.stringify(DEFAULT_AVAILABILITY_CONFIG));
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

const DATE_PART_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const normalizeDatePart = (value: unknown) => {
  const datePart = String(value || "").slice(0, 10);
  return DATE_PART_PATTERN.test(datePart) ? datePart : "";
};

const toLocalDatePart = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const normalizeBlockedSlotFrequency = (value: unknown): BlockedSlotFrequency =>
  value === "once" ? "once" : "weekly";

const isUuidLike = (value: unknown) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value || ""),
  );

const normalizeBlockedSlotRule = (
  rule: unknown,
  index: number,
): BlockedSlotRule | null => {
  const incoming = rule && typeof rule === "object" ? (rule as any) : {};
  const frequency = normalizeBlockedSlotFrequency(incoming.frequency);
  const dayOfWeek =
    typeof incoming.dayOfWeek === "string" &&
    OPERATING_DAYS.some((day) => day.key === incoming.dayOfWeek)
      ? (incoming.dayOfWeek as OperatingDayKey)
      : null;
  const date = normalizeDatePart(incoming.date);
  const start = normalizeTimeValue(incoming.start, "");
  const end = normalizeTimeValue(incoming.end, "");

  if (!isOperatingHoursRangeValid(start, end)) {
    return null;
  }

  if (frequency === "weekly" && !dayOfWeek) {
    return null;
  }

  if (frequency === "once" && !date) {
    return null;
  }

  return {
    id: isUuidLike(incoming.id)
      ? String(incoming.id)
      : `block-${index}-${frequency}-${dayOfWeek || date || "slot"}-${start}`,
    enabled: incoming.enabled !== false,
    reason: String(incoming.reason || "Blocked").trim() || "Blocked",
    frequency,
    date: frequency === "once" ? date : null,
    dayOfWeek: frequency === "weekly" ? dayOfWeek : null,
    start,
    end,
  };
};

export const timeStringToMinutes = (value: string) => {
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

export const isOperatingHoursRangeValid = (
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

export const getOperatingDayKey = (date: Date): OperatingDayKey =>
  DAY_INDEX_TO_KEY[date.getDay()];

export const getOperatingHoursForDate = (
  config: AvailabilityConfig,
  date: Date,
) => config.operatingHours[getOperatingDayKey(date)];

const doesBlockedRuleApplyToDate = (rule: BlockedSlotRule, date: Date) => {
  if (!rule.enabled) {
    return false;
  }

  if (rule.frequency === "weekly") {
    return rule.dayOfWeek === getOperatingDayKey(date);
  }

  const datePart = toLocalDatePart(date);
  return !!rule.date && rule.date === datePart;
};

const getBlockedBaseSlotsForDate = (config: AvailabilityConfig, date: Date) => {
  const blockedSlots = new Set<string>();
  const blockedRules = Array.isArray(config.blockedSlots)
    ? config.blockedSlots
    : [];

  for (const rule of blockedRules) {
    if (!doesBlockedRuleApplyToDate(rule, date)) {
      continue;
    }

    const startMinutes = timeStringToMinutes(rule.start);
    const endMinutes = timeStringToMinutes(rule.end);

    if (startMinutes === null || endMinutes === null) {
      continue;
    }

    for (
      let current = startMinutes;
      current + BASE_SLOT_MINUTES <= endMinutes;
      current += BASE_SLOT_MINUTES
    ) {
      const hours = String(Math.floor(current / 60)).padStart(2, "0");
      const minutes = String(current % 60).padStart(2, "0");
      blockedSlots.add(`${hours}:${minutes}`);
    }
  }

  return blockedSlots;
};

const isSlotWindowBlocked = (
  slotStartTime: string,
  slotDurationMinutes: number,
  blockedSlots: Set<string>,
) => {
  const slotStartMinutes = timeStringToMinutes(slotStartTime);

  if (slotStartMinutes === null) {
    return true;
  }

  for (
    let current = slotStartMinutes;
    current + BASE_SLOT_MINUTES <= slotStartMinutes + slotDurationMinutes;
    current += BASE_SLOT_MINUTES
  ) {
    const hours = String(Math.floor(current / 60)).padStart(2, "0");
    const minutes = String(current % 60).padStart(2, "0");

    if (blockedSlots.has(`${hours}:${minutes}`)) {
      return true;
    }
  }

  return false;
};

export const getAvailableTimeSlots = (
  config: AvailabilityConfig,
  date: Date,
  slotDurationMinutes = 30,
) => {
  const dayConfig = getOperatingHoursForDate(config, date);

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

  const blockedBaseSlots = getBlockedBaseSlotsForDate(config, date);
  const slots: string[] = [];

  for (
    let current = startMinutes;
    current + slotDurationMinutes <= endMinutes;
    current += slotDurationMinutes
  ) {
    const hours = String(Math.floor(current / 60)).padStart(2, "0");
    const minutes = String(current % 60).padStart(2, "0");
    const startTime = `${hours}:${minutes}`;

    if (
      !isSlotWindowBlocked(startTime, slotDurationMinutes, blockedBaseSlots)
    ) {
      slots.push(startTime);
    }
  }

  return slots;
};

export const isDateBookable = (config: AvailabilityConfig, date: Date) =>
  getAvailableTimeSlots(config, date).length > 0;

export const isTimeWithinOperatingHours = (
  config: AvailabilityConfig,
  date: Date,
  time: string,
  slotDurationMinutes = 30,
) => getAvailableTimeSlots(config, date, slotDurationMinutes).includes(time);

export const normalizeAvailabilityConfig = (
  config?: Partial<AvailabilityConfig> | null,
): AvailabilityConfig => {
  const normalized = cloneDefaultConfig();

  const incomingServices =
    config?.services && typeof config.services === "object"
      ? config.services
      : {};

  for (const [serviceId, incomingServiceRaw] of Object.entries(
    incomingServices,
  )) {
    const incomingService =
      incomingServiceRaw && typeof incomingServiceRaw === "object"
        ? (incomingServiceRaw as AvailabilityServiceConfig)
        : ({
            enabled: true,
            practitioners: {},
            practitionerDurations: {},
          } as AvailabilityServiceConfig);

    if (!normalized.services[serviceId]) {
      normalized.services[serviceId] = {
        enabled: true,
        practitioners: {},
        practitionerDurations: {},
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

    const incomingDurations =
      incomingService.practitionerDurations &&
      typeof incomingService.practitionerDurations === "object"
        ? incomingService.practitionerDurations
        : {};

    for (const [practitionerId, durationMinutes] of Object.entries(
      incomingDurations,
    )) {
      normalized.services[serviceId].practitionerDurations[practitionerId] =
        normalizeDurationMinutes(durationMinutes);
    }
  }

  for (const service of SERVICE_CATALOG) {
    const serviceConfig = config?.services?.[service.id];

    if (serviceConfig && typeof serviceConfig.enabled === "boolean") {
      normalized.services[service.id].enabled = serviceConfig.enabled;
    }

    for (const practitioner of service.practitioners) {
      const enabled = serviceConfig?.practitioners?.[practitioner.id];
      if (typeof enabled === "boolean") {
        normalized.services[service.id].practitioners[practitioner.id] =
          enabled;
      }

      const durationMinutes =
        serviceConfig?.practitionerDurations?.[practitioner.id];

      if (typeof durationMinutes === "number") {
        normalized.services[service.id].practitionerDurations[practitioner.id] =
          normalizeDurationMinutes(durationMinutes);
      }
    }
  }

  for (const day of OPERATING_DAYS) {
    const incomingDay = config?.operatingHours?.[day.key];
    const normalizedDay = normalized.operatingHours[day.key];

    if (typeof incomingDay?.enabled === "boolean") {
      normalizedDay.enabled = incomingDay.enabled;
    }

    normalizedDay.start = normalizeTimeValue(
      incomingDay?.start,
      normalizedDay.start,
    );
    normalizedDay.end = normalizeTimeValue(incomingDay?.end, normalizedDay.end);
  }

  const incomingBlockedSlots = Array.isArray(config?.blockedSlots)
    ? config.blockedSlots
    : [];
  normalized.blockedSlots = incomingBlockedSlots
    .map((rule, index) => normalizeBlockedSlotRule(rule, index))
    .filter((rule): rule is BlockedSlotRule => Boolean(rule));

  return normalized;
};

const fetchAdminApi = async (path: string, init?: RequestInit) => {
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

export const fetchAvailabilityConfig =
  async (): Promise<AvailabilityConfig> => {
    try {
      const response = await fetchAdminApi("/availability");

      if (!response || !response.ok) {
        return cloneDefaultConfig();
      }

      const data = await response.json();
      return normalizeAvailabilityConfig(data?.config);
    } catch {
      return cloneDefaultConfig();
    }
  };

export const fetchServiceCatalog = async (): Promise<ServiceCatalogItem[]> => {
  try {
    const response = await fetchAdminApi("/service-catalog");

    if (!response || !response.ok) {
      return SERVICE_CATALOG;
    }

    const data = await response.json();
    const services = Array.isArray(data?.services) ? data.services : [];

    const catalog = services
      .map((service: any) => {
        const serviceId = String(service?.id || "").trim();
        if (!serviceId) {
          return null;
        }

        const practitionerItems = Array.isArray(service?.practitioners)
          ? service.practitioners
              .map((practitioner: any) => {
                const practitionerId = String(practitioner?.id || "").trim();
                if (!practitionerId) {
                  return null;
                }

                return {
                  id: practitionerId,
                  title:
                    String(practitioner?.title || "").trim() ||
                    formatLabelFromSlug(practitionerId),
                  durationMinutes: normalizeDurationMinutes(
                    practitioner?.durationMinutes ??
                      practitioner?.duration_minutes,
                  ),
                };
              })
              .filter(Boolean)
          : [];

        return {
          id: serviceId,
          title:
            String(service?.title || "").trim() ||
            formatLabelFromSlug(serviceId),
          practitioners: practitionerItems,
        };
      })
      .filter(Boolean) as ServiceCatalogItem[];

    return catalog.length > 0 ? catalog : SERVICE_CATALOG;
  } catch {
    return SERVICE_CATALOG;
  }
};

export const updateAvailabilityConfig = async (
  config: AvailabilityConfig,
  authToken: string,
): Promise<AvailabilityConfig> => {
  const response = await fetchAdminApi("/availability", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${authToken}`,
    },
    body: JSON.stringify({ config }),
  });

  if (!response) {
    throw new Error("No response from availability endpoint");
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error || "Failed to update availability");
  }

  return normalizeAvailabilityConfig(data?.config);
};

export const isServiceEnabled = (
  config: AvailabilityConfig,
  serviceId: string,
) => config.services[serviceId]?.enabled !== false;

export const isPractitionerEnabled = (
  config: AvailabilityConfig,
  serviceId: string,
  practitionerId: string,
) =>
  isServiceEnabled(config, serviceId) &&
  config.services[serviceId]?.practitioners?.[practitionerId] !== false;

export const getPractitionerDurationMinutes = (
  config: AvailabilityConfig,
  serviceId: string,
  practitionerId: string,
) =>
  normalizeDurationMinutes(
    config.services?.[serviceId]?.practitionerDurations?.[practitionerId],
  );

export const getRequiredSlotCount = (durationMinutes: number) =>
  Math.max(
    1,
    Math.ceil(normalizeDurationMinutes(durationMinutes) / BASE_SLOT_MINUTES),
  );

export const getSlotWindowTimes = (
  startTime: string,
  durationMinutes: number,
) => {
  const startMinutes = timeStringToMinutes(startTime);
  if (startMinutes === null) {
    return [];
  }

  const slotCount = getRequiredSlotCount(durationMinutes);
  const times: string[] = [];

  for (let i = 0; i < slotCount; i += 1) {
    const current = startMinutes + i * BASE_SLOT_MINUTES;
    const hours = String(Math.floor(current / 60)).padStart(2, "0");
    const minutes = String(current % 60).padStart(2, "0");
    times.push(`${hours}:${minutes}`);
  }

  return times;
};
