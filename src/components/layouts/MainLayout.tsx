import { Link, useLocation } from 'react-router-dom'
import {
  Home,
  Settings,
  BarChart3,
  CreditCard,
  History,
  LogOut,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ModeToggle } from '@/components/ModeToggle'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/store/authStore'
import { Button as UIButton } from '@/components/ui/button'

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const location = useLocation()
  const { t } = useTranslation('navigation')
  const { user, logout } = useAuthStore()

  if (location.pathname === '/' || location.pathname === '/login') {
    return <>{children}</>
  }

  const navLinks = [
    {
      to: '/dashboard',
      icon: <Home className="h-4 w-4" />,
      text: t('dashboard'),
    },
    {
      to: '/subscriptions',
      icon: <CreditCard className="h-4 w-4" />,
      text: t('subscriptions'),
    },
    {
      to: '/expense-reports',
      icon: <BarChart3 className="h-4 w-4" />,
      text: t('reports'),
    },
    {
      to: '/notifications',
      icon: <History className="h-4 w-4" />,
      text: t('notifications'),
    },
    {
      to: '/settings',
      icon: <Settings className="h-4 w-4" />,
      text: t('settings'),
    },
  ]

  return (
    <div className="flex flex-col min-h-screen bg-transparent relative z-10 w-full overflow-x-hidden">
      <header className="sticky top-4 z-20 mx-4 sm:mx-8 md:mx-auto max-w-6xl rounded-full border border-white/10 dark:border-white/5 bg-white/20 dark:bg-black/20 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all">
        <div className="flex h-16 items-center justify-between px-6 sm:px-8">
          <div className="flex items-center gap-6 md:gap-10">
            <Link to="/dashboard" className="flex items-center space-x-2">
              <span className="font-bold text-lg sm:text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">SubManager</span>
            </Link>
            <nav className="hidden md:flex items-center gap-1 sm:gap-2">
              {navLinks.map((link) => (
                <Link to={link.to} key={link.to}>
                  <Button
                    variant={
                      location.pathname === link.to ? 'default' : 'ghost'
                    }
                    size="sm"
                    className={`px-3 sm:px-4 rounded-full transition-all duration-300 ${location.pathname === link.to ? 'shadow-[0_0_15px_rgba(0,0,0,0.1)] dark:shadow-[0_0_15px_rgba(255,255,255,0.05)]' : 'opacity-80 hover:opacity-100 hover:bg-white/10 dark:hover:bg-white/5'}`}
                  >
                    {link.icon}
                    <span className="md:ml-2 font-medium">{link.text}</span>
                  </Button>
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ModeToggle />
            {user && (
              <div className="flex items-center gap-4 ml-2">
                <span className="hidden md:inline font-semibold text-sm opacity-80 pl-2 border-l border-white/20">{user.name || user.username}</span>
                <UIButton
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  className="hidden md:inline-flex rounded-full hover:bg-white/10 dark:hover:bg-white/5"
                >
                  {t('logout')}
                </UIButton>
                <UIButton
                  variant="ghost"
                  size="icon"
                  onClick={logout}
                  className="md:hidden rounded-full hover:bg-white/10 dark:hover:bg-white/5"
                >
                  <LogOut className="h-5 w-5" />
                </UIButton>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="container py-4 sm:py-6 px-4 sm:px-6 flex-grow pb-20 md:pb-6 relative z-10">
        {children}
      </main>

    
      {/* Bottom Navigation for Mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t bg-background">
        <div className="container mx-auto px-4">
          <nav className="flex justify-around items-center h-16">
            {navLinks.map((link) => (
              <Link
                to={link.to}
                key={link.to}
                className="flex flex-col items-center justify-center text-muted-foreground hover:text-primary"
              >
                <Button
                  variant={
                    location.pathname === link.to ? 'secondary' : 'ghost'
                  }
                  size="icon"
                >
                  {link.icon}
                </Button>
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </div>
  )
}
