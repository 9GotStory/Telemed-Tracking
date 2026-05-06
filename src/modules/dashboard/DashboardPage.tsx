import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useDashboardStats } from "./useDashboard";
import { StatsCards } from "./StatsCards";
import { EquipmentStatusGrid } from "./EquipmentStatusGrid";
import { UpcomingAppointments } from "./UpcomingAppointments";
import { AttendanceChart } from "./AttendanceChart";
import { FollowupPipeline } from "./FollowupPipeline";
import { OverviewTab } from "./OverviewTab";
import { useDebugMount } from "@/hooks/useDebugLog";
import { format, addDays } from "date-fns";
import { Link } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { isModuleAllowed } from "@/utils/roleGuard";
import {
  Activity,
  LogIn,
  Monitor,
  ClipboardCheck,
  Calendar,
  FileUp,
  Pill,
  Phone,
  Package,
  Users,
  Settings,
} from "lucide-react";
interface ModuleLink {
  to: string;
  label: string;
  icon: React.ReactNode;
  module: string;
}

const MODULE_LINKS: ModuleLink[] = [
  {
    to: "/module3",
    label: "ตารางคลินิก",
    icon: <Calendar className="h-5 w-5" />,
    module: "module3",
  },
  {
    to: "/module4",
    label: "นำเข้าข้อมูล",
    icon: <FileUp className="h-5 w-5" />,
    module: "module4",
  },
  {
    to: "/module5",
    label: "ยืนยันรายการยา",
    icon: <Pill className="h-5 w-5" />,
    module: "module5",
  },
  {
    to: "/module6",
    label: "ติดตามผู้ป่วย",
    icon: <Phone className="h-5 w-5" />,
    module: "module6",
  },
  {
    to: "/module1",
    label: "ทะเบียนอุปกรณ์",
    icon: <Monitor className="h-5 w-5" />,
    module: "module1",
  },
  {
    to: "/module2",
    label: "ตรวจสอบความพร้อม",
    icon: <ClipboardCheck className="h-5 w-5" />,
    module: "module2",
  },
  {
    to: "/master-drugs",
    label: "คลังชื่อยา",
    icon: <Package className="h-5 w-5" />,
    module: "master-drugs",
  },
  {
    to: "/users",
    label: "จัดการผู้ใช้",
    icon: <Users className="h-5 w-5" />,
    module: "users",
  },
  {
    to: "/settings",
    label: "ตั้งค่าระบบ",
    icon: <Settings className="h-5 w-5" />,
    module: "settings",
  },
];

