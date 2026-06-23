import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { BackLink } from "@/components/BackLink";
import { ProfileForm } from "./profile-form";

export default async function ProfileEditPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="p-4 max-w-md mx-auto">
        <div className="pt-2 mb-6">
          <BackLink className="mb-4" />
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">プロフィール編集</h1>
        </div>
        <ProfileForm profile={profile} />
      </div>
    </div>
  );
}
