# Plano de Testes — Projeto Forms

Documento descrevendo a suite de testes do projeto: o que já foi criado, o que falta, como rodar e como expandir.

## Como rodar

```bash
npm test               # modo watch (re-roda ao salvar)
npm run test:run       # roda uma vez e sai (CI)
npm run test:watch     # modo watch explicito
npm run test:ui        # interface grafica do vitest (precisa instalar @vitest/ui)
npm run test:coverage  # roda com relatorio de cobertura (html em coverage/index.html)
```

Convenções:
- Arquivos de teste ficam **ao lado** do arquivo testado, com sufixo `.test.ts` ou `.test.tsx`.
- Setup global: `src/test/setup.ts` (limpa DOM, localStorage e classe `.dark` após cada teste).
- Config: `vite.config.ts` na chave `test`.

---

## Stack instalada

- **vitest** — runner (mesma config do Vite, hot-reload)
- **@testing-library/react** — render de componentes e queries acessíveis
- **@testing-library/user-event** — simulação realista de interações
- **@testing-library/jest-dom** — matchers extras (`toBeInTheDocument`, `toHaveClass`, etc.)
- **jsdom** — DOM simulado para rodar React sem navegador
- **@vitest/coverage-v8** — cobertura via V8

---

## Status atual

### Infra (concluída)

- [x] `package.json` com scripts `test`, `test:run`, `test:watch`, `test:ui`, `test:coverage`
- [x] `vite.config.ts` com bloco `test` (jsdom, setupFiles, coverage)
- [x] `src/test/setup.ts` com cleanup automático e mock de `matchMedia`
- [x] `tsconfig.app.json` com types do vitest e jest-dom

### Testes já criados

- [x] `src/lib/utils.test.ts` — função `cn` (concatenação, filtragem de falsy)
- [x] `src/lib/theme.test.ts` — `applyTheme`, `resolveInitialTheme`, `initializeTheme`
- [x] `src/lib/formStyles.test.ts` — constantes de classes (`formLabelClass`, `projectFormLabelClass`, `checkboxItemClass`, `selectInputClass`)
- [x] `src/lib/projectStyles.test.ts` — constantes de classes (`dashboardPanelClass`, `projectCardClass`, `statusColorMap`, etc.)

### Testes criados (todas as suites planejadas)

#### 1. Features — lógica pura (sem React)

- [x] **`src/features/projects/projectFilters.test.ts`** — 17 testes
- [x] **`src/features/projects/extensionPlan.test.ts`** — 17 testes
- [x] **`src/features/projects/projectSchemas.test.ts`** — 17 testes

#### 2. Componentes UI (com RTL)

- [x] **`src/components/ui/button.test.tsx`** — 14 testes
- [x] **`src/components/ui/input.test.tsx`** — 7 testes
- [x] **`src/components/ui/textarea.test.tsx`** — 5 testes
- [x] **`src/components/ui/card.test.tsx`** — 8 testes
- [x] **`src/components/ui/theme-toggle.test.tsx`** — 4 testes

#### 3. Componentes de projeto (interação complexa)

- [x] **`src/components/projects/ProjectFiltersBar.test.tsx`** — 12 testes
- [x] **`src/components/projects/ExtensionProjectFields.test.tsx`** — 8 testes

#### 4. Páginas (integração)

- [x] **`src/pages/LoginPage.test.tsx`** — 8 testes (mock de `auth/appAuth`)

> Como mockar `login`:
> ```ts
> vi.mock('../auth/appAuth', () => ({
>   login: vi.fn(),
> }))
> ```
> E no teste:
> ```ts
> import { login } from '../auth/appAuth'
> vi.mocked(login).mockResolvedValue({ token: 't', user_id: '1', username: 'u', display_name: 'U', avatar_url: null, role: 'user' })
> ```

#### 5. Validação final

- [x] `npm run test:run` — **15 arquivos, 145 testes verdes**
- [ ] `npm run test:coverage` — checar `coverage/index.html` quando quiser ver cobertura

---

## Padrões e dicas

### Estrutura mínima de um teste

