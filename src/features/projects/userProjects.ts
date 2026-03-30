import { clearSessionToken, getStoredSessionToken } from "../../auth/appAuth";
import { supabase } from "../../lib/supabase";

export type UserProjectStatus =
  | "rascunho"
  | "submetido"
  | "em_avaliacao"
  | "em_ajustes"
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
  status: UserProjectStatus;
  admin_message: string | null;
  created_at: string;
  updated_at: string;
};

type CreateProjectInput = {
  title: string;
  thematicArea: string;
  course?: string;
  school?: string;
  periodStart: string;
  periodEnd: string;
  targetAudience: string;
  budget: number;
  description: string;
  type: "extensao" | "disciplina";
  codigo_disciplina?: string | null;
  semestre_letivo?: string | null;
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
  school?: string | null;
  periodStart: string;
  periodEnd: string;
  targetAudience: string;
  budget: number;
  description: string;
};

export type ProjectCatalogOptions = {
  courses: string[];
  schools: string[];
};

export type ListMyProjectsParams = {
  limit?: number;
  offset?: number;
  query?: string;
  statuses?: UserProjectStatus[];
};

export type PaginatedUserProjects = {
  items: UserProject[];
  total: number;
};

const CATALOG_CACHE_KEY = "app_project_catalog_options_v1";
const CATALOG_CACHE_TTL_MS = 5 * 60 * 1000;

const SESSION_TOKEN_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const formatRpcErrorMessage = (error: unknown) => {
  const rpcError = error as {
    message?: string;
    details?: string;
    hint?: string;
  };
  const message = (rpcError.message || "Falha na operacao.").trim();
  const details = (rpcError.details || "").trim();
  const hint = (rpcError.hint || "").trim();
  const suffix = [details, hint].filter(Boolean).join(" | ");
  return suffix ? `${message} (${suffix})` : message;
};

const shouldClearSession = (message: string) =>
  /sessao|sessão|token|uuid|autenticad/i.test(message);

const getTokenOrThrow = () => {
  const token = getStoredSessionToken();
  if (!token) {
    throw new Error("Sessao invalida. Faca login novamente.");
  }

  if (!SESSION_TOKEN_PATTERN.test(token)) {
    clearSessionToken();
    throw new Error("Sessao invalida. Faca login novamente.");
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
    p_school: input.school ?? null,
    p_period_start: input.periodStart,
    p_period_end: input.periodEnd,
    p_target_audience: input.targetAudience,
    p_budget: input.budget,
    p_description: input.description,
    p_codigo_disciplina: input.codigo_disciplina ?? null,
    p_semestre_letivo: input.semestre_letivo ?? null,
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

export const listMyProjectsPage = async (
  params: ListMyProjectsParams = {},
): Promise<PaginatedUserProjects> => {
  const token = getTokenOrThrow();

  const { data, error } = await supabase.rpc("app_list_my_projects_v2", {
    p_token: token,
    p_limit: params.limit ?? 6,
    p_offset: params.offset ?? 0,
    p_query: params.query?.trim() || null,
    p_statuses: params.statuses?.length ? params.statuses : null,
  });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as (UserProject & { total_count?: number })[];

  return {
    items: rows,
    total: Number(rows[0]?.total_count ?? 0),
  };
};

export const listMyProjects = async (): Promise<UserProject[]> => {
  const result = await listMyProjectsPage({ limit: 200, offset: 0 });
  return result.items;
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
    throw new Error("Projeto nao encontrado.");
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
    p_type: "extensao",
    p_thematic_area: input.thematicArea,
    p_course: input.course ?? null,
    p_school: input.school ?? null,
    p_period_start: input.periodStart,
    p_period_end: input.periodEnd,
    p_target_audience: input.targetAudience,
    p_budget: input.budget,
    p_description: input.description,
    p_codigo_disciplina: (input as any).codigoDisciplina ?? null,
    p_semestre_letivo: (input as any).semestreLetivo ?? null,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const listProjectCatalogOptions = async (): Promise<ProjectCatalogOptions> => {
  try {
    const cachedRaw = localStorage.getItem(CATALOG_CACHE_KEY);
    if (cachedRaw) {
      const cached = JSON.parse(cachedRaw) as {
        timestamp?: number;
        value?: Partial<ProjectCatalogOptions>;
      };
      const age = Date.now() - Number(cached.timestamp ?? 0);
      if (age >= 0 && age < CATALOG_CACHE_TTL_MS && cached.value) {
        return {
          courses: Array.isArray(cached.value.courses) ? cached.value.courses : [],
          schools: Array.isArray(cached.value.schools) ? cached.value.schools : [],
        };
      }
    }
  } catch {
    // segue fluxo sem cache se falhar parse/acesso
  }

  const token = getTokenOrThrow();

  const { data, error } = await supabase.rpc("app_list_project_catalog_options", {
    p_token: token,
  });

  if (error) {
    throw new Error(error.message);
  }

  const result = (data ?? {}) as Partial<ProjectCatalogOptions>;
  const normalized = {
    courses: Array.isArray(result.courses) ? result.courses : [],
    schools: Array.isArray(result.schools) ? result.schools : [],
  };

  try {
    localStorage.setItem(
      CATALOG_CACHE_KEY,
      JSON.stringify({ timestamp: Date.now(), value: normalized }),
    );
  } catch {
    // sem impacto funcional se localStorage falhar
  }

  return normalized;
};

export const projectStatusLabel: Record<UserProjectStatus, string> = {
  rascunho: "Rascunho",
  submetido: "Submetido",
  em_avaliacao: "Em analise",
  em_ajustes: "Em ajustes",
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
