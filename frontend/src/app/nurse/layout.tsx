import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

export default function NurseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardLayout
      title="Nurse Station"
      role="nurse"
      description="Today's patients"
    >
      {children}
    </DashboardLayout>
  );
}
