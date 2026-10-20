import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import { submitBriefing } from "../src/lib/briefing-submit.ts";

const landing = {name:"Cliente Landing",company:"Studio Exemplo",email:"landing@example.com",site_type:"landing_page",objective:"Apresentar uma oferta de pilates com benefícios e depoimentos e receber pedidos de aula experimental.",materials:["brand","copy","images"],deadline:"15_to_30_days",budget:"1000_to_2000"};
const institutional = {...landing,name:"Cliente Institucional",email:"institucional@example.com",site_type:"institutional",objective:"Apresentar a consultoria com início, sobre, serviços e contato, para receber pedidos de proposta de empresas.",materials:["brand","domain"],deadline:"1_to_2_months",budget:"above_2000"};
test("duas simulacoes chegam completas ao receptor HTTP de teste", async () => {
  const received = [];
  const server = createServer(async (request,response) => {
    let body = "";
    for await (const chunk of request) body += chunk;
    assert.equal(request.method,"POST");
    assert.equal(request.headers["content-type"],"application/json");
    assert.equal(request.headers.authorization,undefined);
    received.push(JSON.parse(body));
    response.writeHead(204).end();
  });
  server.listen(0,"127.0.0.1");
  await once(server,"listening");
  try {
    const endpoint = `http://127.0.0.1:${server.address().port}/items/project_briefings`;
    await submitBriefing(endpoint,landing);
    await submitBriefing(endpoint,institutional);
    assert.deepEqual(received,[landing,institutional]);
  } finally { await new Promise(resolve => server.close(resolve)); }
});
for (const status of [400,403,429,500]) test(`nao confirma recebimento em HTTP ${status}`, async () => {
  await assert.rejects(submitBriefing("https://example.com/items/project_briefings",landing,async () => new Response("{}",{status})));
});
test("rejeita pagina HTML de login retornada com HTTP 200", async () => {
  await assert.rejects(submitBriefing("https://example.com",landing,async () => new Response("<html>login</html>",{headers:{"content-type":"text/html"}})));
});
test("aceita resposta JSON do Directus e rejeita erros JSON", async () => {
  await submitBriefing("https://example.com",landing,async () => Response.json({data:{id:"test-id"}}));
  await assert.rejects(submitBriefing("https://example.com",landing,async () => Response.json({errors:[{message:"denied"}]})));
});
test("falhas de rede sao propagadas para preservar as respostas no formulario", async () => {
  await assert.rejects(submitBriefing("https://example.com",landing,async () => {throw new TypeError("Network error");}));
});
