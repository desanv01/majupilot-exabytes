import { isIP } from "node:net";

const PRIVATE_V4 = [
  /^10\./, /^127\./, /^169\.254\./, /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./, /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./,
  /^0\./, /^224\./, /^2(?:2[5-9]|3\d)\./, /^24\d\./, /^25\d\./,
];

export function isPublicAddress(address: string) {
  const normalized = address.toLowerCase().split("%")[0];
  if (isIP(normalized) === 4) return !PRIVATE_V4.some((pattern) => pattern.test(normalized));
  if (isIP(normalized) === 6) {
    if (normalized.startsWith("::ffff:")) return isPublicAddress(normalized.slice(7));
    return normalized !== "::" && normalized !== "::1" && !normalized.startsWith("fe8") &&
      !normalized.startsWith("fe9") && !normalized.startsWith("fea") && !normalized.startsWith("feb") &&
      !normalized.startsWith("fc") && !normalized.startsWith("fd") && !normalized.startsWith("ff");
  }
  return false;
}

export function validateWebhookUrl(raw: string, allowedHosts: readonly string[], allowInsecureLocalTest = false) {
  const url = new URL(raw);
  const localTest = allowInsecureLocalTest && url.protocol === "http:" && ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  if (url.protocol !== "https:" && !localTest) throw new Error("WEBHOOK_HTTPS_REQUIRED");
  if (url.username || url.password) throw new Error("WEBHOOK_CREDENTIALS_FORBIDDEN");
  if (!allowedHosts.some((host) => host.toLowerCase() === url.hostname.toLowerCase())) throw new Error("WEBHOOK_HOST_NOT_ALLOWED");
  if (isIP(url.hostname) && !isPublicAddress(url.hostname) && !localTest) throw new Error("WEBHOOK_PRIVATE_ADDRESS");
  return { url, localTest };
}
