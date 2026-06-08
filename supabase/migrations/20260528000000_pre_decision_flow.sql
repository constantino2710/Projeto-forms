-- Adiciona os status pre_aprovado / pre_reprovado ao enum project_status.
-- Precisa rodar em transacao propria: ALTER TYPE ... ADD VALUE nao pode ser
-- usado dentro da mesma transacao em que foi criado, entao as funcoes que
-- referenciam os novos valores vivem na migration seguinte (20260528000010).

alter type public.project_status add value if not exists 'pre_aprovado' before 'aprovado';
alter type public.project_status add value if not exists 'pre_reprovado' before 'reprovado';

notify pgrst, 'reload schema';
