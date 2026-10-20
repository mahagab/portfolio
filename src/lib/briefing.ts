export const SITE_TYPES = [
  { value: "landing_page", label: "Landing page" },
  { value: "institutional", label: "Site institucional" },
  { value: "not_sure", label: "Ainda não sei qual é o ideal" },
] as const;
export const MATERIALS = [
  { value: "brand", label: "Logo e identidade visual" },
  { value: "copy", label: "Textos" },
  { value: "images", label: "Fotos ou imagens" },
  { value: "domain", label: "Domínio registrado" },
  { value: "none", label: "Ainda não tenho materiais" },
] as const;
export const DEADLINES = [
  { value: "up_to_15_days", label: "Em até 15 dias" },
  { value: "15_to_30_days", label: "De 15 a 30 dias" },
  { value: "1_to_2_months", label: "De 1 a 2 meses" },
  { value: "flexible", label: "Tenho flexibilidade" },
  { value: "not_defined", label: "Ainda não defini" },
] as const;
export const BUDGETS = [
  { value: "up_to_1000", label: "Até R$ 1.000" },
  { value: "1000_to_2000", label: "R$ 1.000 a R$ 2.000" },
  { value: "above_2000", label: "Acima de R$ 2.000" },
  { value: "not_defined", label: "Ainda não defini" },
] as const;

export type Briefing = {
  name: string;
  company: string;
  email: string;
  site_type: string;
  objective: string;
  materials: string[];
  deadline: string;
  budget: string;
};
export type BriefingField = keyof Briefing;
export type BriefingErrors = Partial<Record<BriefingField, string>>;

/** Aceitar apenas os campos esperados; nunca incluir conteúdo pessoal em eventos de Analytics. */
export function parseBriefing(form: FormData): { data: Briefing; errors: BriefingErrors } {
  const text = (key: string) => {
    const value = form.get(key);
    return typeof value === "string" ? value.trim() : "";
  };
  const data: Briefing = {
    name: text("name"), company: text("company"), email: text("email"),
    site_type: text("site_type"), objective: text("objective"),
    materials: [...new Set(form.getAll("materials").filter((value): value is string => typeof value === "string"))],
    deadline: text("deadline"), budget: text("budget"),
  };
  const errors: BriefingErrors = {};
  if (data.name.length < 2 || data.name.length > 100) errors.name = "Informe seu nome, com 2 a 100 caracteres.";
  if (data.company.length > 120) errors.company = "Use até 120 caracteres para o nome da empresa.";
  if (data.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = "Informe um e-mail válido para receber o retorno.";
  if (!SITE_TYPES.some(option => option.value === data.site_type)) errors.site_type = "Escolha o tipo de site, mesmo que ainda esteja em dúvida.";
  if (data.objective.length < 20 || data.objective.length > 1500) errors.objective = "Descreva o objetivo do projeto em 20 a 1.500 caracteres.";
  if (!data.materials.length || data.materials.some(value => !MATERIALS.some(option => option.value === value))) errors.materials = "Indique os materiais disponíveis ou marque que ainda não tem materiais.";
  if (data.materials.includes("none") && data.materials.length > 1) errors.materials = "Escolha os materiais disponíveis ou apenas a opção de que ainda não tem materiais.";
  if (!DEADLINES.some(option => option.value === data.deadline)) errors.deadline = "Selecione o prazo desejado.";
  if (!BUDGETS.some(option => option.value === data.budget)) errors.budget = "Selecione uma faixa de investimento.";
  return { data, errors };
}
