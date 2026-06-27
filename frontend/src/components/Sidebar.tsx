import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CloudUpload,
  FileText,
  ShieldAlert,
  BarChart3,
  Settings,
  ClipboardList,
  ChevronDown,
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'Upload Invoice', path: '/upload', icon: CloudUpload },
  { label: 'Invoices', path: '/invoices', icon: FileText },
  { label: 'Approval / Exceptions', path: '/approvals', icon: ShieldAlert },
  { label: 'Analytics', path: '/analytics', icon: BarChart3 },
  { label: 'Settings', path: '/settings', icon: Settings },
  { label: 'Audit Logs', path: '/audit-logs', icon: ClipboardList },
];

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[260px] bg-sidebar flex flex-col z-50">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border">
        <div className="w-9 h-9 rounded-lg bg-sidebar-primary flex items-center justify-center">
          <FileText className="w-5 h-5 text-sidebar-primary-foreground" />
        </div>
        <div>
          <h1 className="text-sm font-semibold text-sidebar-foreground font-heading leading-tight">
            Invoice Processing
          </h1>
          <p className="text-[11px] text-sidebar-foreground/60">System</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-md shadow-sidebar-primary/25'
                  : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent'
              }`
            }
          >
            <item.icon className="w-[18px] h-[18px] shrink-0" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User Profile */}
      <div className="px-3 py-4 border-t border-sidebar-border">
        <button className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-sidebar-accent transition-colors">
          <div className="w-8 h-8 rounded-full bg-sidebar-primary/20 flex items-center justify-center text-xs font-semibold text-sidebar-primary">
            MA
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-medium text-sidebar-foreground leading-tight">
              Mohammed Asif
            </p>
            <p className="text-[11px] text-sidebar-foreground/50">Finance Team</p>
          </div>
          <ChevronDown className="w-4 h-4 text-sidebar-foreground/40" />
        </button>
      </div>
    </aside>
  );
}
