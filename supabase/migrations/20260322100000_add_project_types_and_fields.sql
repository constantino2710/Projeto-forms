DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'projeto_tipo') THEN
        CREATE TYPE projeto_tipo AS ENUM ('extensao', 'disciplina');
    END IF;
END $$;
ALTER TABLE public.app_projects 
ADD COLUMN IF NOT EXISTS tipo projeto_tipo NOT NULL DEFAULT 'extensao',
ADD COLUMN IF NOT EXISTS codigo_disciplina TEXT,
ADD COLUMN IF NOT EXISTS semestre_letivo TEXT;
