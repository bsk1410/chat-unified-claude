// ============================================================================
// Logo Component
// Brand logo with optional text
// ============================================================================

import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { APP, ROUTES } from '@/lib/constants';

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  linkToHome?: boolean;
}

export function Logo({
  className,
  showText = true,
  size = 'md',
  linkToHome = true,
}: LogoProps) {
  const sizes = {
    sm: { icon: 'h-6 w-6', text: 'text-lg' },
    md: { icon: 'h-8 w-8', text: 'text-xl' },
    lg: { icon: 'h-10 w-10', text: 'text-2xl' },
  };

  const content = (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="relative">
        <div className="absolute inset-0 bg-primary/20 blur-lg rounded-full" />
        <div className="relative bg-gradient-to-br from-primary to-primary/80 p-2 rounded-xl shadow-lg">
          <Shield className={cn(sizes[size].icon, 'text-primary-foreground')} />
        </div>
      </div>
      {showText && (
        <span className={cn('font-bold tracking-tight', sizes[size].text)}>
          {APP.NAME}
        </span>
      )}
    </div>
  );

  if (linkToHome) {
    return (
      <Link to={ROUTES.HOME} className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg">
        {content}
      </Link>
    );
  }

  return content;
}

export default Logo;
