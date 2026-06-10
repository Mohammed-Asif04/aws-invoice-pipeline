import { Bell, HelpCircle } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  return (
    <header className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground font-heading tracking-tight">
          {title}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
      </div>
      <div className="flex items-center gap-3">
        <button className="relative p-2 rounded-lg hover:bg-accent transition-colors">
          <Bell className="w-5 h-5 text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />
        </button>
        <button className="p-2 rounded-lg hover:bg-accent transition-colors">
          <HelpCircle className="w-5 h-5 text-muted-foreground" />
        </button>
        <div className="flex items-center gap-2 pl-2 border-l border-border">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
            AS
          </div>
          <span className="text-sm font-medium text-foreground">Ananya Sharma</span>
        </div>
      </div>
    </header>
  );
}
