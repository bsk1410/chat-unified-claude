// ============================================================================
// Navigation Component
// Main navigation with user menu and mobile responsiveness
// ============================================================================

import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Menu,
  X,
  LayoutDashboard,
  Settings,
  LogOut,
  User,
  Moon,
  Sun,
  Monitor,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';

import { Logo } from './Logo';
import { useAuth, useUser } from '@/hooks';
import { useUIStore } from '@/stores';
import { ROUTES, FEATURES } from '@/lib/constants';
import { getInitials } from '@/lib/utils';
import type { Theme } from '@/types';

// Navigation links configuration
const navLinks = [
  { href: ROUTES.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
  { href: ROUTES.SETTINGS, label: 'Settings', icon: Settings },
];

interface NavigationProps {
  variant?: 'default' | 'minimal';
}

export function Navigation({ variant = 'default' }: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const { user, signOut, isAuthenticated } = useAuth();
  const { profile } = useUser();
  const { theme, setTheme } = useUIStore();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Sign out error:', error);
      }
    }
  };

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="h-4 w-4" />;
      case 'dark':
        return <Moon className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Logo size="md" />

        {/* Desktop Navigation */}
        {variant === 'default' && isAuthenticated && (
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.href;
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary ${
                    isActive
                      ? 'text-primary'
                      : 'text-muted-foreground'
                  }`}
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        )}

        {/* Right Side */}
        <div className="flex items-center gap-4">
          {/* Theme Toggle (for non-authenticated users) */}
          {FEATURES.DARK_MODE_ENABLED && !isAuthenticated && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                const next: Theme =
                  theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
                setTheme(next);
              }}
              className="hidden md:flex"
            >
              {getThemeIcon()}
              <span className="sr-only">Toggle theme</span>
            </Button>
          )}

          {isAuthenticated ? (
            <>
              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-9 w-9 rounded-full"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarImage
                        src={profile?.avatar_url || undefined}
                        alt={profile?.display_name || 'User'}
                      />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getInitials(
                          profile?.display_name || user?.email || 'U'
                        )}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {profile?.display_name || 'User'}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  <DropdownMenuItem asChild>
                    <Link to={ROUTES.DASHBOARD} className="flex items-center">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild>
                    <Link to={ROUTES.SETTINGS} className="flex items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>

                  {FEATURES.DARK_MODE_ENABLED && (
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        {getThemeIcon()}
                        <span className="ml-2">Theme</span>
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent>
                        <DropdownMenuRadioGroup
                          value={theme}
                          onValueChange={(value) => setTheme(value as Theme)}
                        >
                          <DropdownMenuRadioItem value="light">
                            <Sun className="mr-2 h-4 w-4" />
                            Light
                          </DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="dark">
                            <Moon className="mr-2 h-4 w-4" />
                            Dark
                          </DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="system">
                            <Monitor className="mr-2 h-4 w-4" />
                            System
                          </DropdownMenuRadioItem>
                        </DropdownMenuRadioGroup>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                  )}

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
                <span className="sr-only">Toggle menu</span>
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" asChild className="hidden sm:flex">
                <Link to={ROUTES.LOGIN}>Sign in</Link>
              </Button>
              <Button asChild>
                <Link to={ROUTES.SIGNUP}>Get Started</Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && isAuthenticated && (
        <div className="border-t md:hidden">
          <nav className="container py-4 space-y-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.href;
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
            <Separator className="my-2" />
            <button
              onClick={() => {
                handleSignOut();
                setMobileMenuOpen(false);
              }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}

export default Navigation;
