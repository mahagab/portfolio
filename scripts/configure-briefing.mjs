import { emitKeypressEvents } from "node:readline";

async function readSecret() {
  if (!process.stdin.isTTY) throw new Error("Execute este comando no terminal local interativo, não no chat.");
  emitKeypressEvents(process.stdin);
  process.stdout.write("Token administrativo do Directus (entrada oculta): ");
  const wasRaw = process.stdin.isRaw;
  process.stdin.setRawMode(true);
  process.stdin.resume();
  return new Promise((resolve, reject) => {
    let secret = "";
    const finish = (error) => {
      process.stdin.off("keypress", onKey);
      process.stdin.setRawMode(Boolean(wasRaw));
      process.stdin.pause();
      process.stdout.write("\n");
      if (error) reject(error); else resolve(secret.trim());
    };
    const onKey = (text, key = {}) => {
      if (key.ctrl && key.name === "c") return finish(new Error("Operação cancelada; nenhuma credencial foi salva."));
      if (key.name === "return" || key.name === "enter") return finish();
      if (key.name === "backspace") { secret = secret.slice(0, -1); return; }
      if (!key.ctrl && !key.meta && text && /^[\x21-\x7e]+$/.test(text)) secret += text;
    };
    process.stdin.on("keypress", onKey);
  });
}

let token;
try {
  token = await readSecret();
  if (!token) throw new Error("Nenhum token informado. Nada foi configurado.");
  process.env.DIRECTUS_ADMIN_TOKEN = token;
  await import("./setup-directus-briefing.mjs");
  process.env.DIRECTUS_ADMIN_TOKEN = token;
  await import("./test-directus-briefing.mjs");
  console.log("Recebimento validado no Directus. Confira os dois registros TESTE no painel.");
  console.log("Antes de ativar PUBLIC_BRIEFING_ENABLED=true na hospedagem, teste o formulário em desenvolvimento para confirmar o CORS do seu domínio.");
} catch (error) {
  const message = error instanceof Error ? error.message : "Não foi possível concluir a configuração.";
  // Não imprimir pilha ou respostas da API que possam conter dados de autenticação.
  console.error(token ? message.split(token).join("[oculto]") : message);
  process.exitCode = 1;
} finally {
  delete process.env.DIRECTUS_ADMIN_TOKEN;
  token = undefined;
}
