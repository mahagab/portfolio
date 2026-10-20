import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { parseBriefing } from "../src/lib/briefing.ts";
import { submitBriefing } from "../src/lib/briefing-submit.ts";
try { process.loadEnvFile(); } catch {}
const base = process.env.PUBLIC_DIRECTUS_URL?.replace(/\/+$/, "");
const token = process.env.DIRECTUS_ADMIN_TOKEN;
delete process.env.DIRECTUS_ADMIN_TOKEN;
if (!base || !token) throw new Error("Configure PUBLIC_DIRECTUS_URL e DIRECTUS_ADMIN_TOKEN apenas no ambiente local.");
const samples = [
  {name: "TESTE — Landing page", company: "Studio Exemplo", email: "landing@example.com", site_type: "landing_page", objective: "Divulgar aulas de pilates e receber pedidos de aula experimental. Uma página com oferta, benefícios, depoimentos e chamada para contato.", materials: ["brand", "copy", "images"], deadline: "15_to_30_days", budget: "1000_to_2000"},
  {name: "TESTE — Institucional", company: "Consultoria Exemplo", email: "institucional@example.com", site_type: "institutional", objective: "Apresentar a consultoria para empresas. Preciso de início, sobre, serviços e contato, com pedidos de proposta. Precisamos de apoio para organizar os textos.", materials: ["brand", "domain"], deadline: "1_to_2_months", budget: "above_2000"},
];
for (const sample of samples) {
  const form = new FormData();
  for (const [key, value] of Object.entries(sample)) for (const entry of Array.isArray(value) ? value : [value]) form.append(key, entry);
  const {data, errors} = parseBriefing(form);
  assert.deepEqual(errors, {});
  const id = randomUUID();
  await submitBriefing(`${base}/items/project_briefings`, {...data, id});
  const response = await fetch(`${base}/items/project_briefings/${id}`, {headers: {Authorization: `Bearer ${token}`}, signal: AbortSignal.timeout(20000)});
  assert.ok(response.ok, "O administrador precisa confirmar o item salvo.");
  const stored = (await response.json()).data;
  for (const [key, value] of Object.entries(data)) assert.deepEqual(stored[key], value, `Campo ${key} não foi persistido corretamente.`);
  console.log(`Recebimento confirmado: ${sample.site_type}. Registro de teste: ${id}`);
}
const publicRead = await fetch(`${base}/items/project_briefings?limit=1`, {signal: AbortSignal.timeout(20000)});
assert.ok([401,403,404].includes(publicRead.status), "A coleção não pode permitir leitura pública.");
console.log("Duas submissões persistidas e leitura pública bloqueada. Os registros TESTE permanecem no Directus para sua conferência.");
