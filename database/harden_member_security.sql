-- ============================================================
-- 会員まわりのセキュリティ強化（止血）
--   1) profiles の保護カラムを「本人(ブラウザ)」が書き換えられないようにする
--   2) user_items（クーポン）の不正INSERT・使用済み巻き戻しを防ぐ
--   3) クーポン消し込みはサーバー側RPC(use_coupon)経由のみに限定する
--
-- このファイルはSupabaseのSQL Editorでそのまま実行できます（冪等）。
-- ※ アプリ側の正規処理（サブスク作成/解約/同期）は service role キー経由に
--    変更済みなので、本トリガーの影響を受けません。
-- ============================================================


-- ------------------------------------------------------------
-- 1. profiles: 課金/VIPなどの保護カラムを本人が書き換え不可にする
-- ------------------------------------------------------------
-- 仕組み: ログイン中の一般ユーザー(auth.uid() が非NULL)からのUPDATEでは、
--         保護カラムを更新前(OLD)の値に強制的に戻す。
--         service role(サーバー専用キー)や管理用接続は auth.uid() が NULL の
--         ため影響を受けず、正規の更新は通る。
--         display_name や avatar_url など通常項目の更新はそのまま反映される。

create or replace function public.protect_profile_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- 本人(ブラウザ)からの更新のみ制限する
  if auth.uid() is not null then
    new.subscription_status     := old.subscription_status;
    new.subscription_id         := old.subscription_id;
    new.square_customer_id      := old.square_customer_id;
    new.payment_method          := old.payment_method;
    new.subscription_expires_at := old.subscription_expires_at;
    new.is_vip                  := old.is_vip;
    new.vip_since               := old.vip_since;
    new.vip_expires_at          := old.vip_expires_at;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_protect_profile_columns on public.profiles;
create trigger trg_protect_profile_columns
  before update on public.profiles
  for each row
  execute function public.protect_profile_columns();


-- ------------------------------------------------------------
-- 2. user_items: 本人による直接INSERT/UPDATEを禁止する
-- ------------------------------------------------------------
-- クーポンの付与は spin_gacha()（SECURITY DEFINER）だけが行う。
-- 消し込みは下の use_coupon() だけが行う。
-- どちらも所有者権限で動くため、本人向けのINSERT/UPDATEポリシーは不要。

drop policy if exists "Users can insert their own items" on public.user_items;
drop policy if exists "Users can update their own items" on public.user_items;

-- 閲覧(SELECT)は本人・管理者ともに従来どおり可能（既存ポリシーを維持）。


-- ------------------------------------------------------------
-- 3. クーポン消し込み用RPC（サーバー側で検証して使用済みにする）
-- ------------------------------------------------------------
-- ・本人の未使用・未期限切れクーポンのみ使用済みにできる
-- ・他人のクーポン、二重使用、期限切れ、使用済みの巻き戻しは不可

create or replace function public.use_coupon(p_item_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_item record;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Unauthorized';
  end if;

  select *
    into v_item
  from public.user_items
  where id = p_item_id
    and user_id = v_user_id
  for update;

  if not found then
    raise exception 'Item not found';
  end if;

  if v_item.is_used then
    raise exception 'Already used';
  end if;

  if v_item.expires_at is not null and v_item.expires_at < now() then
    raise exception 'Expired';
  end if;

  update public.user_items
     set is_used = true,
         used_at = now()
   where id = p_item_id
     and user_id = v_user_id
     and is_used = false;

  return jsonb_build_object('success', true, 'id', p_item_id, 'used_at', now());
end;
$$;

revoke all on function public.use_coupon(uuid) from public;
grant execute on function public.use_coupon(uuid) to authenticated;
