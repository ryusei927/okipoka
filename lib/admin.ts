export const ADMIN_EMAIL = (
  process.env.OKIPOKA_ADMIN_EMAIL ?? "okipoka.jp@gmail.com"
).toLowerCase();

export function isAdminEmail(email: string | null | undefined): boolean {
  return (email ?? "").toLowerCase() === ADMIN_EMAIL;
}
