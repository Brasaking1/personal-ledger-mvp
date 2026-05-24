# Personal Ledger MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a responsive personal ledger PWA with quick accounting, balance calculation, date-range stats, categories, bill import, and Supabase-backed cloud sync.

**Architecture:** Use React + TypeScript for the client, with pure ledger calculation/import modules tested independently. Data access goes through a `LedgerRepository` interface with a localStorage demo adapter and a Supabase adapter selected by environment configuration, so the app can run before cloud keys are configured while still supporting real cloud sync.

**Tech Stack:** Vite, React, TypeScript, Vitest, Testing Library, Supabase JS, Papa Parse, SheetJS/xlsx, Lucide React, vite-plugin-pwa.

---

## File Structure

- `package.json`: scripts and dependencies.
- `vite.config.ts`: Vite, Vitest, and PWA config.
- `tsconfig.json`, `tsconfig.node.json`, `index.html`: app build scaffolding.
- `.env.example`: documents Supabase environment variables.
- `supabase/schema.sql`: tables, indexes, and Row Level Security policies.
- `src/main.tsx`: React entry.
- `src/App.tsx`: application shell and route-like tab state.
- `src/styles.css`: responsive app styling.
- `src/types/ledger.ts`: shared ledger types.
- `src/features/ledger/defaultCategories.ts`: built-in categories.
- `src/features/ledger/calculations.ts`: pure balance and date-range stats functions.
- `src/features/ledger/importers.ts`: WeChat/Alipay CSV/XLSX parsing and normalization.
- `src/features/ledger/repository.ts`: repository interface and localStorage implementation.
- `src/features/ledger/supabaseRepository.ts`: Supabase implementation.
- `src/features/ledger/useLedger.ts`: app state hook connecting UI to repository.
- `src/components/Dashboard.tsx`: overview-first home screen.
- `src/components/TransactionForm.tsx`: quick income/expense entry.
- `src/components/StatsView.tsx`: arbitrary date-range stats and details.
- `src/components/SettingsView.tsx`: initial principal, categories, import, sync status.
- `src/components/Navigation.tsx`: bottom/side navigation.
- `src/test/setup.ts`: Testing Library setup.
- `src/**/*.test.ts(x)`: unit and component tests.

---

