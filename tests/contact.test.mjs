import test from "node:test";
import assert from "node:assert/strict";
import { buildWhatsAppUrl, detectAttribution, WHATSAPP_URL } from "../src/lib/contact.ts";

const origin = "https://gm.example/";
for (const [query, referrer, source, medium] of [
  ["?utm_source=google&utm_medium=cpc", "", "google", "cpc"],
  ["?utm_source=instagram&utm_medium=paid_social", "https://google.com/", "instagram", "paid_social"],
  ["?utm_source=IG&utm_medium=social", "", "instagram", "social"],
  ["?utm_source=facebook&utm_medium=paid_social", "", "facebook", "paid_social"],
  ["?gclid=test", "", "google", "cpc"],
  ["?wbraid=test", "", "google", "cpc"],
  ["?gbraid=test", "", "google", "cpc"],
  ["", "https://www.google.com.br/search?q=sites", "google", "organic"],
  ["", "https://l.instagram.com/", "instagram", "referral"],
  ["", "https://m.facebook.com/", "facebook", "referral"],
  ["", "https://www.linkedin.com/", "linkedin", "referral"],
  ["", "https://outro.example/", "referral", "referral"],
  ["", "https://gm.example/projetos", "direct", "(none)"],
  ["", "", "direct", "(none)"],
  ["?fbclid=test", "", "direct", "(none)"],
  ["", "invalido", "direct", "(none)"],
  ["?utm_source=constructor&utm_medium=%3Cscript%3E", "", "other", "(not set)"],
  ["", "https://instagram.com.outro.example/", "referral", "referral"],
]) {
  test(`origem ${source}: ${query || referrer || "sem parâmetros"}`, () => {
    assert.deepEqual(detectAttribution(origin + query, referrer), { source, medium });
  });
}

test("mensagens identificam Google e Instagram e mantêm o foco nos dois serviços", () => {
  for (const [source, label] of [["google", "Vim pelo Google"], ["instagram", "Vim pelo Instagram"]]) {
    const url = new URL(buildWhatsAppUrl(source));
    assert.equal(url.origin, "https://wa.me");
    assert.equal(url.pathname, "/5511983600135");
    assert.ok(url.searchParams.get("text").includes(label));
    assert.ok(url.searchParams.get("text").includes("landing page ou site institucional"));
  }
});

test("link sem JavaScript funciona sem inventar origem", () => {
  assert.ok(new URL(WHATSAPP_URL).searchParams.get("text").includes("origem não identificada"));
});
