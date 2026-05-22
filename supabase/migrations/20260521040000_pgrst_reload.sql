-- Sinaliza ao PostgREST pra recarregar o cache de schema.
-- Necessario porque as 3 migrations anteriores (010000/020000/030000)
-- esqueceram o notify e o cache ficou stale, causando 400 em RPCs
-- nao relacionadas (ex: app_admin_decide_project).

notify pgrst, 'reload schema';
