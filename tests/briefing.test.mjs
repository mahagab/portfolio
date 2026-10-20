import test from "node:test";
import assert from "node:assert/strict";
import { parseBriefing } from "../src/lib/briefing.ts";

function form(values) {
  const result = new FormData();
  for (const [key, value] of Object.entries(values)) {
    for (const entry of Array.isArray(value) ? value : [value]) result.append(key, entry);
  }
  return result;
}
export const landingPage = {
  name: "Cliente Teste Landing Page", company: "Studio Exemplo", email: "landing@example.com",
  site_type: "landing_page",
  objective: "Apresentar uma campanha de aulas de pilates e captar pedidos de aula experimental pelo WhatsApp. Preciso de uma página com oferta, benefícios, depoimentos e formulário de contato.",
  materials: ["brand", "copy", "images"], deadline: "15_to_30_days", budget: "1000_to_2000",
};
export const institutional = {
  name: "Cliente Teste Institucional", company: "Consultoria Exemplo", email: "institucional@example.com",
  site_type: "institutional",
  objective: "Apresentar a consultoria com páginas de início, sobre, serviços e contato, para que empresas entendam nossas soluções e peçam uma proposta. Precisamos de ajuda para organizar os textos.",
  materials: ["brand", "domain"], deadline: "1_to_2_months", budget: "above_2000",
};
for (const [label, sample] of [["landing page", landingPage], ["site institucional", institutional]]) {
  test(`simulacao de ${label} inclui escopo, materiais, prazo, investimento e contato`, () => {
    const result = parseBriefing(form(sample));
    assert.deepEqual(result.errors, {});
    assert.deepEqual(result.data, sample);
  });
}
test("campos obrigatorios vazios geram erros", () => {
  const result = parseBriefing(new FormData());
  for (const key of ["name", "email", "site_type", "objective", "materials", "deadline", "budget"]) assert.ok(result.errors[key]);
});
test("aceita duvidas, sem materiais e investimento ainda nao definido", () => {
  assert.deepEqual(parseBriefing(form({...landingPage, company: "", site_type: "not_sure", materials: ["none"], deadline: "not_defined", budget: "not_defined"})).errors, {});
});
test("rejeita email invalido, valores fora das opcoes e materiais contraditorios", () => {
  const result = parseBriefing(form({...landingPage, email: "invalido", site_type: "inventado", materials: ["none", "brand"], budget: "negativo"}));
  for (const key of ["email", "site_type", "materials", "budget"]) assert.ok(result.errors[key]);
});
test("limita o tamanho das respostas e remove campos inesperados", () => {
  const result = parseBriefing(form({...landingPage, name: "a".repeat(101), objective: "x".repeat(1501), token: "nao-enviar"}));
  assert.ok(result.errors.name);
  assert.ok(result.errors.objective);
  assert.ok(!("token" in result.data));
});
