import { Sidebar, BottomNav } from "@/components/dashboard/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <BottomNav />
      <main className="lg:pl-60">
        <div className="max-w-5xl mx-auto p-4 pb-20 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
