export interface AddressParts {
  tipoLogradouro?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  bairro?: string | null;
  uf: string;
  cep?: string | null;
}

export function formatAddress(p: AddressParts): string {
  const rua = [p.tipoLogradouro, p.logradouro].filter(Boolean).join(" ").trim();
  const parts = [
    [rua, p.numero].filter(Boolean).join(", "),
    p.bairro,
    p.uf,
    p.cep,
  ].filter((part) => part && String(part).trim().length > 0);
  return parts.join(" - ");
}

export function googleMapsSearchUrl(p: AddressParts, razaoSocial: string): string {
  const query = `${razaoSocial} ${formatAddress(p)}`.trim();
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function onlyPhoneDigits(value: string | null | undefined): string {
  return (value ?? "").replace(/\D/g, "");
}

/** Telefone completo (DDD + número) só com dígitos, ou null se incompleto. */
export function fullPhone(ddd: string | null | undefined, phone: string | null | undefined): string | null {
  const d = onlyPhoneDigits(ddd);
  const p = onlyPhoneDigits(phone);
  if (!d || !p) return null;
  return `${d}${p}`;
}

export function telUrl(ddd: string | null | undefined, phone: string | null | undefined): string | null {
  const full = fullPhone(ddd, phone);
  return full ? `tel:+55${full}` : null;
}

export function whatsappUrl(ddd: string | null | undefined, phone: string | null | undefined): string | null {
  const full = fullPhone(ddd, phone);
  return full ? `https://wa.me/55${full}` : null;
}

export function mailtoUrl(email: string | null | undefined): string | null {
  if (!email) return null;
  return `mailto:${email}`;
}

export function formatPhoneDisplay(ddd: string | null | undefined, phone: string | null | undefined): string | null {
  const d = onlyPhoneDigits(ddd);
  const p = onlyPhoneDigits(phone);
  if (!d || !p) return null;
  return `(${d}) ${p}`;
}
