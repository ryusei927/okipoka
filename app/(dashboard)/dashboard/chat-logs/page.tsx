import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

export default async function ChatLogsPage() {
  const supabase = await createClient();
  
  const { data: logs, error } = await supabase
    .from("chat_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return <div className="p-4 text-red-500">Error loading logs: {error.message}</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">AIチャットログ</h1>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 w-32">日時</th>
                <th className="px-4 py-3 w-24">ユーザー</th>
                <th className="px-4 py-3 w-20">ロール</th>
                <th className="px-4 py-3">メッセージ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs?.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                    {format(new Date(log.created_at), "MM/dd HH:mm", { locale: ja })}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                    {log.user_id ? "会員" : "ゲスト"}
                    <div className="text-[10px] text-gray-400 font-mono">{log.session_id?.substring(0, 6)}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      log.role === 'user' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {log.role === 'user' ? 'User' : 'AI'}
                    </span>
                  </td>
                  <td className="px-4 py-3 max-w-xl break-words">
                    {log.content}
                  </td>
                </tr>
              ))}
              {logs?.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                    ログはまだありません
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
