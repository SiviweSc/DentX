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
  payslips: boolean;
  managePayslips: boolean;
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
  payslips: false,
  managePayslips: false,
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

export const getShortRoleLabel = (
  role: string | null | undefined,
  fallbackLabel?: string | null,
): string => {
  const normalizedRole = normalizeUserRole(role);

  const shortByRole: Record<string, string> = {
    super_admin: "S.Admin",
    admin: "Admin",
    administrator: "Admin",
    doctor: "Dr",
    receptionist: "Recep.",
    nurse: "Nurse",
    staff: "Staff",
    practice_manager: "P.Manager",
    assistant_admin: "A.Admin",
  };

  if (normalizedRole && shortByRole[normalizedRole]) {
    return shortByRole[normalizedRole];
  }

  return getRoleLabel(role, fallbackLabel);
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
  payslips: value?.payslips === true,
  managePayslips: value?.managePayslips === true,
});
