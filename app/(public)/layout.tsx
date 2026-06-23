import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { InstallPrompt } from "@/components/InstallPrompt";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-[#eef1f4] min-h-screen">
      <SiteHeader />
      <main className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-1/2 hidden w-full max-w-6xl -translate-x-1/2 border-x border-[#d5dbe1] shadow-[8px_0_18px_-18px_rgba(0,0,0,0.45),-8px_0_18px_-18px_rgba(0,0,0,0.45)] md:block" />
        <div className="relative">
          {children}
        </div>
      </main>
      <InstallPrompt />
      <SiteFooter />
    </div>
  );
}
