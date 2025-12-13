"use client";

import Link from "next/link";
import { useActionState, useRef, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import { deleteBlogPost, upsertBlogPost, uploadBlogImage, type BlogPostState } from "./actions";
import { useRouter } from "next/navigation";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full flex items-center justify-center gap-2 bg-orange-500 text-white font-bold py-4 rounded-xl shadow-md hover:bg-orange-600 transition-colors disabled:opacity-50"
    >
      <Save className="w-5 h-5" />
      {pending ? "保存中..." : "保存する"}
    </button>
  );
}

const initialState: BlogPostState = {
  message: "",
  error: "",
};

export default function BlogPostForm({ post }: { post?: any }) {
  const router = useRouter();
  const [state, formAction] = useActionState(upsertBlogPost, initialState);
  const [isDeleting, startDelete] = useTransition();
  const [slug, setSlug] = useState<string>(post?.slug || "");
  const contentRef = useRef<HTMLTextAreaElement | null>(null);
  const [inlineImageUrl, setInlineImageUrl] = useState<string>("");
  const [coverUrl, setCoverUrl] = useState<string>(post?.cover_image_url || "");
  const [uploadError, setUploadError] = useState<string>("");
  const [isUploadingCover, startUploadCover] = useTransition();
  const [isUploadingInline, startUploadInline] = useTransition();
  const coverFileRef = useRef<HTMLInputElement | null>(null);
  const inlineFileRef = useRef<HTMLInputElement | null>(null);

  return (
    <form action={formAction} className="space-y-8 pb-20">
      <input type="hidden" name="id" value={post?.id || ""} />
      <input type="hidden" name="published_at" value={post?.published_at || ""} />

      <div className="flex items-center gap-4">
        <Link href="/dashboard/blog" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6 text-gray-500" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          {post ? "記事を編集" : "記事を作成"}
        </h1>

        <div className="ml-auto flex items-center gap-2">
          {post?.id && (
            <button
              type="button"
              disabled={isDeleting}
              onClick={() => {
                if (!confirm("この記事を削除しますか？")) return;
                startDelete(async () => {
                  try {
                    await deleteBlogPost(post.id);
                    router.push("/dashboard/blog");
                    router.refresh();
                  } catch (e: any) {
                    alert(e?.message || "削除に失敗しました");
                  }
                });
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white text-red-600 font-bold text-sm hover:bg-red-50 disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              {isDeleting ? "削除中..." : "削除"}
            </button>
          )}
        </div>
      </div>

      {state.error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold">{state.error}</div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
        <div className="space-y-2">
          <label className="block text-sm font-bold text-gray-700">
            タイトル <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="title"
            defaultValue={post?.title || ""}
            required
            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
            placeholder="例: 大会レビュー：◯◯トーナメント"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700">
              カテゴリ <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="category"
              defaultValue={post?.category || "tournament"}
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
              placeholder="例: tournament / interview / theory / tools"
            />
            <p className="text-xs text-gray-500">カテゴリは一覧のタブになります</p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700">
              slug（URL） <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
              placeholder="例: tournament-review-202512-xx"
            />
            <p className="text-xs text-gray-500">英数字・ハイフン推奨</p>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-bold text-gray-700">概要（一覧/OG用）</label>
          <textarea
            name="excerpt"
            defaultValue={post?.excerpt || ""}
            rows={2}
            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all resize-y"
            placeholder="この記事の要点を1〜2行で"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-bold text-gray-700">カバー画像URL（任意）</label>
          <input
            type="url"
            name="cover_image_url"
            value={coverUrl}
            onChange={(e) => setCoverUrl(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
            placeholder="例: https://.../cover.png"
          />
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              ref={coverFileRef}
              type="file"
              accept="image/*"
              className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-100 file:px-4 file:py-2 file:text-sm file:font-bold file:text-gray-700 hover:file:bg-gray-200"
            />
            <button
              type="button"
              disabled={isUploadingCover}
              onClick={() => {
                setUploadError("");
                const file = coverFileRef.current?.files?.[0];
                if (!file) {
                  setUploadError("カバー画像を選択してください");
                  return;
                }
                startUploadCover(async () => {
                  const fd = new FormData();
                  fd.set("image", file);
                  const res = await uploadBlogImage(fd);
                  if (res?.error) {
                    setUploadError(res.error);
                    return;
                  }
                  if (res?.url) {
                    setCoverUrl(res.url);
                    if (coverFileRef.current) coverFileRef.current.value = "";
                  }
                });
              }}
              className="px-4 py-2 rounded-lg font-bold text-sm bg-white border border-gray-200 hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              {isUploadingCover ? "アップロード中..." : "カバーをアップロード"}
            </button>
          </div>
          {uploadError && <p className="text-xs text-red-600 font-bold">{uploadError}</p>}
          <p className="text-xs text-gray-500">公開側の記事上部と一覧に表示します（URL貼り付け / アップロード対応）</p>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-bold text-gray-700">
            本文（Markdown） <span className="text-red-500">*</span>
          </label>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div className="text-xs font-bold text-gray-700">本文に画像URLを挿入</div>
            <div className="mt-2 flex flex-col sm:flex-row gap-2">
              <input
                ref={inlineFileRef}
                type="file"
                accept="image/*"
                className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-100 file:px-4 file:py-2 file:text-sm file:font-bold file:text-gray-700 hover:file:bg-gray-200"
              />
              <button
                type="button"
                disabled={isUploadingInline}
                onClick={() => {
                  setUploadError("");
                  const file = inlineFileRef.current?.files?.[0];
                  if (!file) {
                    setUploadError("挿入する画像を選択してください");
                    return;
                  }
                  startUploadInline(async () => {
                    const fd = new FormData();
                    fd.set("image", file);
                    const res = await uploadBlogImage(fd);
                    if (res?.error) {
                      setUploadError(res.error);
                      return;
                    }
                    const url = res?.url;
                    const ta = contentRef.current;
                    if (url && ta) {
                      const snippet = `\n\n![](${url})\n\n`;
                      const start = ta.selectionStart ?? ta.value.length;
                      const end = ta.selectionEnd ?? ta.value.length;
                      ta.setRangeText(snippet, start, end, "end");
                      ta.focus();
                      if (inlineFileRef.current) inlineFileRef.current.value = "";
                    }
                  });
                }}
                className="px-4 py-2 rounded-lg font-bold text-sm bg-white border border-gray-200 hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                {isUploadingInline ? "アップロード中..." : "アップロードして挿入"}
              </button>
            </div>
            <div className="mt-2 flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                value={inlineImageUrl}
                onChange={(e) => setInlineImageUrl(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all text-sm"
                placeholder="https://.../image.png"
              />
              <button
                type="button"
                onClick={() => {
                  const url = inlineImageUrl.trim();
                  if (!url) return;
                  const ta = contentRef.current;
                  if (!ta) return;
                  const snippet = `\n\n![](${url})\n\n`;
                  const start = ta.selectionStart ?? ta.value.length;
                  const end = ta.selectionEnd ?? ta.value.length;
                  ta.setRangeText(snippet, start, end, "end");
                  ta.focus();
                  setInlineImageUrl("");
                }}
                className="px-4 py-2 rounded-lg font-bold text-sm bg-white border border-gray-200 hover:bg-gray-100 transition-colors"
              >
                挿入
              </button>
            </div>
            <div className="mt-2 text-[11px] text-gray-500">
              例：<code className="font-mono">![](https://...)</code> をカーソル位置に追加します
            </div>
          </div>
          <textarea
            name="content_md"
            ref={contentRef}
            defaultValue={post?.content_md || ""}
            rows={14}
            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all resize-y font-mono text-sm"
            placeholder="# 見出し\n\n本文..."
            required
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-bold text-gray-700">公開状態</label>
          <select
            name="status"
            defaultValue={post?.status || "draft"}
            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all bg-white"
          >
            <option value="draft">下書き</option>
            <option value="published">公開</option>
          </select>
        </div>
      </div>

      <SubmitButton />
    </form>
  );
}
