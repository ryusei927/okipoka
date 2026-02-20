import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

const ADMIN_EMAIL = (
  process.env.OKIPOKA_ADMIN_EMAIL ?? "okipoka.jp@gmail.com"
).toLowerCase();

// GET: アルバム詳細 + 写真一覧取得
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.email?.toLowerCase() !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  const [albumRes, photosRes] = await Promise.all([
    admin.from("photo_albums").select("*").eq("id", id).single(),
    admin
      .from("photo_album_photos")
      .select("*")
      .eq("album_id", id)
      .order("sort_order", { ascending: true }),
  ]);

  if (albumRes.error) {
    return NextResponse.json(
      { error: albumRes.error.message },
      { status: 404 }
    );
  }

  return NextResponse.json({
    album: albumRes.data,
    photos: photosRes.data || [],
  });
}

// PATCH: アルバム更新
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.email?.toLowerCase() !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { title, description, event_date, is_published, cover_image_url } =
    body;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("photo_albums")
    .update({
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(event_date !== undefined && { event_date }),
      ...(is_published !== undefined && { is_published }),
      ...(cover_image_url !== undefined && { cover_image_url }),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// DELETE: アルバム削除（写真もCASCADEで削除）
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.email?.toLowerCase() !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  // まずストレージの写真を削除
  const { data: photos } = await admin
    .from("photo_album_photos")
    .select("image_url")
    .eq("album_id", id);

  if (photos && photos.length > 0) {
    const paths = photos
      .map((p) => {
        const url = p.image_url;
        const match = url.match(/player-photos\/(.+)/);
        return match ? match[1] : null;
      })
      .filter(Boolean) as string[];

    if (paths.length > 0) {
      await admin.storage.from("player-photos").remove(paths);
    }
  }

  const { error } = await admin.from("photo_albums").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
