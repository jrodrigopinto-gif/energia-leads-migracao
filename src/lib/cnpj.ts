export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/** Retorna a raiz do CNPJ (8 primeiros dígitos), que identifica a empresa
 * independentemente da filial/ordem/dígito verificador. É a chave usada
 * para cruzar candidatos (RFB) com migrados (CCEE). */
export function cnpjRaiz(cnpj: string): string {
  return onlyDigits(cnpj).slice(0, 8);
}

export function formatCnpj(cnpj: string): string {
  const d = onlyDigits(cnpj).padStart(14, "0");
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12, 14)}`;
}
