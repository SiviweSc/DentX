import React, { useState } from "react";
import { FileText, CalendarClock, ArrowLeft } from "lucide-react";
import { PayslipsContent } from "./admin-dashboard-new";

const STAFF_PORTAL_IMAGE =
  "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80";

export function StaffPortalDashboard({
  authToken,
  currentUserId,
  currentUserRole,
  currentUserPermissions,
}: {
  authToken: string;
  currentUserId: number;
  currentUserRole: string;
  currentUserPermissions: any;
}) {
  const [activeTile, setActiveTile] = useState<"" | "payslips">("");

  if (activeTile === "payslips") {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Slim hero with back button */}
        <div className="relative h-36 w-full overflow-hidden">
          <img
            src={STAFF_PORTAL_IMAGE}
            alt="Staff Portal"
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative z-10 flex items-center h-full px-6">
            <button
              type="button"
              onClick={() => setActiveTile("")}
              className="flex items-center gap-2 text-white/80 hover:text-white transition-colors text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Staff Portal
            </button>
          </div>
        </div>
        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <PayslipsContent
            authToken={authToken}
            currentUserId={currentUserId}
            currentUserRole={currentUserRole}
            currentUserPermissions={currentUserPermissions}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Full-width hero with overlay */}
      <div className="relative w-full h-60 sm:h-80 overflow-hidden">
        <img
          src={STAFF_PORTAL_IMAGE}
          alt="Staff Portal"
          className="absolute inset-0 w-full h-full object-cover object-top"
        />
        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/70" />
        {/* Text centered on hero */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full px-4 text-center">
          <p className="text-xs sm:text-sm font-semibold tracking-[0.25em] text-white/70 uppercase mb-2">
            TAP HR Management
          </p>
          <h1 className="text-3xl sm:text-5xl font-bold text-white mb-3">
            Staff Portal
          </h1>
          <p className="text-white/75 text-sm sm:text-base max-w-sm">
            Everything you need, right where you work.
          </p>
        </div>
      </div>

      {/* Tiles */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Payslips */}
          <button
            type="button"
            onClick={() => setActiveTile("payslips")}
            className="group flex flex-col items-center gap-4 rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm hover:shadow-md hover:border-[#9A7B1D] transition-all duration-200 w-full"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#f5efe0] group-hover:bg-[#9A7B1D] transition-colors duration-200">
              <FileText className="w-7 h-7 text-[#9A7B1D] group-hover:text-white transition-colors duration-200" />
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900">Payslips</p>
              <p className="mt-1 text-sm text-gray-500">
                View and download your payslips securely.
              </p>
            </div>
          </button>

          {/* Leave Management — coming soon */}
          <div className="relative flex flex-col items-center gap-4 rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm opacity-60 cursor-not-allowed select-none">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gray-100">
              <CalendarClock className="w-7 h-7 text-gray-400" />
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900">
                Leave Management
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Apply for and track your leave days.
              </p>
            </div>
            <span className="absolute top-3 right-3 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-xs font-medium text-amber-700">
              Coming soon
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
