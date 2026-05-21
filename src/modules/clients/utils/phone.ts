export function normalizePhone(phone?: string | null) {
  const trimmed = phone?.trim();

  return trimmed ? trimmed.replace(/\s+/g, " ") : null;
}

export function getPhoneDigits(phone?: string | null) {
  return phone?.replace(/\D/g, "") ?? "";
}

export function formatPhoneInput(value: string) {
  return value.replace(/[^\d+\-\s().]/g, "").replace(/\s+/g, " ").slice(0, 32);
}

export function buildWhatsappLink(phone?: string | null) {
  const digits = getPhoneDigits(phone);

  return digits.length >= 8 ? `https://wa.me/${digits}` : null;
}
