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
      {children}
      <InstallPrompt />
      <SiteFooter />
    </div>
  );
}
