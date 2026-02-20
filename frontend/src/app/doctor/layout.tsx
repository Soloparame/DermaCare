import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

export default function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardLayout
      title="Doctor Workspace"
      role="doctor"
      description="Manage appointments and patient records"
    >
      {children}
    </DashboardLayout>
  );
}
