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

export interface AvailabilityConfig {
  services: Record<string, AvailabilityServiceConfig>;
}

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
};

const cloneDefaultConfig = (): AvailabilityConfig =>
  JSON.parse(JSON.stringify(DEFAULT_AVAILABILITY_CONFIG));

export const normalizeAvailabilityConfig = (
  config?: Partial<AvailabilityConfig> | null,
): AvailabilityConfig => {
  const normalized = cloneDefaultConfig();

  if (!config?.services) {
    return normalized;
  }

  for (const service of SERVICE_CATALOG) {
    const serviceConfig = config.services[service.id];

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
