// ============================================================================
// Empty State Component
// Beautiful empty state for new conversations
// ============================================================================

import { Sparkles, MessageSquare, Brain, Zap } from 'lucide-react';
import type { Persona } from '../../types/persona';

// ----------------------------------------------------------------------------
// Props
// ----------------------------------------------------------------------------

interface EmptyStateProps {
  persona?: Persona | null;
}

// ----------------------------------------------------------------------------
// Suggestion Cards
// ----------------------------------------------------------------------------

const suggestions = [
  {
    icon: MessageSquare,
    title: 'Start a conversation',
    description: 'Ask a question or share your thoughts',
  },
  {
    icon: Brain,
    title: 'Get insights',
    description: 'Explore ideas and get helpful feedback',
  },
  {
    icon: Zap,
    title: 'Be creative',
    description: 'Brainstorm and generate new ideas',
  },
];

// ----------------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------------

export function EmptyState({ persona }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] py-12 px-4">
      {/* Icon */}
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
          <Sparkles className="w-10 h-10 text-white" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-500 border-4 border-background" />
      </div>

      {/* Title */}
      <h2 className="text-2xl font-bold text-center mb-2">
        {persona ? `Chat with ${persona.name}` : 'Start a Conversation'}
      </h2>

      {/* Description */}
      <p className="text-muted-foreground text-center max-w-md mb-8">
        {persona?.type === 'simulated_person' && (
          <>Practice conversations and explore their perspective on topics.</>
        )}
        {persona?.type === 'journal_assistant' && (
          <>Log your trades, analyze patterns, and improve your decision-making.</>
        )}
        {persona?.type === 'companion' && (
          <>Have a meaningful conversation with a personalized AI companion.</>
        )}
        {(!persona || persona?.type === 'custom') && (
          <>Send a message to begin your conversation.</>
        )}
      </p>

      {/* Suggestion cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl">
        {suggestions.map((suggestion, index) => (
          <div
            key={index}
            className="group p-4 rounded-xl border bg-card hover:bg-accent/50 transition-all duration-200 cursor-pointer"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <suggestion.icon className="w-4 h-4 text-primary" />
              </div>
            </div>
            <h3 className="font-medium text-sm mb-1">{suggestion.title}</h3>
            <p className="text-xs text-muted-foreground">{suggestion.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
