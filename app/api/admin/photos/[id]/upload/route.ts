import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

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

  // 現在の最大sort_orderを取得
  const { data: maxSortData } = await admin
    .from("photo_album_photos")
    .select("sort_order")
    .eq("album_id", albumId)
    .order("sort_order", { ascending: false })
    .limit(1);

  let nextSortOrder = (maxSortData?.[0]?.sort_order ?? -1) + 1;

  for (const file of files) {
    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `${albumId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    // Storageにアップロード
    const { error: uploadError } = await admin.storage
      .from("player-photos")
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
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
