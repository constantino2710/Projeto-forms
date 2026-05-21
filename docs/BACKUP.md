# Sistema de Backup

Existem **dois mecanismos** rodando em paralelo:

| Metodo | Onde mora | Frequencia | Para que serve |
|---|---|---|---|
| **1. Snapshots internos** | schema `backups` no proprio Postgres | Segunda 03:00 UTC | Rollback rapido por SQL |
| **2. Dumps externos** | repo privado no GitHub | Segunda 04:00 UTC | Migrar pra outro banco |

Os dois sao **independentes**: se um falhar, o outro segue.

---

## Setup inicial (uma unica vez)

### 1. Habilitar `pg_cron` no Supabase

No painel: **Database -> Extensions -> pg_cron -> Enable**.

Depois rode a migration nova:

```bash
supabase db push
```

Ou execute manualmente `supabase/migrations/20260521000000_weekly_backup_system.sql` no SQL Editor.

Confirme que o job foi criado:

```sql
select * from cron.job where jobname = 'weekly_backup_snapshot';
```

### 2. Criar repo privado de backups no GitHub

1. Crie um novo repo no GitHub, **privado**, com nome a sua escolha (ex: `projeto-forms-backups`).
2. Inicialize com qualquer conteudo (README vazio basta) — o checkout do workflow precisa de um branch existente.

### 3. Configurar secrets/vars no repo principal

Em **Settings -> Secrets and variables -> Actions**:

**Variables (vars):**
- `BACKUP_REPO` -> `seu-usuario/projeto-forms-backups`

**Secrets:**
- `SUPABASE_DB_URL` -> connection string completa do banco
  Pega em: Supabase Dashboard -> Project Settings -> Database -> Connection string (URI). Use o **session pooler** ou direct connection. Exemplo:
  `postgresql://postgres.xxxx:senha@aws-0-sa-east-1.pooler.supabase.com:5432/postgres`
- `SUPABASE_URL` -> URL do projeto (`https://xxxx.supabase.co`)
- `SUPABASE_SERVICE_ROLE_KEY` -> em Settings -> API -> service_role key
  (NAO use a anon key — ela nao tem permissao pra listar o bucket inteiro)
- `BACKUP_REPO_TOKEN` -> Personal Access Token do GitHub com escopo `repo`
  Gere em: github.com/settings/tokens -> Fine-grained tokens -> permita "Contents: read and write" apenas no repo de backups

### 4. Testar manualmente

Em **Actions -> Backup semanal Supabase -> Run workflow**. Se passar, o setup esta OK.

---

## Restaurar dados (rollback rapido — Metodo 1)

Listar snapshots disponiveis no banco:

```sql
select * from backups.list_snapshots();
```

Restaurar **uma tabela** de uma data especifica:

```sql
select backups.restore_table('app_projects', '2026-05-19');
```

Restaurar **tudo** de uma data (rollback completo do banco — use em emergencia):

```sql
select backups.restore_all_from_date('2026-05-19');
```

> As funcoes ja desabilitam FKs temporariamente dentro da transacao, entao a ordem
> entre tabelas relacionadas nao importa.

---

## Migrar para outro banco (Metodo 2)

1. Provisione o novo Postgres (Neon, Railway, RDS, Supabase proprio, etc).
2. No repo de backups, escolha a pasta da data mais recente (ex: `2026-05-19/`).
3. Restaure o schema + dados:

   ```bash
   gunzip -c 2026-05-19/database.sql.gz | psql "postgresql://usuario:senha@novo-host/db"
   ```

4. Faca upload dos arquivos do bucket. Se o novo destino tambem for Supabase:

   ```bash
   # Para cada arquivo em 2026-05-19/storage/app-project-attachments/...
   # use o supabase CLI ou a Storage API para fazer upload mantendo a estrutura de pastas.
   ```

5. Atualize o `.env` da aplicacao com a nova `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`.

---

## Operacional

**Quanto espaco isso ocupa?**
- Schema `backups`: ~4x o tamanho atual do banco (1 snapshot por semana, 4 semanas).
- Repo de backups: cresce ~1 commit/semana. Para o plano Free do GitHub, espaco virtualmente ilimitado.

**E se uma das semanas falhar?**
- Snapshot interno: o job pg_cron tenta novamente na proxima semana. Voce ainda tem as 3 semanas anteriores.
- Dump externo: o workflow do GitHub Actions registra falha em **Actions**. Configure notificacao de falha em **Settings -> Notifications** do repo se quiser ser avisado.

**Como mudar a frequencia?**
- Interno: edite o cron em `cron.schedule` (procure no banco) ou re-execute a migration trocando `'0 3 * * 1'`.
- Externo: edite `.github/workflows/backup.yml`, linha `cron: '0 4 * * 1'`.

**Quanto tempo de retencao?**
- Interno: hoje 4 semanas (parametro `p_keep_weeks` em `cleanup_old_snapshots`).
- Externo: ilimitado por padrao (cada semana = novo commit). Para limpar, va no repo de backups e delete pastas antigas manualmente.
