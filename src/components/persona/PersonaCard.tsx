// ============================================================================
// Persona Card Component
// Beautiful card component for displaying persona information
// ============================================================================

import { User, TrendingUp, Heart, Sparkles, MessageSquare, MoreVertical, Edit, Trash2, Brain } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { cn } from '../../lib/utils';
import type { Persona } from '../../types/persona';
import { PERSONA_ENGINE } from '../../lib/constants';

// ----------------------------------------------------------------------------
// Icon Mapping
// ----------------------------------------------------------------------------

const iconMap = {
  User,
  TrendingUp,
  Heart,
  Sparkles,
} as const;

// ----------------------------------------------------------------------------
// Props
// ----------------------------------------------------------------------------

interface PersonaCardProps {
  persona: Persona;
  isSelected?: boolean;
  conversationCount?: number;
  onSelect?: (persona: Persona) => void;
  onEdit?: (persona: Persona) => void;
  onDelete?: (persona: Persona) => void;
  onViewMemory?: (persona: Persona) => void;
  className?: string;
}

// ----------------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------------

export function PersonaCard({
  persona,
  isSelected,
  conversationCount = 0,
  onSelect,
  onEdit,
  onDelete,
  onViewMemory,
  className,
}: PersonaCardProps) {
  const typeInfo = PERSONA_ENGINE.PERSONA_TYPES.find(t => t.value === persona.type);
  const strategyInfo = PERSONA_ENGINE.MEMORY_STRATEGIES.find(s => s.value === persona.memory_strategy);
  const IconComponent = iconMap[typeInfo?.icon as keyof typeof iconMap] || Sparkles;

  // Gradient backgrounds by persona type
  const gradients: Record<string, string> = {
    simulated_person: 'from-blue-500 to-cyan-500',
    journal_assistant: 'from-emerald-500 to-teal-500',
    companion: 'from-pink-500 to-rose-500',
    custom: 'from-violet-500 to-purple-500',
  };

  const gradient = gradients[persona.type] || gradients.custom;

  return (
    <Card
      className={cn(
        'group relative overflow-hidden cursor-pointer transition-all duration-300',
        'hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1',
        isSelected && 'ring-2 ring-primary shadow-lg',
        className
      )}
      onClick={() => onSelect?.(persona)}
    >
      {/* Gradient accent bar */}
      <div className={cn('h-1.5 bg-gradient-to-r', gradient)} />

      <CardContent className="p-5">
        {/* Top section with avatar and actions */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-14 w-14 ring-2 ring-background shadow-lg">
                <AvatarImage src={persona.avatar_url || undefined} />
                <AvatarFallback className={cn('bg-gradient-to-br text-white font-bold text-lg', gradient)}>
                  {persona.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {persona.is_active && (
                <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-green-500 border-2 border-background" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-foreground truncate">{persona.name}</h3>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <IconComponent className="w-3 h-3" />
                <span>{typeInfo?.label || 'Custom'}</span>
              </div>
            </div>
          </div>

          {/* Actions dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {onEdit && (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(persona); }}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Persona
                </DropdownMenuItem>
              )}
              {onViewMemory && (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onViewMemory(persona); }}>
                  <Brain className="mr-2 h-4 w-4" />
                  View Memory
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {onDelete && (
                <DropdownMenuItem
                  onClick={(e) => { e.stopPropagation(); onDelete(persona); }}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* System prompt preview */}
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4 min-h-[2.5rem]">
          {persona.system_prompt.substring(0, 120)}
          {persona.system_prompt.length > 120 && '...'}
        </p>

        {/* Bottom section with badges and stats */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {strategyInfo?.label || 'Memory'}
            </Badge>
          </div>

          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{conversationCount} chats</span>
          </div>
        </div>
      </CardContent>

      {/* Selection overlay */}
      {isSelected && (
        <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
      )}
    </Card>
  );
}
