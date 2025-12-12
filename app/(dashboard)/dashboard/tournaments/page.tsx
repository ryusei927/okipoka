import { createClient } from "@/lib/supabase/server";
import { Plus, Calendar, Pencil, Store } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { format, isSameDay } from "date-fns";
import { ja } from "date-fns/locale";
import { DeleteButton } from "./DeleteButton";
import { TournamentStatus } from "@/components/tournament/TournamentStatus";

export default async function TournamentsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const supabase = await createClient();
  const { tab } = await searchParams;
  const isHistory = tab === "history";

  const now = new Date();
  const nowIso = now.toISOString();
  const sixHoursAgoIso = new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString();

  // クエリの構築
  let query = supabase
    .from("tournaments")
    .select(`
      *,
      shops (name, image_url)
    `);

  if (isHistory) {
    // 過去の大会 (終了分)
    // 締切時間が過ぎている OR (締切未設定 AND 開始から6時間経過)
    query = query
      .or(`late_reg_at.lte.${nowIso},and(late_reg_at.is.null,start_at.lte.${sixHoursAgoIso})`)
      .order("start_at", { ascending: false })
      .limit(50);
  } else {
    // これからの大会 (未来 + 開催中)
    // 締切時間がまだ OR (締切未設定 AND 開始から6時間以内)
    query = query
      .or(`late_reg_at.gt.${nowIso},and(late_reg_at.is.null,start_at.gt.${sixHoursAgoIso})`)
      .order("start_at", { ascending: true });
  }

  const { data: tournaments } = await query;

  // 日付ごとにグループ化
  const groupedTournaments = (tournaments || []).reduce((acc, tournament) => {
    const dateKey = format(new Date(tournament.start_at), "yyyy-MM-dd");
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(tournament);
    return acc;
  }, {} as Record<string, typeof tournaments>);

  const sortedDates = Object.keys(groupedTournaments); // 既にクエリでソート済みなのでキー順で概ねOKだが、念のため

  return (
    <div className="pb-20">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">大会管理</h1>
        <Link
          href="/dashboard/tournaments/new"
          className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-sm hover:bg-orange-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          新規作成
        </Link>
      </header>

      {/* タブ切り替え */}
      <div className="flex p-1 bg-gray-100 rounded-xl mb-6">
        <Link
          href="/dashboard/tournaments"
          className={`flex-1 py-2 text-center text-sm font-bold rounded-lg transition-all ${
            !isHistory ? "bg-white text-orange-500 shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          開催予定
        </Link>
        <Link
          href="/dashboard/tournaments?tab=history"
          className={`flex-1 py-2 text-center text-sm font-bold rounded-lg transition-all ${
            isHistory ? "bg-white text-orange-500 shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          終了分
        </Link>
      </div>

      <div className="space-y-8">
        {sortedDates.map((dateKey) => {
          const dateObj = new Date(dateKey);
          const dayTournaments = groupedTournaments[dateKey];
          
          return (
            <div key={dateKey}>
              <h2 className="text-sm font-bold text-gray-500 mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {format(dateObj, "yyyy年MM月dd日 (E)", { locale: ja })}
              </h2>
              
              <div className="grid gap-4">
                {dayTournaments?.map((tournament: any) => (
                  <div
                    key={tournament.id}
                    className="bg-white p-4 rounded-xl shadow-sm border border-gray-200"
                  >
                    <div className="flex justify-between items-start gap-4 mb-3">
                      <h3 className="font-bold text-gray-900 leading-snug">{tournament.title}</h3>
                      <TournamentStatus 
                        startAt={tournament.start_at} 
                        lateRegAt={tournament.late_reg_at}
                        className="text-lg font-mono whitespace-nowrap"
                      />
                    </div>
                    
                    <div className="flex justify-between items-center">
                      {/* @ts-ignore */}
                      <div className="flex items-center gap-2 bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full text-xs font-medium">
                        <div className="w-4 h-4 relative rounded-full overflow-hidden bg-white shrink-0 border border-gray-200">
                          {tournament.shops?.image_url ? (
                            <Image
                              src={tournament.shops.image_url}
                              alt={tournament.shops.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <Store className="w-2.5 h-2.5 text-gray-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                          )}
                        </div>
                        {tournament.shops?.name}
                      </div>
                      
                      <div className="flex gap-2">
                        <Link
                          href={`/dashboard/tournaments/${tournament.id}`}
                          className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </Link>
                        <DeleteButton id={tournament.id} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {tournaments?.length === 0 && (
          <div className="text-center py-10 text-gray-500">
            {isHistory ? "終了した大会はありません" : "開催予定の大会はありません"}
          </div>
        )}
      </div>
    </div>
  );
}
