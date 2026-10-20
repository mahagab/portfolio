import { parseBriefing, type BriefingField } from "../lib/briefing";
import { submitBriefing } from "../lib/briefing-submit";

function initializeBriefing() {
  const form = document.querySelector<HTMLFormElement>("#project-briefing");
  if (!form || form.dataset.initialized) return;
  form.dataset.initialized = "true";
  const fields = form.querySelector<HTMLFieldSetElement>("#briefing-fields")!;
  const errorSummary = form.querySelector<HTMLElement>("#briefing-errors")!;
  const progress = form.querySelector<HTMLElement>("#briefing-progress")!;
  const button = form.querySelector<HTMLButtonElement>("#briefing-submit")!;
  const success = document.querySelector<HTMLElement>("#briefing-success")!;
  let pending = false;
  fields.disabled = false;

  form.querySelectorAll<HTMLInputElement>('input[name="materials"]').forEach(input => {
    input.addEventListener("change", () => {
      if (!input.checked) return;
      form.querySelectorAll<HTMLInputElement>('input[name="materials"]').forEach(other => {
        if (other !== input && (input.value === "none" || other.value === "none")) other.checked = false;
      });
    });
  });
  form.addEventListener("submit", async event => {
    event.preventDefault();
    if (pending) return;
    errorSummary.hidden = true;
    form.querySelectorAll<HTMLElement>(".briefing-field-error").forEach(error => { error.hidden = true; error.textContent = ""; });
    form.querySelectorAll<HTMLElement>('[aria-invalid="true"]').forEach(input => input.removeAttribute("aria-invalid"));
    const { data, errors } = parseBriefing(new FormData(form));
    if (Object.keys(errors).length) {
      const list = document.createElement("ul");
      for (const [field, message] of Object.entries(errors) as [BriefingField, string][]) {
        const error = form.querySelector<HTMLElement>(`#error-${field}`)!;
        error.textContent = message;
        error.hidden = false;
        form.querySelectorAll<HTMLElement>(`[name="${field}"]`).forEach(input => input.setAttribute("aria-invalid", "true"));
        const li = document.createElement("li");
        li.textContent = message;
        list.append(li);
      }
      errorSummary.replaceChildren(list);
      errorSummary.hidden = false;
      errorSummary.focus();
      return;
    }
    pending = true;
    fields.disabled = true;
    form.setAttribute("aria-busy", "true");
    button.textContent = "Enviando…";
    progress.hidden = false;
    try {
      await submitBriefing(form.dataset.endpoint ?? "", data);
      form.hidden = true;
      success.hidden = false;
      success.focus();
    } catch {
      // Preservar todas as respostas, inclusive se a rede cair ou o Directus negar o envio.
      errorSummary.textContent = "Não foi possível confirmar o envio. Suas respostas continuam aqui. Tente novamente em instantes. Se o problema persistir, entre em contato pelo WhatsApp.";
      errorSummary.hidden = false;
      errorSummary.focus();
    } finally {
      pending = false;
      fields.disabled = false;
      button.textContent = "Enviar detalhes do projeto";
      progress.hidden = true;
      form.removeAttribute("aria-busy");
    }
  });
}
initializeBriefing();
document.addEventListener("astro:page-load", initializeBriefing);
