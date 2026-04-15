import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { InstallPrompt } from "@/components/InstallPrompt";
import { MarqueeBanner } from "@/components/MarqueeBanner";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <SiteHeader />
      <MarqueeBanner />
      {children}
      <InstallPrompt />
      <SiteFooter />
    </div>
  );
}
