const ADMIN_EMAILS: string[] = [
  // Add admin emails here, e.g.:
  // "admin@shap.edu.ph",
];

export function isAdmin(email: string | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}
