import { FooterNavigation } from "@/components/FooterNavigation";
import { SiteFooter } from "@/components/SiteFooter";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="pb-20">
      {children}
      <SiteFooter />
      <FooterNavigation />
    </div>
  );
}
