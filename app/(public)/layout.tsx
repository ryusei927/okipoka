import { FooterNavigation } from "@/components/FooterNavigation";
import { SiteFooter } from "@/components/SiteFooter";
import { InstallPrompt } from "@/components/InstallPrompt";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="pb-20">
      {children}
      <InstallPrompt />
      <SiteFooter />
      <FooterNavigation />
    </div>
  );
}
