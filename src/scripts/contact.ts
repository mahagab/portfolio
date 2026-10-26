import { buildWhatsAppUrl, detectAttribution, type Attribution } from "../lib/contact";

type AnalyticsWindow = Window & {
  gtag?: (...args: unknown[]) => void;
};
const googleAdsId = (import.meta.env.PUBLIC_GOOGLE_ADS_ID ?? "AW-18526877385").trim();
const whatsAppConversion = "AW-18526877385/37bWCMmcmKUdEMntpoJF";
const storageKey = "gm-contact-attribution-v1";
const sessionDuration = 30 * 60 * 1000;
const sources = new Set(["google", "instagram", "facebook", "meta", "linkedin", "email", "referral", "other", "direct"]);
let attribution: Attribution;

function prepareLinks() {
  attribution = detectAttribution(window.location.href, document.referrer);
  try {
    const stored = JSON.parse(sessionStorage.getItem(storageKey) ?? "null");
    if (attribution.source === "direct" && stored?.expiresAt > Date.now()
      && sources.has(stored?.attribution?.source) && typeof stored.attribution.medium === "string") {
      attribution = stored.attribution;
    } else if (attribution.source !== "direct") {
      sessionStorage.setItem(storageKey, JSON.stringify({ attribution, expiresAt: Date.now() + sessionDuration }));
    }
  } catch { /* A identificação atual continua funcionando com armazenamento bloqueado. */ }
  document.querySelectorAll<HTMLAnchorElement>("a[data-whatsapp]").forEach(link => {
    link.href = buildWhatsAppUrl(attribution.source);
  });
}

function trackClick(event: MouseEvent) {
  if (event.defaultPrevented || (event.type === "auxclick" && event.button !== 1)) return;
  const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[data-whatsapp]") : null;
  if (!link) return;
  const params = {
    contact_source: attribution.source,
    contact_medium: attribution.medium,
    contact_location: link.dataset.whatsapp ?? "unknown",
  };
  // Medir o clique, sem enviar o telefone ou a mensagem para o Analytics.
  try { (window as AnalyticsWindow).gtag?.("event", "whatsapp_click", params); }
  catch { /* Uma falha de medição nunca deve impedir a abertura do WhatsApp. */ }
  // A conversão é acionada somente neste clique, nunca no carregamento da página.
  // Se a conta do Ads for desativada ou substituída, não enviar para a conta antiga.
  if (googleAdsId === "AW-18526877385") {
    try {
      (window as AnalyticsWindow).gtag?.("event", "conversion", {
        send_to: whatsAppConversion,
        value: 1.0,
        currency: "BRL",
      });
    } catch { /* O WhatsApp continua abrindo mesmo com bloqueio do rastreamento. */ }
  }
}

prepareLinks();
document.addEventListener("astro:page-load", prepareLinks);
document.addEventListener("click", trackClick);
document.addEventListener("auxclick", trackClick);

