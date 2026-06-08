import { clearSessionToken, getStoredSessionToken } from "../../auth/appAuth";
import { supabase } from "../../lib/supabase";
import type { ExtensionPlanData } from "./extensionPlan";

export type UserProjectStatus =
  | "rascunho"
  | "submetido"
  | "em_avaliacao"
  | "em_ajustes"
  | "pre_aprovado"
  | "pre_reprovado"
  | "aprovado"
  | "reprovado";

export type UserProject = {
  id: string;
  title: string;
  tipo: "extensao" | "disciplina";
  codigo_disciplina: string | null;
  semestre_letivo: string | null;
  thematic_area: string;
  course: string | null;
  school: string | null;
  period_start: string;
  period_end: string;
  target_audience: string;
  budget: number;
  description: string;
  extension_form?: ExtensionPlanData | null;
  status: UserProjectStatus;
  admin_message: string | null;
  created_at: string;
  updated_at: string;
};

type CreateProjectInput = {
  title: string;
  thematicArea: string;
  course?: string | null;
  periodStart: string;
  periodEnd: string;
  targetAudience: string;
  budget: number;
  description: string;
  type: "extensao" | "disciplina";
  codigo_disciplina?: string | null;
  semestre_letivo?: string | null;
  extensionForm?: ExtensionPlanData | null;
};

export type CreateProjectResult = {
  id: string;
  title: string;
  status: UserProjectStatus;
  created_at: string;
};

type UpdateProjectInput = {
  projectId: string;
  title: string;
  thematicArea: string;
  course?: string | null;
  periodStart: string;
  periodEnd: string;
  targetAudience: string;
  budget: number;
  description: string;
  type?: "extensao" | "disciplina";
  codigoDisciplina?: string | null;
  semestreLetivo?: string | null;
  extensionForm?: ExtensionPlanData | null;
};

const SESSION_TOKEN_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const formatRpcErrorMessage = (error: unknown) => {
  const rpcError = error as {
    message?: string;
    details?: string;
    hint?: string;
  };
  const message = (rpcError.message || "Falha na operação.").trim();
  const details = (rpcError.details || "").trim();
  const hint = (rpcError.hint || "").trim();
  const suffix = [details, hint].filter(Boolean).join(" | ");
  return suffix ? `${message} (${suffix})` : message;
};

const shouldClearSession = (message: string) =>
  /sess(a|ã)o\s+(invalida|inv[áa]lida|expirada|expired|nao\s+encontrada|n[ãa]o\s+encontrada)|invalid\s+session|n[ãa]o\s+autenticad|token\s+(invalido|inv[áa]lido|expirado|expirou|expired|invalid|n[ãa]o\s+encontrad)/i.test(
    message,
  );

const getTokenOrThrow = () => {
  const token = getStoredSessionToken();
  if (!token) {
    throw new Error("Sessão inválida. Faça login novamente.");
  }

  if (!SESSION_TOKEN_PATTERN.test(token)) {
    clearSessionToken();
    throw new Error("Sessão inválida. Faça login novamente.");
  }

  return token;
};

export const createUserProject = async (
  input: CreateProjectInput,
): Promise<CreateProjectResult> => {
  const token = getTokenOrThrow();

  const { data, error } = await supabase.rpc("app_create_project_v2", {
    p_token: token,
    p_title: input.title,
    p_type: input.type,
    p_thematic_area: input.thematicArea,
    p_course: input.course ?? null,
    p_period_start: input.periodStart,
    p_period_end: input.periodEnd,
    p_target_audience: input.targetAudience,
    p_budget: input.budget,
    p_description: input.description,
    p_codigo_disciplina: input.codigo_disciplina ?? null,
    p_semestre_letivo: input.semestre_letivo ?? null,
    p_extension_form: input.extensionForm ?? null,
  });

  if (error) {
    const message = formatRpcErrorMessage(error);
    if (shouldClearSession(message)) {
      clearSessionToken();
    }
    throw new Error(message);
  }

  return data as CreateProjectResult;
};

