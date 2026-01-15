import { Building2, Droplets, Zap, Ruler, Leaf, Flame, Calculator } from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navItems = [
  { id: 'building', label: 'Building', icon: Building2, color: 'var(--tab-building)' },
  { id: 'plumbing', label: 'Plumbing', icon: Droplets, color: 'var(--tab-plumbing)' },
  { id: 'electrical', label: 'Electrical', icon: Zap, color: 'var(--tab-electrical)' },
  { id: 'additions', label: 'Additions', icon: Ruler, color: 'var(--tab-additions)' },
  { id: 'sustainability', label: 'Green', icon: Leaf, color: 'var(--tab-sustainability)' },
  { id: 'fire-safety', label: 'Fire', icon: Flame, color: 'var(--tab-fire)' },
  { id: 'design-tools', label: 'Tools', icon: Calculator, color: 'var(--tab-design)' },
];

export function MobileBottomNav({ activeTab, onTabChange }: MobileBottomNavProps) {
  return (
    <nav 
      className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-40 safe-area-inset-bottom"
      role="navigation"
      aria-label="Mobile bottom navigation"
    >
      <div className="flex justify-around items-center h-16 overflow-x-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center justify-center min-w-[60px] h-full px-2 transition-colors ${
                isActive ? 'text-foreground' : 'text-muted-foreground'
              }`}
              style={{
                borderTop: isActive ? `3px solid ${item.color}` : '3px solid transparent',
              }}
              aria-label={`Navigate to ${item.label}`}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon 
                className="w-5 h-5 mb-1" 
                style={{ color: isActive ? item.color : undefined }}
              />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