### Task 1: Scaffold React PWA Tooling

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `index.html`
- Create: `.env.example`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/styles.css`
- Create: `src/test/setup.ts`

- [ ] **Step 1: Add package scripts and dependencies**

Create `package.json`:

```json
{
  "name": "personal-ledger",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite --host 0.0.0.0",
    "build": "tsc -b && vite build",
    "preview": "vite preview --host 0.0.0.0",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.45.0",
    "@vite-pwa/assets-generator": "^0.2.6",
    "lucide-react": "^0.468.0",
    "papaparse": "^5.4.1",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "vite-plugin-pwa": "^0.20.5",
    "xlsx": "^0.18.5"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.4.8",
    "@testing-library/react": "^16.0.1",
    "@testing-library/user-event": "^14.5.2",
    "@types/papaparse": "^5.3.14",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "typescript": "^5.5.4",
    "vitest": "^2.0.5"
  }
}
```

- [ ] **Step 2: Add Vite, TypeScript, and test setup**

Create `vite.config.ts`:

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: '我的账本',
        short_name: '账本',
        description: '个人云同步记账软件',
        theme_color: '#f7f3eb',
        background_color: '#f7f3eb',
        display: 'standalone',
        icons: []
      }
    })
  ],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    globals: true
  }
});
```

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["DOM", "DOM.Iterable", "ES2020"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

Create `tsconfig.node.json`:

```json
{
  "compilerOptions": {
    "composite": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

Create `src/test/setup.ts`:

```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 3: Add app entry and a smoke test target**

Create `index.html`:

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>我的账本</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

Create `.env.example`:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Create `src/main.tsx`:

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

Create minimal `src/App.tsx`:

```tsx
export function App() {
  return (
    <main className="app-shell">
      <h1>我的账本</h1>
      <p>个人云同步记账软件</p>
    </main>
  );
}
```

Create minimal `src/styles.css`:

```css
:root {
  color: #171717;
  background: #f7f3eb;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
}

button,
input,
select {
  font: inherit;
}

.app-shell {
  min-height: 100vh;
  padding: 24px;
}
```

- [ ] **Step 4: Install and verify scaffold**

Run:

```bash
npm install
npm test
npm run build
```

Expected: install succeeds, `npm test` reports no test files or exits cleanly after tests are added in later tasks, and `npm run build` produces `dist/`.

- [ ] **Step 5: Commit scaffold**

```bash
git add package.json package-lock.json vite.config.ts tsconfig.json tsconfig.node.json index.html .env.example src
git commit -m "chore: scaffold ledger pwa"
```

---

### Task 2: Ledger Types, Categories, and Calculations

**Files:**
- Create: `src/types/ledger.ts`
- Create: `src/features/ledger/defaultCategories.ts`
- Create: `src/features/ledger/calculations.ts`
- Test: `src/features/ledger/calculations.test.ts`

- [ ] **Step 1: Write failing calculation tests**

Create `src/features/ledger/calculations.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { calculateBalance, summarizeTransactions } from './calculations';
import type { Transaction } from '../../types/ledger';

const tx = (overrides: Partial<Transaction>): Transaction => ({
  id: crypto.randomUUID(),
  userId: 'user-1',
  type: 'expense',
  amount: 100,
  categoryId: 'food',
  occurredAt: '2026-05-01T12:00:00.000Z',
  note: '',
  source: 'manual',
  paymentChannel: 'wechat',
  externalKey: null,
  createdAt: '2026-05-01T12:00:00.000Z',
  updatedAt: '2026-05-01T12:00:00.000Z',
  ...overrides
});

describe('ledger calculations', () => {
  it('calculates current balance from principal plus income minus expense', () => {
    const result = calculateBalance(50000, [
      tx({ type: 'income', amount: 8500 }),
      tx({ type: 'expense', amount: 3286 })
    ]);

    expect(result).toBe(55214);
  });

  it('summarizes arbitrary date ranges and category totals', () => {
    const summary = summarizeTransactions(
      [
        tx({ id: 'a', type: 'expense', amount: 30, categoryId: 'food', occurredAt: '2026-05-02T00:00:00.000Z' }),
        tx({ id: 'b', type: 'income', amount: 200, categoryId: 'salary', occurredAt: '2026-05-03T00:00:00.000Z' }),
        tx({ id: 'c', type: 'expense', amount: 99, categoryId: 'shopping', occurredAt: '2026-04-30T00:00:00.000Z' })
      ],
      '2026-05-01',
      '2026-05-31'
    );

    expect(summary.income).toBe(200);
    expect(summary.expense).toBe(30);
    expect(summary.net).toBe(170);
    expect(summary.byCategory).toEqual([
      { categoryId: 'salary', income: 200, expense: 0, net: 200 },
      { categoryId: 'food', income: 0, expense: 30, net: -30 }
    ]);
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```bash
npm test -- src/features/ledger/calculations.test.ts
```

Expected: FAIL because `src/types/ledger.ts` and `src/features/ledger/calculations.ts` do not exist.

- [ ] **Step 3: Add ledger types and defaults**

Create `src/types/ledger.ts`:

```ts
export type TransactionType = 'income' | 'expense';
export type TransactionSource = 'manual' | 'wechat_import' | 'alipay_import';
export type PaymentChannel = 'wechat' | 'alipay' | 'cash' | 'bank_card' | 'other';

export interface Category {
  id: string;
  userId: string;
  name: string;
  type: TransactionType;
  color: string;
  icon: string;
  isSystem: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  occurredAt: string;
  note: string;
  source: TransactionSource;
  paymentChannel: PaymentChannel;
  externalKey: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LedgerSettings {
  userId: string;
  initialPrincipal: number;
  currency: 'CNY';
  createdAt: string;
  updatedAt: string;
}

export interface CategorySummary {
  categoryId: string;
  income: number;
  expense: number;
  net: number;
}

export interface LedgerSummary {
  income: number;
  expense: number;
  net: number;
  byCategory: CategorySummary[];
  transactions: Transaction[];
}
```

Create `src/features/ledger/defaultCategories.ts`:

```ts
import type { Category, TransactionType } from '../../types/ledger';

const now = () => new Date().toISOString();

const category = (
  id: string,
  name: string,
  type: TransactionType,
  color: string,
  icon: string,
  sortOrder: number
): Category => ({
  id,
  userId: 'system',
  name,
  type,
  color,
  icon,
  isSystem: true,
  sortOrder,
  createdAt: now(),
  updatedAt: now()
});

export const defaultCategories: Category[] = [
  category('expense-food', '餐饮', 'expense', '#ea580c', 'utensils', 1),
  category('expense-transport', '交通', 'expense', '#2563eb', 'bus', 2),
  category('expense-shopping', '购物', 'expense', '#db2777', 'shopping-bag', 3),
  category('expense-housing', '住房', 'expense', '#7c3aed', 'home', 4),
  category('expense-utilities', '生活缴费', 'expense', '#0891b2', 'receipt', 5),
  category('expense-entertainment', '娱乐', 'expense', '#16a34a', 'music', 6),
  category('expense-medical', '医疗', 'expense', '#dc2626', 'heart-pulse', 7),
  category('expense-study', '学习', 'expense', '#ca8a04', 'book-open', 8),
  category('expense-travel', '旅行', 'expense', '#0f766e', 'plane', 9),
  category('expense-other', '其他支出', 'expense', '#6b7280', 'circle-ellipsis', 10),
  category('income-salary', '工资', 'income', '#059669', 'wallet', 1),
  category('income-bonus', '奖金', 'income', '#65a30d', 'gift', 2),
  category('income-parttime', '兼职', 'income', '#0d9488', 'briefcase', 3),
  category('income-refund', '退款', 'income', '#0284c7', 'rotate-ccw', 4),
  category('income-transfer', '转账', 'income', '#4f46e5', 'repeat', 5),
  category('income-investment', '投资收益', 'income', '#9333ea', 'trending-up', 6),
  category('income-other', '其他收入', 'income', '#6b7280', 'circle-ellipsis', 7)
];
```

- [ ] **Step 4: Implement pure calculations**

Create `src/features/ledger/calculations.ts`:

```ts
import type { CategorySummary, LedgerSummary, Transaction } from '../../types/ledger';

const roundMoney = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

export function calculateBalance(initialPrincipal: number, transactions: Transaction[]) {
  return roundMoney(
    transactions.reduce((balance, transaction) => {
      return transaction.type === 'income'
        ? balance + transaction.amount
        : balance - transaction.amount;
    }, initialPrincipal)
  );
}

export function summarizeTransactions(
  transactions: Transaction[],
  startDate: string,
  endDate: string
): LedgerSummary {
  const start = new Date(`${startDate}T00:00:00.000`);
  const end = new Date(`${endDate}T23:59:59.999`);
  const filtered = transactions
    .filter((transaction) => {
      const occurred = new Date(transaction.occurredAt);
      return occurred >= start && occurred <= end;
    })
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));

  const categoryMap = new Map<string, CategorySummary>();
  let income = 0;
  let expense = 0;

  for (const transaction of filtered) {
    if (transaction.type === 'income') {
      income += transaction.amount;
    } else {
      expense += transaction.amount;
    }

    const current = categoryMap.get(transaction.categoryId) ?? {
      categoryId: transaction.categoryId,
      income: 0,
      expense: 0,
      net: 0
    };

    if (transaction.type === 'income') {
      current.income = roundMoney(current.income + transaction.amount);
    } else {
      current.expense = roundMoney(current.expense + transaction.amount);
    }
    current.net = roundMoney(current.income - current.expense);
    categoryMap.set(transaction.categoryId, current);
  }

  return {
    income: roundMoney(income),
    expense: roundMoney(expense),
    net: roundMoney(income - expense),
    byCategory: [...categoryMap.values()].sort((a, b) => Math.abs(b.net) - Math.abs(a.net)),
    transactions: filtered
  };
}
```

- [ ] **Step 5: Verify and commit**

Run:

```bash
npm test -- src/features/ledger/calculations.test.ts
npm run build
```

Expected: PASS and build succeeds.

Commit:

```bash
git add src/types/ledger.ts src/features/ledger/defaultCategories.ts src/features/ledger/calculations.ts src/features/ledger/calculations.test.ts
git commit -m "feat: add ledger calculations"
```

---

### Task 3: Data Repository, Local Demo Mode, and Supabase Schema

**Files:**
- Create: `supabase/schema.sql`
- Create: `src/features/ledger/repository.ts`
- Create: `src/features/ledger/supabaseRepository.ts`
- Test: `src/features/ledger/repository.test.ts`

- [ ] **Step 1: Write failing repository tests**

Create `src/features/ledger/repository.test.ts`:

```ts
import { beforeEach, describe, expect, it } from 'vitest';
import { LocalLedgerRepository } from './repository';

