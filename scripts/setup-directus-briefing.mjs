import { isDeepStrictEqual } from "node:util";
import { SITE_TYPES, MATERIALS, DEADLINES, BUDGETS } from "../src/lib/briefing.ts";

// Somente ferramenta local de administração. Nunca importada pelo site.
try { process.loadEnvFile(); } catch { /* Variáveis também podem vir do ambiente. */ }
const base = process.env.PUBLIC_DIRECTUS_URL?.replace(/\/+$/, "");
const token = process.env.DIRECTUS_ADMIN_TOKEN;
delete process.env.DIRECTUS_ADMIN_TOKEN;
if (!base || !token) throw new Error("Configure PUBLIC_DIRECTUS_URL e DIRECTUS_ADMIN_TOKEN apenas no ambiente local.");
const collection = "project_briefings";
const fieldNames = ["name", "company", "email", "site_type", "objective", "materials", "deadline", "budget"];
const selected = options => ({ interface: "select-dropdown", options: { choices: options.map(option => ({text: option.label, value: option.value})) } });
const textField = (field, label, length, required = true) => ({ field, type: "string", schema: {max_length: length, is_nullable: !required}, meta: {interface: "input", required, note: label} });
const definition = {
  collection, schema: {},
  meta: {icon: "assignment", note: "Briefings recebidos pelo site. Dados pessoais: não conceder leitura pública.", display_template: "{{name}} — {{company}}", sort_field: null},
  fields: [
    {field: "id", type: "uuid", schema: {is_primary_key: true, is_nullable: false}, meta: {special: ["uuid"], interface: "input", hidden: true, readonly: true}},
    {field: "date_created", type: "timestamp", schema: {is_nullable: true}, meta: {special: ["date-created"], interface: "datetime", readonly: true, hidden: true}},
    textField("name", "Nome", 100), textField("company", "Empresa", 120, false), textField("email", "E-mail para retorno", 254),
    {...textField("site_type", "Tipo de site", 40), meta: {...selected(SITE_TYPES), required: true}},
    {field: "objective", type: "text", schema: {is_nullable: false}, meta: {interface: "input-multiline", required: true, note: "Objetivo, público e páginas ou seções necessárias."}},
    {field: "materials", type: "json", schema: {is_nullable: false}, meta: {interface: "select-multiple-dropdown", required: true, options: {choices: MATERIALS.map(option => ({text: option.label, value: option.value}))}}},
    {...textField("deadline", "Prazo desejado", 40), meta: {...selected(DEADLINES), required: true}},
    {...textField("budget", "Faixa de investimento", 40), meta: {...selected(BUDGETS), required: true}},
  ],
};
const validation = {_and: [
  {name: {_regex: "^.{2,100}$"}},
  {email: {_regex: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$"}},
  {objective: {_regex: "^[\\s\\S]{20,1500}$"}},
  {site_type: {_in: SITE_TYPES.map(option => option.value)}},
  {deadline: {_in: DEADLINES.map(option => option.value)}},
  {budget: {_in: BUDGETS.map(option => option.value)}},
  {materials: {_nempty: true}},
]};
async function api(path, method = "GET", body, authenticated = true) {
  const response = await fetch(`${base}${path}`, {
    method, headers: {"Content-Type": "application/json", ...(authenticated ? {Authorization: `Bearer ${token}`} : {})},
    ...(body ? {body: JSON.stringify(body)} : {}), signal: AbortSignal.timeout(20000), redirect: "error",
  });
  if (!response.ok) throw new Error(`Directus: HTTP ${response.status} em ${method} ${path.split("?")[0]}. Nenhum token foi registrado.`);
  return response.status === 204 ? null : (await response.json()).data;
}
const collections = await api("/collections");
if (!collections.some(item => item.collection === collection)) {
  await api("/collections", "POST", definition);
  console.log("Coleção de briefings criada.");
} else {
  const fields = await api(`/fields/${collection}`);
  if (!fieldNames.every(field => fields.some(existing => existing.field === field))) {
    throw new Error("A coleção já existe com campos diferentes. Nenhuma migração automática foi aplicada.");
  }
  console.log("Coleção existente preservada.");
}
// Uma política dedicada, sem tocar nas permissões das demais coleções.
const policyName = "GM briefing: envio público";
const policies = await api("/policies?limit=-1");
let policy = policies.find(item => item.name === policyName);
if (policy?.admin_access || policy?.app_access) throw new Error("A política existente tem acesso amplo. Revise-a antes de continuar.");
if (!policy) policy = await api("/policies", "POST", {name: policyName, icon: "assignment", admin_access: false, app_access: false});
const permissions = await api("/permissions?limit=-1");
if (permissions.some(permission => permission.policy === policy.id && (permission.action !== "create" || permission.collection !== collection))) {
  throw new Error("A política dedicada contém outras ações. Revise-a antes de continuar.");
}
const publicAccesses = await api("/access?limit=-1");
const publicPolicyIds = publicAccesses.filter(access => access.role === null && access.user === null).map(access => typeof access.policy === "object" ? access.policy.id : access.policy);
if (permissions.some(permission => publicPolicyIds.includes(permission.policy) && [collection, "*"].includes(permission.collection) && ["read", "update", "delete", "share"].includes(permission.action))) {
  throw new Error("Outra política pública permite consultar ou alterar briefings. Revise esse acesso antes de publicar.");
}
const existing = permissions.find(permission => permission.policy === policy.id && permission.collection === collection && permission.action === "create");
if (existing && (!isDeepStrictEqual(existing.validation, validation) || existing.fields?.some(field => !["id", ...fieldNames].includes(field)))) throw new Error("A permissão existente difere da configuração esperada. Revise-a no painel antes de continuar.");
if (!existing) await api("/permissions", "POST", {policy: policy.id, collection, action: "create", fields: ["id", ...fieldNames], permissions: {}, validation});
if (!publicPolicyIds.includes(policy.id)) await api("/access", "POST", {role: null, user: null, policy: policy.id});
console.log("Envio público configurado sem liberar leitura, alteração ou exclusão dos briefings.");
console.log("Confira o CORS para o domínio do site e execute scripts/test-directus-briefing.mjs para validar o recebimento real.");


