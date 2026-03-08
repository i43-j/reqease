const ADMIN_EMAILS: string[] = [
  "workingforthebigg@gmail.com",
];

/** Returns true if the given email is in the admin list. Controls visibility of the Review tab. */
export function isAdmin(email: string | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}
