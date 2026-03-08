/**
 * Email allowlist — these emails bypass the @shap.edu.ph domain restriction.
 * Add or remove emails as needed.
 */
export const EMAIL_ALLOWLIST: string[] = [
  // "external.user@gmail.com",
];

export const ALLOWED_DOMAIN = "shap.edu.ph";

/** Returns true if the email is in the allowlist or ends with the allowed domain. */
export function isEmailAllowed(email: string): boolean {
  if (EMAIL_ALLOWLIST.includes(email.toLowerCase())) return true;
  return email.toLowerCase().endsWith(`@${ALLOWED_DOMAIN}`);
}
