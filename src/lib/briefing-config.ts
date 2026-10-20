const directusUrl = import.meta.env.PUBLIC_DIRECTUS_URL;
export const briefingEnabled = import.meta.env.PUBLIC_BRIEFING_ENABLED === "true";
export const briefingVisible = briefingEnabled || import.meta.env.DEV;
export const briefingEndpoint = directusUrl
  ? new URL("items/project_briefings", `${directusUrl.replace(/\/+$/, "")}/`).href
  : "";