export default function DashboardPage() {
  useDebugMount("DashboardPage");
  const { data: stats, isLoading, error } = useDashboardStats();
  const { user, isAuthenticated } = useAuthStore();

  const appName = import.meta.env.VITE_APP_NAME || "Telemed Tracking";

  if (isLoading) {
    return (
      <div className="min-h-svh flex items-center justify-center bg-[#f5f5f7]">
        <LoadingSpinner text="กำลังโหลดข้อมูล..." />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="min-h-svh flex items-center justify-center bg-[#f5f5f7]">
        <div className="text-center">
          <p className="text-[#1d1d1f] text-lg font-semibold">
            ไม่สามารถโหลดข้อมูลได้
          </p>
          <p className="text-[rgba(0,0,0,0.48)] text-sm mt-2">
            {error?.message ?? "Unknown error"}
          </p>
        </div>
      </div>
    );
  }

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const tomorrowStr = format(addDays(new Date(), 1), "yyyy-MM-dd");
  const todayAppts = stats.upcoming_appointments.filter(
    (a) => a.service_date === todayStr,
  );
  const tomorrowAppts = stats.upcoming_appointments.filter(
    (a) => a.service_date === tomorrowStr,
  );

  const visibleModules =
    isAuthenticated && user
      ? MODULE_LINKS.filter((m) =>
          isModuleAllowed(m.module, user.role),
        )
      : [];

  return (
    <div className="min-h-svh bg-[#f5f5f7]">
      {/* Hero — dark background */}
      <section className="bg-[#000000] text-white py-16">
        <div className="max-w-[980px] mx-auto px-4">
          <h1
            className="text-3xl md:text-5xl font-semibold tracking-tight leading-[1.07]"
            style={{ letterSpacing: "-0.28px" }}
          >
            {appName}
          </h1>
          <p className="text-white/70 mt-3 text-lg md:text-xl leading-relaxed">
            ระบบติดตามการดำเนินงาน Telemedicine — สสอ.สอง จังหวัดแพร่
          </p>
          {/* Quick summary pills */}
          <div className="flex flex-wrap gap-3 mt-6">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-sm">
              <Activity className="h-4 w-4 text-[#2997ff]" />
              วันนี้ {todayAppts.reduce((s, a) => s + a.appoint_count, 0)} นัด
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-sm">
              พรุ่งนี้ {tomorrowAppts.reduce((s, a) => s + a.appoint_count, 0)}{" "}
              นัด
            </span>
          </div>

          {/* Authenticated user info + login button */}
          {isAuthenticated && user ? (
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <div className="rounded-full bg-white/10 px-4 py-2 text-sm">
                <span className="text-white/60">สวัสดี </span>
                <span className="font-medium">{user.first_name}</span>
              </div>
            </div>
          ) : (
            <div className="mt-8">
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white text-black hover:bg-white/90 px-6 py-2 text-sm font-medium transition-colors"
              >
                <LogIn className="h-4 w-4" />
                เข้าสู่ระบบ
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Module shortcuts — authenticated only */}
      {visibleModules.length > 0 && (
        <div className="max-w-[980px] mx-auto px-4 -mt-6">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {visibleModules.map((m) => (
              <Link
                key={m.to}
                to={m.to}
                className="flex flex-col items-center gap-2 rounded-xl bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.1)] transition-shadow text-center group"
              >
                <span className="text-[#86868b] group-hover:text-[#1d1d1f] transition-colors">
                  {m.icon}
                </span>
                <span className="text-xs font-medium text-[#1d1d1f] leading-tight">
                  {m.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="max-w-[980px] mx-auto px-4 py-10">
        <Tabs defaultValue="current">
          <TabsList variant="line" className="mb-8">
            <TabsTrigger value="current">เดือนนี้</TabsTrigger>
            <TabsTrigger value="overview">ภาพรวม</TabsTrigger>
          </TabsList>

          <TabsContent value="current" className="flex flex-col gap-12">
            {/* Key Metrics */}
            <section>
              <StatsCards stats={stats} />
            </section>

            {/* Equipment Readiness */}
            <section>
              <h2
                className="text-2xl font-semibold text-[#1d1d1f] mb-5 tracking-tight"
                style={{ letterSpacing: "-0.01em" }}
              >
                สถานะความพร้อมอุปกรณ์
              </h2>
              <EquipmentStatusGrid items={stats.equipment_status} />
            </section>

            {/* Upcoming Appointments */}
            <section className="rounded-lg bg-white p-6 shadow-[0_3px_15px_rgba(0,0,0,0.08)]">
              <h2
                className="text-2xl font-semibold text-[#1d1d1f] mb-5 tracking-tight"
                style={{ letterSpacing: "-0.01em" }}
              >
                วันที่นัดหมาย
              </h2>
              <UpcomingAppointments appointments={stats.upcoming_appointments} />
            </section>

            {/* Attendance by Facility */}
            <section>
              <h2
                className="text-2xl font-semibold text-[#1d1d1f] mb-5 tracking-tight"
                style={{ letterSpacing: "-0.01em" }}
              >
                อัตราการเข้ารับบริการ
              </h2>
              <AttendanceChart data={stats.attendance_by_facility} appointments={stats.upcoming_appointments} />
            </section>

            {/* Follow-up Status */}
            <section>
              <h2
                className="text-2xl font-semibold text-[#1d1d1f] mb-5 tracking-tight"
                style={{ letterSpacing: "-0.01em" }}
              >
                สถานะการติดตามผู้ป่วย
              </h2>
              <FollowupPipeline pipeline={stats.followup_pipeline} />
            </section>
          </TabsContent>

          <TabsContent value="overview">
            <OverviewTab stats={stats} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer */}
      <footer className="bg-[#f5f5f7] py-6">
        <div className="max-w-[980px] mx-auto px-4 text-center">
          <p className="text-xs text-[rgba(0,0,0,0.48)]">
            {appName} — สสอ.สอง จังหวัดแพร่ ·{" "}
            <Link to="/about" className="text-[#0066cc] hover:underline">
              เกี่ยวกับระบบ
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
