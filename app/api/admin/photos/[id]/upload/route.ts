import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

const ADMIN_EMAIL = (
  process.env.OKIPOKA_ADMIN_EMAIL ?? "okipoka.jp@gmail.com"
).toLowerCase();

// POST: アルバムに写真をアップロード
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: albumId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.email?.toLowerCase() !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  // アルバムの存在確認
  const { data: album, error: albumError } = await admin
    .from("photo_albums")
    .select("id")
    .eq("id", albumId)
    .single();

  if (albumError || !album) {
    return NextResponse.json({ error: "Album not found" }, { status: 404 });
  }

  const formData = await request.formData();
  const files = formData.getAll("files") as File[];

  if (!files || files.length === 0) {
    return NextResponse.json(
      { error: "No files provided" },
      { status: 400 }
    );
  }

  const uploadedPhotos = [];
  const failedFiles: { name: string; reason: string }[] = [];

  // 現在の最大sort_orderを取得
  const { data: maxSortData } = await admin
    .from("photo_album_photos")
    .select("sort_order")
    .eq("album_id", albumId)
    .order("sort_order", { ascending: false })
    .limit(1);

  let nextSortOrder = (maxSortData?.[0]?.sort_order ?? -1) + 1;

  for (const file of files) {
    // ファイルサイズチェック（50MB上限）
    if (file.size > 50 * 1024 * 1024) {
      failedFiles.push({ name: file.name, reason: "ファイルサイズが50MBを超えています" });
      continue;
    }

    // 対応するMIMEタイプ
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/heic",
      "image/heif",
      "image/svg+xml",
      "image/bmp",
      "image/tiff",
    ];

    // MIMEタイプが空の場合は拡張子で判定
    let contentType = file.type;
    if (!contentType || contentType === "application/octet-stream") {
      const extLower = (file.name.split(".").pop() || "").toLowerCase();
      const extMap: Record<string, string> = {
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        png: "image/png",
        gif: "image/gif",
        webp: "image/webp",
        heic: "image/heic",
        heif: "image/heif",
        svg: "image/svg+xml",
        bmp: "image/bmp",
        tiff: "image/tiff",
        tif: "image/tiff",
      };
      contentType = extMap[extLower] || "image/jpeg";
    }

    if (!allowedTypes.includes(contentType) && !contentType.startsWith("image/")) {
      failedFiles.push({ name: file.name, reason: `非対応の形式です (${contentType})` });
      continue;
    }

    // ファイル名を安全な形式に変換（日本語・特殊文字を除去）
    const extRaw = file.name.split(".").pop() || "jpg";
    const ext = extRaw.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const fileName = `${albumId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    // Storageにアップロード
    const { error: uploadError } = await admin.storage
      .from("player-photos")
      .upload(fileName, file, {
        contentType,
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", file.name, uploadError);
      failedFiles.push({ name: file.name, reason: uploadError.message || "ストレージへのアップロードに失敗" });
      continue;
    }

    // 公開URLを取得
    const {
      data: { publicUrl },
    } = admin.storage.from("player-photos").getPublicUrl(fileName);

    // DBにレコード追加
    const { data: photo, error: insertError } = await admin
      .from("photo_album_photos")
      .insert({
        album_id: albumId,
        image_url: publicUrl,
        sort_order: nextSortOrder,
      })
      .select()
      .single();

    if (!insertError && photo) {
      uploadedPhotos.push(photo);
      nextSortOrder++;
    }
  }

  // photo_countを更新
  const { count } = await admin
    .from("photo_album_photos")
    .select("*", { count: "exact", head: true })
    .eq("album_id", albumId);

  await admin
    .from("photo_albums")
    .update({
      photo_count: count || 0,
      updated_at: new Date().toISOString(),
    })
    .eq("id", albumId);

  // カバー画像が未設定なら最初の画像をセット
  const { data: albumData } = await admin
    .from("photo_albums")
    .select("cover_image_url")
    .eq("id", albumId)
    .single();

  if (!albumData?.cover_image_url && uploadedPhotos.length > 0) {
    await admin
      .from("photo_albums")
      .update({ cover_image_url: uploadedPhotos[0].image_url })
      .eq("id", albumId);
  }

  return NextResponse.json({
    uploaded: uploadedPhotos.length,
    failed: failedFiles.length,
    failedFiles,
    photos: uploadedPhotos,
  });
}

// DELETE: 個別写真を削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: albumId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.email?.toLowerCase() !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { photo_ids } = body as { photo_ids: string[] };

  if (!photo_ids || photo_ids.length === 0) {
    return NextResponse.json(
      { error: "photo_ids required" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // 削除対象の画像URLを取得
  const { data: photos } = await admin
    .from("photo_album_photos")
    .select("image_url")
    .in("id", photo_ids);

  if (photos) {
    const paths = photos
      .map((p) => {
        const match = p.image_url.match(/player-photos\/(.+)/);
        return match ? match[1] : null;
      })
      .filter(Boolean) as string[];

    if (paths.length > 0) {
      await admin.storage.from("player-photos").remove(paths);
    }
  }

  // DBから削除
  await admin
    .from("photo_album_photos")
    .delete()
    .in("id", photo_ids);

  // photo_countを更新
  const { count } = await admin
    .from("photo_album_photos")
    .select("*", { count: "exact", head: true })
    .eq("album_id", albumId);

  await admin
    .from("photo_albums")
    .update({
      photo_count: count || 0,
      updated_at: new Date().toISOString(),
    })
    .eq("id", albumId);

  return NextResponse.json({ success: true });
}
