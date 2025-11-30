// ============================================================================
// Chat Header Component
// Shows persona info and conversation actions
// ============================================================================

import { MoreVertical, Archive, Trash2, Settings, Sparkles } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Badge } from '../ui/badge';
import type { Persona, Conversation } from '../../types/persona';
import { PERSONA_ENGINE } from '../../lib/constants';

// ----------------------------------------------------------------------------
// Props
// ----------------------------------------------------------------------------

interface ChatHeaderProps {
  persona?: Persona | null;
  conversation?: Conversation | null;
  onArchive?: () => void;
  onDelete?: () => void;
  onSettings?: () => void;
}

// ----------------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------------

export function ChatHeader({
  persona,
  conversation,
  onArchive,
  onDelete,
  onSettings,
}: ChatHeaderProps) {
  const personaTypeInfo = PERSONA_ENGINE.PERSONA_TYPES.find(
    (t) => t.value === persona?.type
  );

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b bg-background/80 backdrop-blur-sm">
      {/* Left side - Persona info */}
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10 ring-2 ring-primary/20">
          <AvatarImage src={persona?.avatar_url || undefined} />
          <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white font-semibold">
            {persona?.name?.charAt(0) || <Sparkles className="w-4 h-4" />}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-foreground truncate">
              {persona?.name || 'Select a Persona'}
            </h2>
            {persona?.is_active && (
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {personaTypeInfo && (
              <Badge variant="secondary" className="text-xs py-0">
                {personaTypeInfo.label}
              </Badge>
            )}
            {conversation?.title && (
              <span className="truncate">{conversation.title}</span>
            )}
          </div>
        </div>
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center gap-2">
        {conversation && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {onSettings && (
                <DropdownMenuItem onClick={onSettings}>
                  <Settings className="mr-2 h-4 w-4" />
                  Conversation Settings
                </DropdownMenuItem>
              )}
              {onArchive && (
                <DropdownMenuItem onClick={onArchive}>
                  <Archive className="mr-2 h-4 w-4" />
                  Archive Conversation
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {onDelete && (
                <DropdownMenuItem
                  onClick={onDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Conversation
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
