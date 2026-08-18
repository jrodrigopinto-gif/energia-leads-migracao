import { MercadoPagoConfig, Preference, Payment } from "mercadopago";

function getClient() {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) return null;
  return new MercadoPagoConfig({ accessToken });
}

export function isMercadoPagoConfigured() {
  return Boolean(process.env.MERCADOPAGO_ACCESS_TOKEN);
}

export function getPreferenceClient() {
  const client = getClient();
  if (!client) throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurado");
  return new Preference(client);
}

export function getPaymentClient() {
  const client = getClient();
  if (!client) throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurado");
  return new Payment(client);
}
