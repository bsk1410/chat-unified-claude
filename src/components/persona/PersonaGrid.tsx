// ============================================================================
// Persona Grid Component
// Responsive grid layout for displaying personas
// ============================================================================

import { Plus, Search, Filter } from 'lucide-react';
import { useState, useMemo } from 'react';
import { PersonaCard } from './PersonaCard';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { cn } from '../../lib/utils';
import type { Persona } from '../../types/persona';
import { PERSONA_ENGINE } from '../../lib/constants';

// ----------------------------------------------------------------------------
// Props
// ----------------------------------------------------------------------------

interface PersonaGridProps {
  personas: Persona[];
  selectedPersonaId?: string | null;
  conversationCounts?: Record<string, number>;
  isLoading?: boolean;
  onSelectPersona?: (persona: Persona) => void;
  onCreatePersona?: () => void;
  onEditPersona?: (persona: Persona) => void;
  onDeletePersona?: (persona: Persona) => void;
  onViewMemory?: (persona: Persona) => void;
  className?: string;
}

// ----------------------------------------------------------------------------
// Empty State
// ----------------------------------------------------------------------------

function EmptyPersonas({ onCreate }: { onCreate?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-6 shadow-lg shadow-violet-500/25">
        <Plus className="w-10 h-10 text-white" />
      </div>
      <h3 className="text-xl font-semibold mb-2">No Personas Yet</h3>
      <p className="text-muted-foreground text-center max-w-sm mb-6">
        Create your first persona to start having conversations with AI-powered characters.
      </p>
      {onCreate && (
        <Button onClick={onCreate} size="lg">
          <Plus className="mr-2 h-5 w-5" />
          Create Persona
        </Button>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------------
// Loading Skeleton
// ----------------------------------------------------------------------------

function PersonaCardSkeleton() {
  return (
    <div className="rounded-xl border bg-card overflow-hidden animate-pulse">
      <div className="h-1.5 bg-muted" />
      <div className="p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-14 h-14 rounded-full bg-muted" />
          <div className="flex-1">
            <div className="h-4 w-24 bg-muted rounded mb-2" />
            <div className="h-3 w-16 bg-muted rounded" />
          </div>
        </div>
        <div className="h-3 w-full bg-muted rounded mb-2" />
        <div className="h-3 w-2/3 bg-muted rounded mb-4" />
        <div className="flex items-center justify-between">
          <div className="h-5 w-16 bg-muted rounded" />
          <div className="h-3 w-12 bg-muted rounded" />
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------------

export function PersonaGrid({
  personas,
  selectedPersonaId,
  conversationCounts = {},
  isLoading,
  onSelectPersona,
  onCreatePersona,
  onEditPersona,
  onDeletePersona,
  onViewMemory,
  className,
}: PersonaGridProps) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Filter personas
  const filteredPersonas = useMemo(() => {
    return personas.filter((persona) => {
      const matchesSearch =
        persona.name.toLowerCase().includes(search.toLowerCase()) ||
        persona.system_prompt.toLowerCase().includes(search.toLowerCase());

      const matchesType = typeFilter === 'all' || persona.type === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [personas, search, typeFilter]);

  if (isLoading) {
    return (
      <div className={cn('space-y-6', className)}>
        <div className="flex items-center gap-4">
          <div className="h-10 flex-1 bg-muted rounded-lg animate-pulse" />
          <div className="h-10 w-32 bg-muted rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <PersonaCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (personas.length === 0) {
    return <EmptyPersonas onCreate={onCreatePersona} />;
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Search and filter bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search personas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[160px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {PERSONA_ENGINE.PERSONA_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {onCreatePersona && (
            <Button onClick={onCreatePersona}>
              <Plus className="mr-2 h-4 w-4" />
              New Persona
            </Button>
          )}
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        {filteredPersonas.length} of {personas.length} personas
      </div>

      {/* Persona grid */}
      {filteredPersonas.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPersonas.map((persona) => (
            <PersonaCard
              key={persona.id}
              persona={persona}
              isSelected={persona.id === selectedPersonaId}
              conversationCount={conversationCounts[persona.id] || 0}
              onSelect={onSelectPersona}
              onEdit={onEditPersona}
              onDelete={onDeletePersona}
              onViewMemory={onViewMemory}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No personas match your search</p>
        </div>
      )}
    </div>
  );
}
