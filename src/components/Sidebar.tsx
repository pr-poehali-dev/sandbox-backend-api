import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { cn } from '@/lib/utils';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Дашборд', icon: 'LayoutDashboard' },
  { id: 'sandbox', label: 'Sandbox', icon: 'FlaskConical' },
  { id: 'history', label: 'История', icon: 'History' },
  { id: 'api-keys', label: 'API-ключи', icon: 'Key' },
  { id: 'webhooks', label: 'Веб-хуки', icon: 'Webhook' },
  { id: 'logs', label: 'Логи', icon: 'Terminal' },
  { id: 'settings', label: 'Настройки', icon: 'Settings' },
];

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <div className="w-64 bg-sidebar border-r border-border h-screen flex flex-col">
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon name="Terminal" className="text-primary" size={24} />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">API Hub</h1>
            <p className="text-xs text-muted-foreground">Developer Portal</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
              "hover:bg-sidebar-accent text-left",
              activeTab === item.id
                ? "bg-sidebar-accent text-primary font-medium"
                : "text-muted-foreground"
            )}
          >
            <Icon name={item.icon} size={20} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-sidebar-accent">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-primary text-sm font-semibold">D</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">Developer</p>
            <p className="text-xs text-muted-foreground truncate">dev@api.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}