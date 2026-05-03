export type UserRole = string;

export interface RolePermissions {
  dashboard: boolean;
  calendar: boolean;
  bookings: boolean;
  bookingsConfirm: boolean;
  bookingsDelete: boolean;
  patients: boolean;
  practice: boolean;
  activity: boolean;
  settings: boolean;
  bookingsComplete: boolean;
  manageUsers: boolean;
  manageAvailability: boolean;
}

export interface RoleDefinition {
  role: UserRole;
  label: string;
  permissions: RolePermissions;
}

export const EMPTY_ROLE_PERMISSIONS: RolePermissions = {
  dashboard: true,
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

export const normalizeUserRole = (role: string | null | undefined): UserRole =>
  String(role || "")
    .trim()
    .toLowerCase();

export const getRoleLabel = (
  role: string | null | undefined,
  fallbackLabel?: string | null,
): string => {
  if (fallbackLabel && fallbackLabel.trim()) {
    return fallbackLabel;
  }

  const normalizedRole = normalizeUserRole(role);
  if (!normalizedRole) {
    return "Unknown";
  }

  return normalizedRole
    .split("_")
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
};

export const sanitizeRolePermissions = (
  value: Partial<RolePermissions> | null | undefined,
): RolePermissions => ({
  dashboard: value?.dashboard !== false,
  calendar: value?.calendar === true,
  bookings: value?.bookings === true,
  bookingsConfirm: value?.bookingsConfirm === true,
  bookingsDelete: value?.bookingsDelete === true,
  patients: value?.patients === true,
  practice: value?.practice === true,
  activity: value?.activity === true,
  settings: value?.settings === true,
  bookingsComplete: value?.bookingsComplete === true,
  manageUsers: value?.manageUsers === true,
  manageAvailability: value?.manageAvailability === true,
});
