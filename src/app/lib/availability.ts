import { supabaseAdminApiBaseUrls } from "../../../utils/supabase/client";

export interface PractitionerCatalogItem {
  id: string;
  title: string;
}

export interface ServiceCatalogItem {
  id: string;
  title: string;
  practitioners: PractitionerCatalogItem[];
}

export interface AvailabilityServiceConfig {
  enabled: boolean;
  practitioners: Record<string, boolean>;
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

export interface AvailabilityConfig {
  services: Record<string, AvailabilityServiceConfig>;
  operatingHours: Record<OperatingDayKey, OperatingHoursDayConfig>;
}

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
      { id: "general-dentist", title: "General Dentistry" },
      { id: "dental-therapist", title: "Dental Therapist" },
      { id: "emergency", title: "Emergency Dental" },
      { id: "not-sure", title: "I'm not sure" },
    ],
  },
  {
    id: "medical",
    title: "General Medicine",
    practitioners: [
      { id: "general-practitioner", title: "General Practitioner" },
      { id: "clinical-associate", title: "Clinical Associate" },
      { id: "not-sure", title: "I'm not sure" },
    ],
  },
  {
    id: "iv-therapy",
    title: "IV Drip Therapy",
    practitioners: [
      { id: "hydration", title: "Hydration Therapy" },
      { id: "vitamin-boost", title: "Vitamin Boost" },
      { id: "immunity", title: "Immunity Support" },
      { id: "consultation", title: "General Consultation" },
    ],
  },
  {
    id: "physiotherapy",
    title: "Physiotherapy",
    practitioners: [
      { id: "sports-injury", title: "Sports Injury" },
      { id: "pain-management", title: "Pain Management" },
      { id: "rehabilitation", title: "Rehabilitation" },
      { id: "not-sure", title: "I'm not sure" },
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
      },
    ]),
  ),
  operatingHours: DEFAULT_OPERATING_HOURS,
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

  const slots: string[] = [];

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
        : ({ enabled: true, practitioners: {} } as AvailabilityServiceConfig);

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
