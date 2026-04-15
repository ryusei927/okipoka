import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { MembersList } from "./MembersList";

type UserItemRow = {
  user_id: string;
  is_used: boolean | null;
  created_at: string | null;
  expires_at: string | null;
  gacha_items?: {
    name: string | null;
    type: string | null;
    value: number | null;
  } | null;
};

export default async function MembersPage() {
  const supabase = await createClient();

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  const userIds = (profiles || []).map((p: any) => p.id).filter(Boolean);

  const { data: userItems } = userIds.length
    ? await supabase
        .from("user_items")
        .select(
          "user_id,is_used,created_at,expires_at,gacha_items(name,type,value)"
        )
        .in("user_id", userIds)
        .order("created_at", { ascending: false })
    : { data: [] as UserItemRow[] };

  return (
    <div className="pb-20">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">会員管理</h1>
      </header>

      {error && (
        <div className="bg-red-50 p-4 border border-red-200 text-sm text-red-600">
          profiles の取得に失敗しました: {error.message}
        </div>
      )}

      {!error && (
        <MembersList profiles={profiles || []} userItems={(userItems || []) as UserItemRow[]} />
      )}
    </div>
  );
}
