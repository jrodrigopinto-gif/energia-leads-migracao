import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // unzipper carrega opcionalmente o SDK da AWS (suporte a streams do S3),
  // que não usamos aqui — mantém como pacote externo para não quebrar o
  // bundling do Turbopack tentando resolver essa dependência opcional.
  serverExternalPackages: ["unzipper"],
};

export default nextConfig;
