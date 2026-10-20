export const WHATSAPP_PHONE = "5511983600135";

const introductions = {
  google: "Vim pelo Google",
  instagram: "Vim pelo Instagram",
  facebook: "Vim pelo Facebook",
  meta: "Vim por um anúncio da Meta",
  linkedin: "Vim pelo LinkedIn",
  email: "Vim por e-mail",
  referral: "Vim por uma indicação em outro site",
  other: "Vim por outro canal até o site da GM codeworks",
  direct: "Vim pelo site da GM codeworks (origem não identificada)",
} as const;

export type ContactSource = keyof typeof introductions;
export type Attribution = { source: ContactSource; medium: string };

const aliases: Record<string, ContactSource> = {
  google: "google", google_ads: "google", googleads: "google", adwords: "google",
  instagram: "instagram", ig: "instagram", facebook: "facebook", fb: "facebook",
  meta: "meta", linkedin: "linkedin", email: "email", newsletter: "email",
};

function matchesHost(host: string, domain: string) {
  return host === domain || host.endsWith(`.${domain}`);
}

/** UTMs têm prioridade; o referenciador é apenas uma alternativa quando disponível. */
export function detectAttribution(pageUrl: string, referrer = ""): Attribution {
  const url = new URL(pageUrl);
  const rawSource = url.searchParams.get("utm_source")?.trim().toLowerCase();
  const rawMedium = url.searchParams.get("utm_medium")?.trim().toLowerCase();
  // Não repassar textos arbitrários da URL para a mensagem ou para o Analytics.
  const medium = rawMedium && /^[a-z0-9_-]{1,40}$/.test(rawMedium) ? rawMedium : "(not set)";
  if (rawSource) return {
    source: Object.hasOwn(aliases, rawSource) ? aliases[rawSource] : "other",
    medium,
  };
  if (["gclid", "gbraid", "wbraid"].some(key => url.searchParams.get(key))) {
    return { source: "google", medium: "cpc" };
  }
  // fbclid sozinho não distingue Instagram de Facebook: usar utm_source nesses anúncios.
  try {
    const host = new URL(referrer).hostname.toLowerCase();
    if (host === url.hostname.toLowerCase()) return { source: "direct", medium: "(none)" };
    if (/^(?:www\.)?google\.(?:com(?:\.[a-z]{2})?|[a-z]{2}|co\.[a-z]{2})$/.test(host)) {
      return { source: "google", medium: "organic" };
    }
    if (matchesHost(host, "instagram.com")) return { source: "instagram", medium: "referral" };
    if (matchesHost(host, "facebook.com")) return { source: "facebook", medium: "referral" };
    if (matchesHost(host, "linkedin.com")) return { source: "linkedin", medium: "referral" };
    return { source: "referral", medium: "referral" };
  } catch {
    return { source: "direct", medium: "(none)" };
  }
}

export function buildWhatsAppUrl(source: ContactSource = "direct") {
  const message = `Olá! ${introductions[source]} e gostaria de um orçamento para uma landing page ou site institucional.`;
  return `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`;
}

// Link funcional mesmo sem JavaScript; a origem fica explicitamente não identificada.
export const WHATSAPP_URL = buildWhatsAppUrl();
