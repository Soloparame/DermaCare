import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

export default function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardLayout
      title="Dermatologist Workspace"
      role="doctor"
      description="Confirmed consultations, prescriptions, and patient records"
    >
      {children}
    </DashboardLayout>
  );
}
