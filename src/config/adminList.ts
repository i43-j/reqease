const ADMIN_EMAILS: string[] = [
  "guest@shap.edu.ph",
];

export function isAdmin(email: string | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}
