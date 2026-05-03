import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  ParkingCircle, 
  UtensilsCrossed, 
  Calendar, 
  MessageSquare,
  LogOut,
  Menu,
  X
} from "lucide-react";
import { useState } from "react";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const isAdmin = user?.role === 'admin' || user?.role === 'sindico' || user?.role === 'subsindico';

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
    ...(isAdmin ? [
      { icon: Users, label: 'Condôminos', href: '/residents' },
      { icon: Building2, label: 'Unidades', href: '/units' },
      { icon: ParkingCircle, label: 'Garagens', href: '/garages' },
      { icon: UtensilsCrossed, label: 'Utensílios', href: '/utensils' },
    ] : []),
    { icon: Calendar, label: 'Reservas', href: '/reservations' },
    { icon: MessageSquare, label: 'Chat', href: '/chat' },
  ];

  const handleLogout = async () => {
    await logout();
    setLocation('/');
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-card border-r border-border transition-all duration-300 flex flex-col`}>
        {/* Logo/Header */}
        <div className="p-6 border-b border-border flex items-center justify-between">
          {sidebarOpen && (
            <h1 className="text-xl font-bold text-foreground">Condomínio</h1>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.href}
              onClick={() => setLocation(item.href)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent transition-colors text-foreground hover:text-accent-foreground"
              title={!sidebarOpen ? item.label : undefined}
            >
              <item.icon size={20} />
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-border space-y-3">
          {sidebarOpen && (
            <div className="px-2">
              <p className="text-sm font-medium text-foreground truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
            </div>
          )}
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full justify-start gap-2"
          >
            <LogOut size={20} />
            {sidebarOpen && 'Sair'}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
