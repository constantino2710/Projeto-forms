// Baixa recursivamente todos os arquivos de um bucket do Supabase Storage.
// Uso (variaveis de ambiente):
//   SUPABASE_URL                URL do projeto (https://xxxx.supabase.co)
//   SUPABASE_SERVICE_ROLE_KEY   service_role key (NAO usar anon)
//   BUCKET                      nome do bucket (default: app-project-attachments)
//   OUT_DIR                     diretorio de destino (default: ./backup-storage)

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const SUPABASE_URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = process.env.BUCKET || 'app-project-attachments';
const OUT_DIR = process.env.OUT_DIR || './backup-storage';

if (!SUPABASE_URL || !KEY) {
  console.error('Erro: SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY sao obrigatorios.');
  process.exit(1);
}

const headers = { Authorization: `Bearer ${KEY}`, apikey: KEY };

async function listFolder(prefix) {
  const items = [];
  let offset = 0;
  const limit = 1000;

  for (;;) {
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/list/${BUCKET}`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prefix,
        limit,
        offset,
        sortBy: { column: 'name', order: 'asc' },
      }),
    });

    if (!res.ok) {
      throw new Error(`list falhou em prefix='${prefix}': ${res.status} ${await res.text()}`);
    }

    const page = await res.json();
    items.push(...page);
    if (page.length < limit) break;
    offset += limit;
  }

  return items;
}

async function downloadFile(path) {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`, { headers });
  if (!res.ok) {
    throw new Error(`download falhou em ${path}: ${res.status}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  const dest = join(OUT_DIR, path);
  await mkdir(dirname(dest), { recursive: true });
  await writeFile(dest, buf);
}

async function walk(prefix = '') {
  const items = await listFolder(prefix);
  let fileCount = 0;
  let folderCount = 0;

  for (const item of items) {
    const fullPath = prefix ? `${prefix}/${item.name}` : item.name;

    // No Supabase Storage, pastas chegam com id=null
    if (item.id === null) {
      folderCount += 1;
      const sub = await walk(fullPath);
      fileCount += sub.fileCount;
      folderCount += sub.folderCount;
    } else {
      console.log(`baixando ${fullPath}`);
      await downloadFile(fullPath);
      fileCount += 1;
    }
  }

  return { fileCount, folderCount };
}

const start = Date.now();
const { fileCount, folderCount } = await walk('');
const elapsed = ((Date.now() - start) / 1000).toFixed(1);
console.log(`backup do storage concluido: ${fileCount} arquivos, ${folderCount} pastas, ${elapsed}s`);
