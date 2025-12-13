"use client";

import { useState, useRef } from "react";
import { Camera, Loader2 } from "lucide-react";
import { updateProfile } from "../actions";
import Image from "next/image";
import { useRouter } from "next/navigation";

type Profile = {
  display_name: string | null;
  avatar_url: string | null;
};

export function ProfileForm({ profile }: { profile: Profile | null }) {
  const router = useRouter();
  const [previewUrl, setPreviewUrl] = useState<string | null>(profile?.avatar_url || null);
  const [isPending, setIsPending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleSubmit = async (formData: FormData) => {
    setIsPending(true);
    try {
      const result = await updateProfile(formData);
      if (result?.error) {
        alert(result.error);
        if (result.error === "ログインしてください") {
          router.push("/login");
        }
      } else if (result?.success) {
        router.push("/member");
        router.refresh();
      }
    } catch (error) {
      console.error(error);
      alert(`エラーが発生しました: ${error instanceof Error ? error.message : "不明なエラー"}`);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <form action={handleSubmit} className="space-y-6">
      {/* アバター画像 */}
      <div className="flex justify-center">
        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
          <div className="w-24 h-24 rounded-full bg-gray-200 border-4 border-white shadow-sm overflow-hidden relative">
            {previewUrl ? (
              <Image
                src={previewUrl}
                alt="Avatar"
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <span className="text-2xl font-bold">{profile?.display_name?.charAt(0) || "G"}</span>
              </div>
            )}
          </div>
          <div className="absolute bottom-0 right-0 p-2 bg-orange-500 text-white rounded-full shadow-md group-hover:bg-orange-600 transition-colors">
            <Camera className="w-4 h-4" />
          </div>
          <input
            type="file"
            name="avatar"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="displayName" className="block text-sm font-bold text-gray-700">
          表示名
        </label>
        <input
          type="text"
          id="displayName"
          name="displayName"
          defaultValue={profile?.display_name || ""}
          placeholder="表示名を入力"
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
          required
        />
      </div>

      <div className="pt-4">
        <button
          type="submit"
          disabled={isPending}
          className="w-full py-3 px-4 bg-orange-500 text-white font-bold rounded-xl shadow-sm hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          保存する
        </button>
      </div>
    </form>
  );
}
