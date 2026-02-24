import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

export default function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardLayout
      title="Patient Portal"
      role="patient"
      description="Skin consultations, care team chat, and medical history"
    >
      {children}
    </DashboardLayout>
  );
}