export const duplicateMyProject = async (
  project: UserProject,
): Promise<CreateProjectResult> => {
  return createUserProject({
    title: project.title,
    thematicArea: project.thematic_area,
    course: project.course ?? null,
    periodStart: project.period_start,
    periodEnd: project.period_end,
    targetAudience: project.target_audience,
    budget: project.budget,
    description: project.description,
    type: project.tipo,
    codigo_disciplina: project.codigo_disciplina ?? null,
    semestre_letivo: project.semestre_letivo ?? null,
    extensionForm: project.extension_form ?? null,
  });
};

type ListMyProjectsParams = {
  limit?: number;
  offset?: number;
  query?: string | null;
  statuses?: string[] | null;
  course?: string | null;
  school?: string | null;
  sortKey?: string | null;
  sortDir?: string | null;
};

type ListMyProjectsRow = UserProject & { total_count: number };

export const listMyProjects = async (
  params: ListMyProjectsParams = {},
): Promise<{ rows: UserProject[]; total: number }> => {
  const token = getTokenOrThrow();

  const { data, error } = await supabase.rpc("app_list_my_projects_v2", {
    p_token: token,
    p_limit: params.limit ?? 200,
    p_offset: params.offset ?? 0,
    p_query: params.query ?? null,
    p_statuses:
      params.statuses && params.statuses.length > 0 ? params.statuses : null,
    p_course: params.course ?? null,
    p_school: params.school ?? null,
    p_sort_key: params.sortKey ?? null,
    p_sort_dir: params.sortDir ?? null,
  });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as ListMyProjectsRow[];
  const total = rows.length > 0 ? Number(rows[0].total_count) : 0;
  return { rows: rows as UserProject[], total };
};

export const getMyProjectDetail = async (
  projectId: string,
): Promise<UserProject> => {
  const token = getTokenOrThrow();

  const { data, error } = await supabase.rpc("app_get_my_project_detail_v2", {
    p_token: token,
    p_project_id: projectId,
  });

  if (error) {
    throw new Error(error.message);
  }

  const project = data as UserProject | null;
  if (!project) {
    throw new Error("Projeto não encontrado.");
  }

  return project;
};

export const updateMyProjectStatus = async (
  projectId: string,
  nextStatus: Extract<UserProjectStatus, "rascunho" | "submetido">,
) => {
  const token = getTokenOrThrow();

  const { data, error } = await supabase.rpc("app_update_project_status", {
    p_token: token,
    p_project_id: projectId,
    p_status: nextStatus,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const updateMyProjectDetails = async (input: UpdateProjectInput) => {
  const token = getTokenOrThrow();

  const { data, error } = await supabase.rpc("app_update_project_v2", {
    p_token: token,
    p_project_id: input.projectId,
    p_title: input.title,
    p_type: input.type ?? "extensao",
    p_thematic_area: input.thematicArea,
    p_course: input.course ?? null,
    p_period_start: input.periodStart,
    p_period_end: input.periodEnd,
    p_target_audience: input.targetAudience,
    p_budget: input.budget,
    p_description: input.description,
    p_codigo_disciplina: input.codigoDisciplina ?? null,
    p_semestre_letivo: input.semestreLetivo ?? null,
    p_extension_form: input.extensionForm ?? null,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const projectStatusLabel: Record<UserProjectStatus, string> = {
  rascunho: "Rascunho",
  submetido: "Submetido",
  em_avaliacao: "Em análise",
  em_ajustes: "Em ajustes",
  pre_aprovado: "Pre-aprovado",
  pre_reprovado: "Pre-reprovado",
  aprovado: "Aprovado",
  reprovado: "Recusado",
};

export const deleteMyProject = async (projectId: string) => {
  const token = getTokenOrThrow();

  const { error } = await supabase.rpc("app_delete_project", {
    p_token: token,
    p_project_id: projectId,
  });

  if (error) {
    const message = formatRpcErrorMessage(error);
    if (shouldClearSession(message)) {
      clearSessionToken();
    }
    throw new Error(message);
  }
};
