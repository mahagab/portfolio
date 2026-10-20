import type { Briefing } from "./briefing.ts";

/** Sucesso apenas após confirmação do Directus. Nenhuma chave administrativa vai para o navegador. */
export async function submitBriefing(endpoint: string, data: Briefing, send: typeof fetch = fetch) {
  if (!endpoint) throw new Error("Briefing receiver unavailable");
  const response = await send(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    credentials: "omit",
    redirect: "error",
    body: JSON.stringify(data),
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error(`Briefing submission failed: ${response.status}`);
  // Directus pode responder 204 para uma política com criação sem leitura pública.
  if (response.status === 204) return;
  if (!response.headers.get("content-type")?.includes("application/json")) {
    throw new Error("Unconfirmed briefing response");
  }
  const result = await response.json();
  if (!result?.data || result.errors?.length) throw new Error("Unconfirmed briefing response");
}

