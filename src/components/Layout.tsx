import { ReactNode, useState } from 'react';
import { LayoutDashboard, CreditCard, List, Upload, LogOut, Menu, X, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

type LayoutProps = {
  children: ReactNode;
  currentView: string;
  onViewChange: (view: string) => void;
};

export default function Layout({ children, currentView, onViewChange }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { signOut, user } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      color: 'from-blue-500 to-blue-600',
    },
    {
      id: 'transactions',
      label: 'Transacciones',
      icon: List,
      color: 'from-emerald-500 to-emerald-600',
    },
    { id: 'upload', label: 'Carga Masiva', icon: Upload, color: 'from-orange-500 to-orange-600' },
    {
      id: 'scheduled',
      label: 'Cargo programado',
      icon: CreditCard,
      color: 'from-orange-500 to-orange-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
            TOBB Pay
          </h1>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      <div className="flex">
        <aside
          className={`
            fixed lg:static inset-y-0 left-0 z-50
            w-72 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900
            transform transition-transform duration-300 ease-in-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            shadow-2xl
          `}
        >
          <div className="h-full flex flex-col relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMiI+PHBhdGggZD0iTTM2IDM0djItaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bS00LTR2Mmgydi0yaC0yem00IDE2djJoMnYtMmgtMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-50"></div>

            <div className="relative p-6 border-b border-white border-opacity-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">TOBB Pay</h1>
                  <p className="text-xs text-blue-300">Pagos Electrónicos</p>
                </div>
              </div>

              <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-3 border border-white border-opacity-20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                    {user?.email?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{user?.email}</p>
                    <p className="text-blue-300 text-xs">Usuario activo</p>
                  </div>
                </div>
              </div>
            </div>

            <nav className="flex-1 p-4 space-y-2 relative">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onViewChange(item.id);
                      setSidebarOpen(false);
                    }}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 rounded-xl
                      transition-all duration-200 group relative overflow-hidden
                      ${
                        isActive
                          ? 'bg-white bg-opacity-20 text-white shadow-lg backdrop-blur-sm'
                          : 'text-gray-300 hover:bg-white hover:bg-opacity-10 hover:text-white'
                      }
                    `}
                  >
                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl"></div>
                    )}
                    <div
                      className={`
                      w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
                      relative z-10 transition-transform group-hover:scale-110
                      ${
                        isActive
                          ? `bg-gradient-to-br ${item.color} shadow-lg`
                          : 'bg-white bg-opacity-10'
                      }
                    `}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="font-medium relative z-10">{item.label}</span>
                    {isActive && (
                      <div className="ml-auto w-2 h-2 rounded-full bg-blue-400 relative z-10 animate-pulse"></div>
                    )}
                  </button>
                );
              })}
            </nav>

            <div className="p-4 border-t border-white border-opacity-10 relative">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-4 py-3 text-red-300 hover:text-red-400 hover:bg-red-500 hover:bg-opacity-20 rounded-xl transition-all duration-200 group"
              >
                <div className="w-10 h-10 rounded-lg bg-red-500 bg-opacity-20 flex items-center justify-center flex-shrink-0 group-hover:bg-opacity-30 transition-all">
                  <LogOut className="w-5 h-5" />
                </div>
                <span className="font-medium">Cerrar Sesión</span>
              </button>

              <div className="mt-4 text-center text-xs text-gray-400">
                <p>© 2025 TOBB Pay</p>
                <p className="mt-1">v1.0.0</p>
              </div>
            </div>
          </div>
        </aside>

        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-60 z-40 lg:hidden backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <main className="flex-1 p-6 lg:p-8 min-h-screen">
          <div className="mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
