import test from "node:test";
import assert from "node:assert/strict";
import { buildSync } from "esbuild";
import { runInNewContext } from "node:vm";

function bundle(adsId) {
  return buildSync({
    entryPoints: ["./src/scripts/contact.ts"], bundle: true, write: false, format: "iife", platform: "browser",
    define: {"import.meta.env.PUBLIC_GOOGLE_ADS_ID": adsId === undefined ? "undefined" : JSON.stringify(adsId)},
  }).outputFiles[0].text;
}
const defaultScript = bundle(undefined);
function simulate({script = defaultScript, analytics = true} = {}) {
  const handlers = new Map();
  class Element {
    constructor(location) { this.dataset = {whatsapp: location}; }
    closest() { return this.dataset.whatsapp ? this : null; }
  }
  const links = ["menu", "hero", "contato"].map(location => new Element(location));
  const events = [];
  runInNewContext(script, {
    URL, Date, Set, Element,
    window: {location: {href: "https://gm.example/?utm_source=google&utm_medium=cpc"}, ...(analytics ? {gtag: (...args) => events.push(args)} : {})},
    document: {referrer: "", querySelectorAll: () => links, addEventListener: (name, fn) => handlers.set(name, fn)},
    sessionStorage: {getItem: () => null, setItem: () => {}},
  });
  return {
    links, events,
    click: (index = 0, extra = {}) => handlers.get("click")({target: links[index], type: "click", button: 0, defaultPrevented: false, ...extra}),
    aux: button => handlers.get("auxclick")({target: links[0], type: "auxclick", button, defaultPrevented: false}),
    pageLoad: () => handlers.get("astro:page-load")(),
    unrelated: () => handlers.get("click")({target: new Element(null), type: "click", button: 0, defaultPrevented: false}),
  };
}
const conversions = client => client.events.filter(event => event[1] === "conversion");
test("carregamento e navegacao nao geram conversoes", () => {
  const client = simulate();
  client.pageLoad();
  assert.equal(client.events.length, 0);
});
for (const [index, name] of ["menu", "hero", "contato"].entries()) {
  test(`clique em ${name} envia uma conversao com o rotulo correto`, () => {
    const client = simulate();
    client.click(index);
    assert.equal(conversions(client).length, 1);
    assert.deepEqual(JSON.parse(JSON.stringify(conversions(client)[0])), ["event", "conversion", {send_to: "AW-18526877385/37bWCMmcmKUdEMntpoJF", value: 1, currency: "BRL"}]);
    assert.equal(client.events.filter(event => event[1] === "whatsapp_click").length, 1);
    assert.equal(client.events[0][2].contact_location, name);
    assert.ok(client.links[index].href.startsWith("https://wa.me/"));
  });
}
test("ignora cliques cancelados, botao direito e outros links", () => {
  const client = simulate();
  client.click(0, {defaultPrevented: true});
  client.aux(2);
  client.unrelated();
  assert.equal(client.events.length, 0);
});
test("clique central e ativacao por teclado sao medidos uma vez", () => {
  const client = simulate();
  client.aux(1);
  assert.equal(conversions(client).length, 1);
  client.click(0, {detail: 0});
  assert.equal(conversions(client).length, 2);
});
test("repreparar links nao duplica o envio", () => {
  const client = simulate();
  client.pageLoad(); client.pageLoad(); client.click();
  assert.equal(conversions(client).length, 1);
});
test("funciona sem gtag e preserva o link do WhatsApp", () => {
  const client = simulate({analytics: false});
  assert.doesNotThrow(() => client.click());
  assert.ok(client.links[0].href.includes("wa.me/5511983600135"));
});
for (const adsId of ["", "AW-999999999"]) {
  test(`nao envia para a conta antiga com Ads configurado como ${adsId || "desativado"}`, () => {
    const client = simulate({script: bundle(adsId)});
    client.click();
    assert.equal(conversions(client).length, 0);
  });
}
