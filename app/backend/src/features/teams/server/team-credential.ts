import crypto from "crypto";

export const CERT_CREDENTIAL_PREFIX = "CERT";
export const TEAM_CREDENTIAL_PREFIX = "TEAM";

/** Zero-padded team number segment (min width 2), e.g. 1 -> "01", 12 -> "12", 123 -> "123". */
export function formatTeamNumber(teamNumber: number): string {
  return String(Math.max(Math.trunc(teamNumber), 0)).padStart(2, "0");
}

/** Format a date as YYYYMMDD (UTC) for use in credential strings. */
export function formatCredentialDate(date: Date): string {
  return date.toISOString().split("T")[0].replace(/-/g, "");
}

/**
 * Build a team-member credential in the format TEAM-<teamNumber>-<YYYYMMDD>-<hex>,
 * mirroring the CERT-<YYYYMMDD>-<hex> scheme used for membership certificates.
 * Example: TEAM-01-20260720-4A8F
 */
export function generateTeamMemberCredential(params: {
  teamNumber: number;
  date?: Date;
  hash?: string;
}): string {
  const date = params.date ?? new Date();
  const hash = params.hash ?? crypto.randomBytes(2).toString("hex").toUpperCase();
  return `TEAM-${formatTeamNumber(params.teamNumber)}-${formatCredentialDate(date)}-${hash}`;
}

/** Which lookup table a verification code targets, based on its prefix. */
export function classifyCredential(code: string): "team" | "cert" {
  return code.trim().toUpperCase().startsWith(TEAM_CREDENTIAL_PREFIX) ? "team" : "cert";
}
