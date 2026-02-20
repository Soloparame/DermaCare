import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardLayout
      title="Admin Console"
      role="admin"
      description="Manage users and platform"
    >
      {children}
    </DashboardLayout>
  );
}
