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
