/**
 * Layout dos arquivos de Dados Abertos do CNPJ (Receita Federal).
 * Referência: https://www.gov.br/receitafederal/dados/cnpj-metadados.pdf
 * Arquivos são CSV com ";" como separador, sem cabeçalho, encoding latin1.
 */

export const ESTABELECIMENTO_COLUMNS = [
  "cnpjBasico",
  "cnpjOrdem",
  "cnpjDv",
  "identificadorMatrizFilial",
  "nomeFantasia",
  "situacaoCadastral",
  "dataSituacaoCadastral",
  "motivoSituacaoCadastral",
  "nomeCidadeExterior",
  "pais",
  "dataInicioAtividade",
  "cnaeFiscalPrincipal",
  "cnaeFiscalSecundaria",
  "tipoLogradouro",
  "logradouro",
  "numero",
  "complemento",
  "bairro",
  "cep",
  "uf",
  "municipio",
  "ddd1",
  "telefone1",
  "ddd2",
  "telefone2",
  "dddFax",
  "fax",
  "correioEletronico",
  "situacaoEspecial",
  "dataSituacaoEspecial",
] as const;

export const EMPRESA_COLUMNS = [
  "cnpjBasico",
  "razaoSocial",
  "naturezaJuridica",
  "qualificacaoResponsavel",
  "capitalSocial",
  "porteEmpresa",
  "enteFederativoResponsavel",
] as const;

export const PORTE_EMPRESA: Record<string, string> = {
  "00": "Não informado",
  "01": "Micro Empresa",
  "03": "Empresa de Pequeno Porte",
  "05": "Demais (Médio/Grande Porte)",
};

export const SITUACAO_CADASTRAL: Record<string, string> = {
  "01": "Nula",
  "02": "Ativa",
  "03": "Suspensa",
  "04": "Inapta",
  "08": "Baixada",
};

export type EstabelecimentoRow = Record<(typeof ESTABELECIMENTO_COLUMNS)[number], string>;
export type EmpresaRow = Record<(typeof EMPRESA_COLUMNS)[number], string>;

function splitRfbLine(line: string): string[] {
  // Campos vêm entre aspas duplas e separados por ";"; não há ";" dentro de aspas
  // nestes arquivos, então um split simples com remoção de aspas é suficiente.
  return line.split(";").map((field) => field.replace(/^"|"$/g, "").trim());
}

export function parseEstabelecimentoLine(line: string): EstabelecimentoRow | null {
  const fields = splitRfbLine(line);
  if (fields.length < ESTABELECIMENTO_COLUMNS.length) return null;
  const row = {} as EstabelecimentoRow;
  ESTABELECIMENTO_COLUMNS.forEach((col, i) => {
    row[col] = fields[i] ?? "";
  });
  return row;
}

export function parseEmpresaLine(line: string): EmpresaRow | null {
  const fields = splitRfbLine(line);
  if (fields.length < EMPRESA_COLUMNS.length) return null;
  const row = {} as EmpresaRow;
  EMPRESA_COLUMNS.forEach((col, i) => {
    row[col] = fields[i] ?? "";
  });
  return row;
}

export function parseCapitalSocial(raw: string): number | null {
  if (!raw) return null;
  const normalized = raw.replace(/\./g, "").replace(",", ".");
  const value = Number.parseFloat(normalized);
  return Number.isFinite(value) ? value : null;
}
