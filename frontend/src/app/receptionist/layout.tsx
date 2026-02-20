import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

export default function ReceptionistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardLayout
      title="Reception Desk"
      role="receptionist"
      description="Manage appointments"
    >
      {children}
    </DashboardLayout>
  );
}
