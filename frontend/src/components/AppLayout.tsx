// AppLayout
// Shared for authenticated pages.

import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { useTranslation, LOCALE_LABELS, type Locale } from '@/i18n';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, Settings, ChevronDown, User as UserIcon, Shield, Globe } from 'lucide-react';

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const { t, locale, setLocale } = useTranslation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50/40">
      <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <span className="text-xl font-bold">{t.common.appName}</span>
          </button>

          <div className="flex items-center gap-2">
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 px-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-sm font-medium text-gray-700">
                  {user?.name?.charAt(0).toUpperCase() || <UserIcon className="h-4 w-4" />}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium leading-none">{user?.name}</p>
                  <p className="text-xs text-muted-foreground leading-none mt-0.5">{user?.email}</p>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-2 py-1.5 sm:hidden">
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <DropdownMenuSeparator className="sm:hidden" />
              <DropdownMenuItem onClick={() => navigate('/account')}>
                <Settings className="mr-2 h-4 w-4" />
                {t.nav.myAccount}
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Globe className="mr-2 h-4 w-4" />
                  {t.nav.language}: {LOCALE_LABELS[locale]}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {(['en', 'pl'] as Locale[]).map((loc) => (
                    <DropdownMenuItem
                      key={loc}
                      onClick={() => setLocale(loc)}
                      className={loc === locale ? 'font-semibold' : ''}
                    >
                      {LOCALE_LABELS[loc]}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              {user?.is_admin && (
                <DropdownMenuItem onClick={() => navigate('/admin')}>
                  <Shield className="mr-2 h-4 w-4" />
                  {t.nav.adminPanel}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                <LogOut className="mr-2 h-4 w-4 text-red-600" />
                {t.nav.logOut}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          </div>
        </div>
      </header>

      {children}
    </div>
  );
}