```ts
import { describe, expect, it } from 'vitest'
import { funcaoQueQueroTestar } from './arquivo'

describe('funcaoQueQueroTestar', () => {
  it('faz X quando Y', () => {
    const resultado = funcaoQueQueroTestar(entrada)
    expect(resultado).toBe(esperado)
  })
})
```

### Teste de componente React

```tsx
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MeuBotao } from './MeuBotao'

describe('MeuBotao', () => {
  it('chama onClick ao clicar', async () => {
    const onClick = vi.fn()
    render(<MeuBotao onClick={onClick}>Salvar</MeuBotao>)
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    expect(onClick).toHaveBeenCalledOnce()
  })
})
```

### Componente que usa `<Link>` do react-router

Envolver com `<MemoryRouter>`:

```tsx
import { MemoryRouter } from 'react-router-dom'

render(
  <MemoryRouter>
    <MeuComponente />
  </MemoryRouter>
)
```

### Mockando módulos

```ts
vi.mock('../features/projects/userProjects', () => ({
  listMyProjects: vi.fn().mockResolvedValue([]),
}))
```

### Esperar elemento aparecer (async)

```ts
expect(await screen.findByText('Bem-vindo')).toBeInTheDocument()
```

### Queries recomendadas (por prioridade RTL)

1. `getByRole('button', { name: 'Salvar' })`
2. `getByLabelText('Senha')`
3. `getByPlaceholderText('Digite sua senha')`
4. `getByText('Mensagem visivel')`
5. Último recurso: `getByTestId('algo')` (precisa adicionar `data-testid` no JSX)

---

## Como adicionar testes ao adicionar features

Sempre que adicionar uma nova função, componente ou página, siga o checklist:

1. **Função pura (ex: novo helper em `src/lib` ou `src/features`)** → crie `nome.test.ts` ao lado, importe a função, escreva casos para entradas válidas + bordas (null, vazio, tipo errado).
2. **Novo componente em `src/components/ui`** → crie `nome.test.tsx` com:
   - Render básico (renderiza filho/placeholder/label)
   - Props que mudam classe (variants, sizes)
   - Eventos (onClick, onChange)
   - Estado disabled
3. **Novo componente de projeto/form** → render + interação (`userEvent.type`/`click`/`selectOptions`) + asserção via `onChange` mock.
4. **Nova página** → mock dos módulos que tocam Supabase (`vi.mock('../auth/appAuth', ...)`), depois testar fluxo: render → preencher form → submit → mock chamado + `onSuccess` chamado.

Depois rode `npm run test:run` antes de commitar.

## Cobertura atual da suite

- **Função pura:** `cn`, `applyTheme`, `resolveInitialTheme`, `initializeTheme`, `applyProjectFilters`, `isProjectFilterActive`, `findSortOption`, `createEmptyExtensionPlan`, `normalizeExtensionPlan`, `createExtensionPlanFromProject`, `isExtensionPlanComplete`, `disciplineFormSchema`, `extensionFormSchema`, `collectFormErrors`, `statusBadgeClassName`, `projectTypeBadgeClassName`
- **Estilos (constantes):** `formStyles`, `projectStyles`
- **Camada de dados (Supabase mockado):** `appAuth` (login, validateSession, logoutSession, updateMyAvatar, getStoredSession*, clearSessionToken), `userProjects` (create, list, getDetail, updateStatus, updateDetails, delete, projectStatusLabel), `adminProjects` (list, prefetch/consume, history, getDetail, decide), `superAdmin` (listUsers, create/update/delete, resetPassword, listHistory), `projectAttachments` (list, upload, delete), `projectTimeline`, `projectEmails`
- **Componentes UI:** `Button`, `Input`, `Textarea`, `Card*`, `ThemeToggle`
- **Componentes de projeto:** `ProjectFiltersBar`, `ExtensionProjectFields`
- **Layout:** `DashboardLayout` (sidebar, avatar, logout)
- **Páginas:** `LoginPage`, `UserProjectsPage`, `UserNewProjectPage`, `UserProjectDetailPage`, `AdminProjectsPage`, `AdminProjectHistoryPage`, `AdminProjectDetailPage`, `SuperUsersPage`, `SuperNewUserPage`, `SuperHistoryPage`

**Total: 306 testes em 33 arquivos.**