describe('LocalLedgerRepository', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('creates default settings and categories for a new user', async () => {
    const repo = new LocalLedgerRepository('test-ledger');
    const snapshot = await repo.load('user-1');

    expect(snapshot.settings.initialPrincipal).toBe(0);
    expect(snapshot.categories.some((category) => category.name === '餐饮')).toBe(true);
    expect(snapshot.transactions).toEqual([]);
  });

  it('persists settings and transactions', async () => {
    const repo = new LocalLedgerRepository('test-ledger');
    await repo.saveSettings('user-1', 50000);
    await repo.upsertTransaction('user-1', {
      type: 'expense',
      amount: 30,
      categoryId: 'expense-food',
      occurredAt: '2026-05-02T12:00:00.000Z',
      note: '午饭',
      source: 'manual',
      paymentChannel: 'wechat',
      externalKey: null
    });

    const snapshot = await repo.load('user-1');

    expect(snapshot.settings.initialPrincipal).toBe(50000);
    expect(snapshot.transactions).toHaveLength(1);
    expect(snapshot.transactions[0].note).toBe('午饭');
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```bash
npm test -- src/features/ledger/repository.test.ts
```

Expected: FAIL because repository files do not exist.

- [ ] **Step 3: Implement repository interface and local adapter**

Create `src/features/ledger/repository.ts`:

```ts
import { defaultCategories } from './defaultCategories';
import type { Category, LedgerSettings, PaymentChannel, Transaction, TransactionSource, TransactionType } from '../../types/ledger';

export interface NewTransactionInput {
  type: TransactionType;
  amount: number;
  categoryId: string;
  occurredAt: string;
  note: string;
  source: TransactionSource;
  paymentChannel: PaymentChannel;
  externalKey: string | null;
}

export interface LedgerSnapshot {
  settings: LedgerSettings;
  categories: Category[];
  transactions: Transaction[];
  syncMode: 'local' | 'cloud';
}

export interface LedgerRepository {
  load(userId: string): Promise<LedgerSnapshot>;
  saveSettings(userId: string, initialPrincipal: number): Promise<LedgerSettings>;
  upsertCategory(userId: string, category: Omit<Category, 'id' | 'userId' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<Category>;
  upsertTransaction(userId: string, transaction: NewTransactionInput & { id?: string }): Promise<Transaction>;
  deleteTransaction(userId: string, transactionId: string): Promise<void>;
}

interface LocalStore {
  settingsByUser: Record<string, LedgerSettings>;
  categoriesByUser: Record<string, Category[]>;
  transactionsByUser: Record<string, Transaction[]>;
}

const now = () => new Date().toISOString();

const createSettings = (userId: string): LedgerSettings => ({
  userId,
  initialPrincipal: 0,
  currency: 'CNY',
  createdAt: now(),
  updatedAt: now()
});

const cloneDefaultCategories = (userId: string) =>
  defaultCategories.map((category) => ({
    ...category,
    id: `${userId}-${category.id}`,
    userId,
    createdAt: now(),
    updatedAt: now()
  }));

export class LocalLedgerRepository implements LedgerRepository {
  constructor(private readonly storageKey = 'personal-ledger') {}

  async load(userId: string): Promise<LedgerSnapshot> {
    const store = this.read();
    store.settingsByUser[userId] ??= createSettings(userId);
    store.categoriesByUser[userId] ??= cloneDefaultCategories(userId);
    store.transactionsByUser[userId] ??= [];
    this.write(store);

    return {
      settings: store.settingsByUser[userId],
      categories: store.categoriesByUser[userId],
      transactions: store.transactionsByUser[userId],
      syncMode: 'local'
    };
  }

  async saveSettings(userId: string, initialPrincipal: number): Promise<LedgerSettings> {
    const store = this.ensureUser(userId);
    const existing = store.settingsByUser[userId];
    const settings = { ...existing, initialPrincipal, updatedAt: now() };
    store.settingsByUser[userId] = settings;
    this.write(store);
    return settings;
  }

  async upsertCategory(userId: string, input: Omit<Category, 'id' | 'userId' | 'createdAt' | 'updatedAt'> & { id?: string }) {
    const store = this.ensureUser(userId);
    const categories = store.categoriesByUser[userId];
    const existing = input.id ? categories.find((category) => category.id === input.id) : undefined;
    const category: Category = {
      id: input.id ?? crypto.randomUUID(),
      userId,
      name: input.name,
      type: input.type,
      color: input.color,
      icon: input.icon,
      isSystem: input.isSystem,
      sortOrder: input.sortOrder,
      createdAt: existing?.createdAt ?? now(),
      updatedAt: now()
    };
    store.categoriesByUser[userId] = existing
      ? categories.map((item) => (item.id === category.id ? category : item))
      : [...categories, category];
    this.write(store);
    return category;
  }

  async upsertTransaction(userId: string, input: NewTransactionInput & { id?: string }): Promise<Transaction> {
    const store = this.ensureUser(userId);
    const transactions = store.transactionsByUser[userId];
    const existing = input.id ? transactions.find((transaction) => transaction.id === input.id) : undefined;
    const transaction: Transaction = {
      id: input.id ?? crypto.randomUUID(),
      userId,
      type: input.type,
      amount: input.amount,
      categoryId: input.categoryId,
      occurredAt: input.occurredAt,
      note: input.note,
      source: input.source,
      paymentChannel: input.paymentChannel,
      externalKey: input.externalKey,
      createdAt: existing?.createdAt ?? now(),
      updatedAt: now()
    };

    const duplicate = transaction.externalKey
      ? transactions.find((item) => item.source === transaction.source && item.externalKey === transaction.externalKey)
      : undefined;

    if (duplicate && duplicate.id !== transaction.id) {
      return duplicate;
    }

    store.transactionsByUser[userId] = existing
      ? transactions.map((item) => (item.id === transaction.id ? transaction : item))
      : [transaction, ...transactions];
    this.write(store);
    return transaction;
  }

  async deleteTransaction(userId: string, transactionId: string) {
    const store = this.ensureUser(userId);
    store.transactionsByUser[userId] = store.transactionsByUser[userId].filter((transaction) => transaction.id !== transactionId);
    this.write(store);
  }

  private ensureUser(userId: string) {
    const store = this.read();
    store.settingsByUser[userId] ??= createSettings(userId);
    store.categoriesByUser[userId] ??= cloneDefaultCategories(userId);
    store.transactionsByUser[userId] ??= [];
    return store;
  }

  private read(): LocalStore {
    const raw = localStorage.getItem(this.storageKey);
    return raw
      ? JSON.parse(raw)
      : { settingsByUser: {}, categoriesByUser: {}, transactionsByUser: {} };
  }

  private write(store: LocalStore) {
    localStorage.setItem(this.storageKey, JSON.stringify(store));
  }
}
```

- [ ] **Step 4: Add Supabase schema and adapter**

Create `supabase/schema.sql`:

```sql
create extension if not exists pgcrypto;

create table if not exists public.ledger_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  initial_principal numeric(14, 2) not null default 0,
  currency text not null default 'CNY',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('income', 'expense')),
  color text not null,
  icon text not null,
  is_system boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('income', 'expense')),
  amount numeric(14, 2) not null check (amount > 0),
  category_id uuid references public.categories(id) on delete set null,
  occurred_at timestamptz not null,
  note text not null default '',
  source text not null check (source in ('manual', 'wechat_import', 'alipay_import')),
  payment_channel text not null check (payment_channel in ('wechat', 'alipay', 'cash', 'bank_card', 'other')),
  external_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.import_batches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source text not null check (source in ('wechat', 'alipay')),
  file_name text not null,
  status text not null check (status in ('previewing', 'imported', 'failed')),
  total_rows integer not null default 0,
  imported_rows integer not null default 0,
  duplicate_rows integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists categories_user_type_idx on public.categories(user_id, type);
create index if not exists transactions_user_occurred_idx on public.transactions(user_id, occurred_at desc);
create unique index if not exists transactions_external_key_idx
  on public.transactions(user_id, source, external_key)
  where external_key is not null;

alter table public.ledger_settings enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.import_batches enable row level security;

create policy "ledger_settings_select_own" on public.ledger_settings for select using (auth.uid() = user_id);
create policy "ledger_settings_insert_own" on public.ledger_settings for insert with check (auth.uid() = user_id);
create policy "ledger_settings_update_own" on public.ledger_settings for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "ledger_settings_delete_own" on public.ledger_settings for delete using (auth.uid() = user_id);

create policy "categories_select_own" on public.categories for select using (auth.uid() = user_id);
create policy "categories_insert_own" on public.categories for insert with check (auth.uid() = user_id);
create policy "categories_update_own" on public.categories for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "categories_delete_own" on public.categories for delete using (auth.uid() = user_id);

create policy "transactions_select_own" on public.transactions for select using (auth.uid() = user_id);
create policy "transactions_insert_own" on public.transactions for insert with check (auth.uid() = user_id);
create policy "transactions_update_own" on public.transactions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "transactions_delete_own" on public.transactions for delete using (auth.uid() = user_id);

create policy "import_batches_select_own" on public.import_batches for select using (auth.uid() = user_id);
create policy "import_batches_insert_own" on public.import_batches for insert with check (auth.uid() = user_id);
create policy "import_batches_update_own" on public.import_batches for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "import_batches_delete_own" on public.import_batches for delete using (auth.uid() = user_id);
```

Create `src/features/ledger/supabaseRepository.ts`:

```ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { LocalLedgerRepository, type LedgerRepository, type LedgerSnapshot, type NewTransactionInput } from './repository';
import type { Category, LedgerSettings, Transaction } from '../../types/ledger';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const hasSupabaseConfig = Boolean(url && anonKey);

export function createLedgerRepository(): LedgerRepository {
  if (!hasSupabaseConfig) {
    return new LocalLedgerRepository();
  }
  return new SupabaseLedgerRepository(createClient(url!, anonKey!));
}

export class SupabaseLedgerRepository implements LedgerRepository {
  constructor(private readonly client: SupabaseClient) {}

  async load(userId: string): Promise<LedgerSnapshot> {
    const [settingsResult, categoriesResult, transactionsResult] = await Promise.all([
      this.client.from('ledger_settings').select('*').eq('user_id', userId).maybeSingle(),
      this.client.from('categories').select('*').eq('user_id', userId).order('sort_order'),
      this.client.from('transactions').select('*').eq('user_id', userId).order('occurred_at', { ascending: false })
    ]);

    if (settingsResult.error) throw settingsResult.error;
    if (categoriesResult.error) throw categoriesResult.error;
    if (transactionsResult.error) throw transactionsResult.error;

    return {
      settings: settingsResult.data ? mapSettings(settingsResult.data) : await this.saveSettings(userId, 0),
      categories: (categoriesResult.data ?? []).map(mapCategory),
      transactions: (transactionsResult.data ?? []).map(mapTransaction),
      syncMode: 'cloud'
    };
  }

  async saveSettings(userId: string, initialPrincipal: number): Promise<LedgerSettings> {
    const { data, error } = await this.client
      .from('ledger_settings')
      .upsert({ user_id: userId, initial_principal: initialPrincipal, currency: 'CNY', updated_at: new Date().toISOString() })
      .select('*')
      .single();
    if (error) throw error;
    return mapSettings(data);
  }

  async upsertCategory(userId: string, category: Omit<Category, 'id' | 'userId' | 'createdAt' | 'updatedAt'> & { id?: string }) {
    const { data, error } = await this.client
      .from('categories')
      .upsert({
        id: category.id,
        user_id: userId,
        name: category.name,
        type: category.type,
        color: category.color,
        icon: category.icon,
        is_system: category.isSystem,
        sort_order: category.sortOrder,
        updated_at: new Date().toISOString()
      })
      .select('*')
      .single();
    if (error) throw error;
    return mapCategory(data);
  }

  async upsertTransaction(userId: string, transaction: NewTransactionInput & { id?: string }): Promise<Transaction> {
    const { data, error } = await this.client
      .from('transactions')
      .upsert({
        id: transaction.id,
        user_id: userId,
        type: transaction.type,
        amount: transaction.amount,
        category_id: transaction.categoryId,
        occurred_at: transaction.occurredAt,
        note: transaction.note,
        source: transaction.source,
        payment_channel: transaction.paymentChannel,
        external_key: transaction.externalKey,
        updated_at: new Date().toISOString()
      })
      .select('*')
      .single();
    if (error) throw error;
    return mapTransaction(data);
  }

  async deleteTransaction(userId: string, transactionId: string) {
    const { error } = await this.client.from('transactions').delete().eq('user_id', userId).eq('id', transactionId);
    if (error) throw error;
  }
}

const mapSettings = (row: Record<string, any>): LedgerSettings => ({
  userId: row.user_id,
  initialPrincipal: Number(row.initial_principal),
  currency: row.currency,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

const mapCategory = (row: Record<string, any>): Category => ({
  id: row.id,
  userId: row.user_id,
  name: row.name,
  type: row.type,
  color: row.color,
  icon: row.icon,
  isSystem: row.is_system,
  sortOrder: row.sort_order,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

const mapTransaction = (row: Record<string, any>): Transaction => ({
  id: row.id,
  userId: row.user_id,
  type: row.type,
  amount: Number(row.amount),
  categoryId: row.category_id,
  occurredAt: row.occurred_at,
  note: row.note ?? '',
  source: row.source,
  paymentChannel: row.payment_channel,
  externalKey: row.external_key,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});
```

- [ ] **Step 5: Verify and commit**

Run:

```bash
npm test -- src/features/ledger/repository.test.ts
npm run build
```

Expected: PASS and build succeeds.

Commit:

```bash
git add supabase/schema.sql src/features/ledger/repository.ts src/features/ledger/supabaseRepository.ts src/features/ledger/repository.test.ts
git commit -m "feat: add ledger data repository"
```

---

### Task 4: Ledger State Hook and App Navigation

**Files:**
- Create: `src/features/ledger/useLedger.ts`
- Create: `src/components/Navigation.tsx`
- Modify: `src/App.tsx`
- Test: `src/features/ledger/useLedger.test.tsx`

- [ ] **Step 1: Write state hook test**

Create `src/features/ledger/useLedger.test.tsx`:

```tsx
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useLedger } from './useLedger';
import { LocalLedgerRepository } from './repository';

describe('useLedger', () => {
  it('loads a ledger snapshot and exposes calculated balance', async () => {
    localStorage.clear();
    const repository = new LocalLedgerRepository('hook-test');
    await repository.saveSettings('demo-user', 1000);
    await repository.upsertTransaction('demo-user', {
      type: 'expense',
      amount: 25,
      categoryId: 'demo-user-expense-food',
      occurredAt: '2026-05-24T12:00:00.000Z',
      note: '咖啡',
      source: 'manual',
      paymentChannel: 'wechat',
      externalKey: null
    });

    const { result } = renderHook(() => useLedger(repository, 'demo-user'));

    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.currentBalance).toBe(975);
  });
});
```

- [ ] **Step 2: Implement hook**

Create `src/features/ledger/useLedger.ts`:

```ts
import { useCallback, useEffect, useMemo, useState } from 'react';
import { calculateBalance } from './calculations';
import type { LedgerRepository, NewTransactionInput } from './repository';
import type { Category, LedgerSettings, Transaction } from '../../types/ledger';

type Status = 'loading' | 'ready' | 'error';

export function useLedger(repository: LedgerRepository, userId: string) {
  const [status, setStatus] = useState<Status>('loading');
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<LedgerSettings | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [syncMode, setSyncMode] = useState<'local' | 'cloud'>('local');

  const reload = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      const snapshot = await repository.load(userId);
      setSettings(snapshot.settings);
      setCategories(snapshot.categories);
      setTransactions(snapshot.transactions);
      setSyncMode(snapshot.syncMode);
      setStatus('ready');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '账本加载失败');
      setStatus('error');
    }
  }, [repository, userId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const saveInitialPrincipal = useCallback(async (initialPrincipal: number) => {
    const next = await repository.saveSettings(userId, initialPrincipal);
    setSettings(next);
  }, [repository, userId]);

  const saveCategory = useCallback(async (category: Omit<Category, 'id' | 'userId' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
    const saved = await repository.upsertCategory(userId, category);
    setCategories((current) => current.some((item) => item.id === saved.id)
      ? current.map((item) => (item.id === saved.id ? saved : item))
      : [...current, saved]);
    return saved;
  }, [repository, userId]);

  const saveTransaction = useCallback(async (transaction: NewTransactionInput & { id?: string }) => {
    const saved = await repository.upsertTransaction(userId, transaction);
    setTransactions((current) => current.some((item) => item.id === saved.id)
      ? current.map((item) => (item.id === saved.id ? saved : item))
      : [saved, ...current]);
    return saved;
  }, [repository, userId]);

  const deleteTransaction = useCallback(async (transactionId: string) => {
    await repository.deleteTransaction(userId, transactionId);
    setTransactions((current) => current.filter((transaction) => transaction.id !== transactionId));
  }, [repository, userId]);

  const currentBalance = useMemo(
    () => calculateBalance(settings?.initialPrincipal ?? 0, transactions),
    [settings?.initialPrincipal, transactions]
  );

  return {
    status,
    error,
    settings,
    categories,
    transactions,
    syncMode,
    currentBalance,
    reload,
    saveInitialPrincipal,
    saveCategory,
    saveTransaction,
    deleteTransaction
  };
}
```

- [ ] **Step 3: Add navigation component**

Create `src/components/Navigation.tsx`:

```tsx
import { BarChart3, Home, PlusCircle, Settings } from 'lucide-react';

export type AppView = 'home' | 'entry' | 'stats' | 'settings';

const items = [
  { id: 'home' as const, label: '首页', icon: Home },
  { id: 'entry' as const, label: '记账', icon: PlusCircle },
  { id: 'stats' as const, label: '统计', icon: BarChart3 },
  { id: 'settings' as const, label: '设置', icon: Settings }
];

export function Navigation({ active, onChange }: { active: AppView; onChange: (view: AppView) => void }) {
  return (
    <nav className="navigation" aria-label="主导航">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <button key={item.id} className={active === item.id ? 'nav-item active' : 'nav-item'} onClick={() => onChange(item.id)}>
            <Icon size={20} aria-hidden="true" />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
```

- [ ] **Step 4: Replace app shell**

Replace `src/App.tsx` with:

```tsx
import { useMemo, useState } from 'react';
import { createLedgerRepository } from './features/ledger/supabaseRepository';
import { useLedger } from './features/ledger/useLedger';
import { Navigation, type AppView } from './components/Navigation';

export function App() {
  const repository = useMemo(() => createLedgerRepository(), []);
  const ledger = useLedger(repository, 'demo-user');
  const [activeView, setActiveView] = useState<AppView>('home');

  return (
    <div className="app-layout">
      <Navigation active={activeView} onChange={setActiveView} />
      <main className="app-main">
        <header className="top-bar">
          <div>
            <p className="eyebrow">我的账本</p>
            <h1>{activeView === 'home' ? '首页' : activeView === 'entry' ? '记账' : activeView === 'stats' ? '统计' : '设置'}</h1>
          </div>
          <span className={`sync-badge ${ledger.syncMode}`}>{ledger.syncMode === 'cloud' ? '云同步' : '本地演示'}</span>
        </header>
        {ledger.status === 'loading' && <p className="muted">正在加载账本</p>}
        {ledger.status === 'error' && <p className="error-text">{ledger.error}</p>}
        {ledger.status === 'ready' && <p className="muted">当前余额 ¥{ledger.currentBalance.toLocaleString('zh-CN')}</p>}
      </main>
    </div>
  );
}
```

- [ ] **Step 5: Verify and commit**

Run:

```bash
npm test -- src/features/ledger/useLedger.test.tsx
npm run build
```

Expected: PASS and build succeeds.

Commit:

```bash
git add src/features/ledger/useLedger.ts src/features/ledger/useLedger.test.tsx src/components/Navigation.tsx src/App.tsx src/styles.css
git commit -m "feat: add ledger app state"
```

---

### Task 5: Dashboard, Transaction Form, Stats, and Settings UI

**Files:**
- Create: `src/components/Dashboard.tsx`
- Create: `src/components/TransactionForm.tsx`
- Create: `src/components/StatsView.tsx`
- Create: `src/components/SettingsView.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`
- Test: `src/components/Dashboard.test.tsx`
- Test: `src/components/TransactionForm.test.tsx`

- [ ] **Step 1: Write UI tests**

Create `src/components/Dashboard.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Dashboard } from './Dashboard';

describe('Dashboard', () => {
  it('shows the current balance as the primary number', () => {
    render(
      <Dashboard
        balance={55214}
        periodIncome={8500}
        periodExpense={3286}
        recentTransactions={[]}
        categories={[]}
        onAddIncome={() => undefined}
        onAddExpense={() => undefined}
      />
    );

    expect(screen.getByText('当前余额')).toBeInTheDocument();
    expect(screen.getByText('¥55,214.00')).toBeInTheDocument();
  });
});
```

Create `src/components/TransactionForm.test.tsx`:

```tsx
import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TransactionForm } from './TransactionForm';

describe('TransactionForm', () => {
  it('submits an expense with amount, category, date, and note', async () => {
    const onSubmit = vi.fn();
    render(
      <TransactionForm
        categories={[{ id: 'food', userId: 'u', name: '餐饮', type: 'expense', color: '#000', icon: 'utensils', isSystem: true, sortOrder: 1, createdAt: '', updatedAt: '' }]}
        defaultType="expense"
        onSubmit={onSubmit}
      />
    );

    await userEvent.type(screen.getByLabelText('金额'), '45.8');
    await userEvent.type(screen.getByLabelText('备注'), '晚饭');
    await userEvent.click(screen.getByRole('button', { name: '保存' }));

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ amount: 45.8, note: '晚饭', type: 'expense' }));
  });
});
```

- [ ] **Step 2: Implement Dashboard**

Create `Dashboard.tsx` showing current balance, income, expense, net, quick buttons, and recent records. Use `Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' })` for money.

- [ ] **Step 3: Implement TransactionForm**

Create `TransactionForm.tsx` with segmented income/expense buttons, amount input, category select filtered by type, date input defaulting to today, payment channel select, note input, and validation that amount must be greater than 0.

- [ ] **Step 4: Implement StatsView**

Create `StatsView.tsx` with start/end date inputs, `summarizeTransactions`, total income/expense/net, category rows, and date-descending details.

- [ ] **Step 5: Implement SettingsView**

Create `SettingsView.tsx` with initial principal input, category creation form, category list, sync mode display, and an import panel shell containing source selection plus disabled file controls until Task 6 connects the parser. The visible copy should be concise labels only, not explanatory marketing text.

- [ ] **Step 6: Wire views in App**

Modify `App.tsx` so `home`, `entry`, `stats`, and `settings` render their components, and dashboard buttons switch to `entry` with default income or expense.

- [ ] **Step 7: Polish responsive CSS**

Update `styles.css` with mobile bottom navigation, desktop side navigation, fixed-size icon buttons, readable forms, and stable card/grid dimensions. Avoid one-note palettes by combining warm background, neutral surfaces, green income accents, red/orange expense accents, and blue sync/status accents.

- [ ] **Step 8: Verify and commit**

Run:

```bash
npm test -- src/components/Dashboard.test.tsx src/components/TransactionForm.test.tsx
npm run build
```

Expected: PASS and build succeeds.

Commit:

```bash
git add src/components src/App.tsx src/styles.css
git commit -m "feat: build ledger interface"
```

---

### Task 6: WeChat and Alipay Bill Import

**Files:**
- Create: `src/features/ledger/importers.ts`
- Test: `src/features/ledger/importers.test.ts`
- Modify: `src/components/SettingsView.tsx`

- [ ] **Step 1: Write importer tests**

Create `src/features/ledger/importers.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { parseBillText } from './importers';

describe('parseBillText', () => {
  it('normalizes a WeChat expense row', () => {
    const csv = '交易时间,交易类型,交易对方,商品,收/支,金额(元),支付方式,交易单号\\n2026-05-01 12:30:00,商户消费,便利店,饮料,支出,¥8.50,零钱,wx-1';

    const rows = parseBillText('wechat', csv);

    expect(rows[0]).toMatchObject({
      type: 'expense',
      amount: 8.5,
      note: '便利店 饮料',
      paymentChannel: 'wechat',
      externalKey: 'wx-1'
    });
  });

  it('normalizes an Alipay income row', () => {
    const csv = '交易创建时间,交易分类,交易对方,商品说明,收/支,金额,交易号\\n2026-05-02 09:00:00,转账,朋友,还款,收入,100.00,ali-1';

    const rows = parseBillText('alipay', csv);

    expect(rows[0]).toMatchObject({
      type: 'income',
      amount: 100,
      note: '朋友 还款',
      paymentChannel: 'alipay',
      externalKey: 'ali-1'
    });
  });
});
```

- [ ] **Step 2: Implement CSV parser and normalization**

Create `src/features/ledger/importers.ts`:

```ts
import Papa from 'papaparse';
import type { NewTransactionInput } from './repository';

export type ImportSource = 'wechat' | 'alipay';

export interface ParsedImportRow extends NewTransactionInput {
  raw: Record<string, string>;
  needsReview: boolean;
}

const amountFrom = (value: string) => Number(value.replace(/[¥￥,\\s]/g, ''));

const compact = (...parts: Array<string | undefined>) => parts.filter(Boolean).join(' ').trim();

export function parseBillText(source: ImportSource, text: string): ParsedImportRow[] {
  const parsed = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true });
  return parsed.data
    .filter((row) => Object.values(row).some(Boolean))
    .map((row) => normalizeRow(source, row));
}

function normalizeRow(source: ImportSource, row: Record<string, string>): ParsedImportRow {
  const isWechat = source === 'wechat';
  const direction = row['收/支'] ?? row['收支'] ?? '';
  const amountText = row['金额(元)'] ?? row['金额'] ?? row['交易金额'] ?? '0';
  const occurredAtText = row['交易时间'] ?? row['交易创建时间'] ?? row['付款时间'] ?? new Date().toISOString();
  const externalKey = row['交易单号'] ?? row['交易号'] ?? row['商户单号'] ?? null;
  const type = direction.includes('收入') || direction.includes('收') ? 'income' : 'expense';

  return {
    type,
    amount: amountFrom(amountText),
    categoryId: type === 'income' ? 'income-other' : guessExpenseCategory(row),
    occurredAt: new Date(occurredAtText.replace(' ', 'T')).toISOString(),
    note: compact(row['交易对方'], row['商品'], row['商品说明'], row['交易分类'], row['交易类型']),
    source: isWechat ? 'wechat_import' : 'alipay_import',
    paymentChannel: isWechat ? 'wechat' : 'alipay',
    externalKey,
    raw: row,
    needsReview: amountFrom(amountText) <= 0 || !direction
  };
}

function guessExpenseCategory(row: Record<string, string>) {
  const text = Object.values(row).join(' ');
  if (/餐|饭|咖啡|奶茶|美团|饿了么/.test(text)) return 'expense-food';
  if (/地铁|公交|打车|滴滴|铁路|机票/.test(text)) return 'expense-transport';
  if (/房租|物业|水费|电费|燃气/.test(text)) return 'expense-housing';
  if (/药|医院|门诊/.test(text)) return 'expense-medical';
  if (/淘宝|京东|拼多多|购物/.test(text)) return 'expense-shopping';
  return 'expense-other';
}
```

- [ ] **Step 3: Wire Settings import panel**

Modify `SettingsView.tsx` to allow source selection, file upload, `File.text()` parsing for CSV, preview rows, and confirm import by calling `saveTransaction` for rows not marked `needsReview`. For `.xlsx`, use SheetJS `read` and `utils.sheet_to_csv` before calling `parseBillText`.

- [ ] **Step 4: Verify and commit**

Run:

```bash
npm test -- src/features/ledger/importers.test.ts
npm run build
```

Expected: PASS and build succeeds.

Commit:

```bash
git add src/features/ledger/importers.ts src/features/ledger/importers.test.ts src/components/SettingsView.tsx
git commit -m "feat: add payment bill import"
```

---

### Task 7: Authentication and Cloud Sync Wiring

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/features/ledger/supabaseRepository.ts`
- Create: `src/components/AuthGate.tsx`
- Test: `src/components/AuthGate.test.tsx`

- [ ] **Step 1: Write AuthGate test**

Create `src/components/AuthGate.test.tsx`:

```tsx
import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AuthGate } from './AuthGate';

describe('AuthGate', () => {
  it('asks for an email when cloud sync is enabled and no user is present', async () => {
    const onLogin = vi.fn();
    render(<AuthGate mode="cloud" userEmail={null} onLogin={onLogin} onLogout={() => undefined}>content</AuthGate>);

    await userEvent.type(screen.getByLabelText('邮箱'), 'me@example.com');
    await userEvent.click(screen.getByRole('button', { name: '发送登录链接' }));

    expect(onLogin).toHaveBeenCalledWith('me@example.com');
  });
});
```

- [ ] **Step 2: Implement AuthGate**

Create `src/components/AuthGate.tsx` with two modes:

- `local`: render children and show a compact “本地演示” badge.
- `cloud`: if user email exists, render children and logout button; if not, render email input and submit button for magic link.

- [ ] **Step 3: Wire Supabase auth**

Modify `supabaseRepository.ts` to export the configured Supabase client. Modify `App.tsx` to:

- Subscribe to Supabase auth state when config exists.
- Send magic link with `supabase.auth.signInWithOtp({ email })`.
- Use `session.user.id` as `userId`.
- Use `demo-user` only when Supabase config is missing.
- Show local mode clearly when config is missing.

- [ ] **Step 4: Verify and commit**

Run:

```bash
npm test -- src/components/AuthGate.test.tsx
npm run build
```

Expected: PASS and build succeeds.

Commit:

```bash
git add src/components/AuthGate.tsx src/components/AuthGate.test.tsx src/App.tsx src/features/ledger/supabaseRepository.ts
git commit -m "feat: wire cloud authentication"
```

---

### Task 8: Final Verification and Browser QA

**Files:**
- Modify only files needed for fixes found during verification.

- [ ] **Step 1: Run full test suite**

Run:

```bash
npm test
npm run build
```

Expected: all tests PASS and production build succeeds.

- [ ] **Step 2: Start local dev server**

Run:

```bash
npm run dev
```

Expected: Vite prints a local URL, usually `http://localhost:5173/`.

- [ ] **Step 3: Browser check desktop**

Open the local URL in the Codex in-app browser at desktop size. Verify:

- Dashboard shows 当前余额.
- Setting 初始本金 changes 当前余额.
- Adding an expense lowers 当前余额.
- Adding an income raises 当前余额.
- Stats custom date range updates totals.
- Navigation uses side layout on desktop.

- [ ] **Step 4: Browser check mobile**

Resize or open mobile viewport. Verify:

- Bottom navigation is visible.
- Text does not overlap.
- Transaction form fields fit within the viewport.
- Dashboard cards and buttons do not shift size unexpectedly.

- [ ] **Step 5: Commit verification fixes**

If fixes were needed:

```bash
git add <changed-files>
git commit -m "fix: polish ledger mvp verification"
```

If no fixes were needed, do not create an empty commit.

---

## Self-Review Notes

- Spec coverage: the plan covers PWA, cloud sync, local demo fallback, current balance, quick accounting, arbitrary date stats, built-in/custom categories, WeChat/Alipay import, responsive layout, and sync status.
- Scope boundary: multi-user sharing, native apps, automatic personal-account scraping, budgets, investments, and merchant API ingestion remain out of scope.
- Known execution dependency: true cloud sync requires creating a Supabase project and adding `VITE_SUPABASE_URL` plus `VITE_SUPABASE_ANON_KEY` from `.env.example`. Without those values the app runs in local demo mode.
