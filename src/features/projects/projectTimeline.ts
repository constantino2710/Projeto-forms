import { getStoredSessionToken } from "../../auth/appAuth";
import { supabase } from "../../lib/supabase";

export type ProjectTimeline = {
  status: "rascunho" | "submetido" | "em_avaliacao" | "em_ajustes" | "aprovado" | "reprovado";
  created_at: string | null;
  submitted_at: string | null;
  analysis_started_at: string | null;
  approved_at: string | null;
  rejected_at: string | null;
};

export const getProjectTimeline = async (
  projectId: string,
): Promise<ProjectTimeline> => {
  const token = getStoredSessionToken();
  if (!token) {
    throw new Error("Sessao invalida. Faca login novamente.");
  }

  const { data, error } = await supabase.rpc("app_get_project_timeline", {
    p_token: token,
    p_project_id: projectId,
  });

  if (error) {
    throw new Error(error.message);
  }

  const timeline = data as ProjectTimeline | null;
  if (!timeline) {
    throw new Error("Nao foi possivel carregar a linha do tempo.");
  }

  return timeline;
};
