// ============================================================================
// Persona Creator Component
// Beautiful wizard dialog for creating new personas
// ============================================================================

import { useState } from 'react';
import { User, TrendingUp, Heart, Sparkles, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { cn } from '../../lib/utils';
import { PERSONA_ENGINE } from '../../lib/constants';
import type { PersonaCreate } from '../../types/persona';
import type { PersonaType, MemoryStrategy } from '../../lib/constants';

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

interface PersonaCreatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: PersonaCreate) => Promise<void>;
  isSubmitting?: boolean;
}

// ----------------------------------------------------------------------------
// Steps
// ----------------------------------------------------------------------------

type Step = 'type' | 'details' | 'memory' | 'review';

const steps: Step[] = ['type', 'details', 'memory', 'review'];

const stepInfo = {
  type: { title: 'Choose Type', description: 'Select the persona type' },
  details: { title: 'Details', description: 'Name and describe your persona' },
  memory: { title: 'Memory', description: 'Configure memory strategy' },
  review: { title: 'Review', description: 'Confirm your choices' },
};

// ----------------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------------

export function PersonaCreator({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
}: PersonaCreatorProps) {
  const [step, setStep] = useState<Step>('type');
  const [formData, setFormData] = useState<Partial<PersonaCreate>>({
    type: undefined,
    name: '',
    system_prompt: '',
    voice_notes: '',
    memory_strategy: 'array',
    max_context_tokens: PERSONA_ENGINE.DEFAULT_MAX_CONTEXT_TOKENS,
    memory_retrieval_count: PERSONA_ENGINE.DEFAULT_MEMORY_RETRIEVAL_COUNT,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const currentStepIndex = steps.indexOf(step);

  // Reset form when dialog closes
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setStep('type');
      setFormData({
        type: undefined,
        name: '',
        system_prompt: '',
        voice_notes: '',
        memory_strategy: 'array',
        max_context_tokens: PERSONA_ENGINE.DEFAULT_MAX_CONTEXT_TOKENS,
        memory_retrieval_count: PERSONA_ENGINE.DEFAULT_MEMORY_RETRIEVAL_COUNT,
      });
      setErrors({});
    }
    onOpenChange(open);
  };

  // Validation
  const validateStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 'type' && !formData.type) {
      newErrors.type = 'Please select a persona type';
    }

    if (step === 'details') {
      if (!formData.name?.trim()) {
        newErrors.name = 'Name is required';
      }
      if (!formData.system_prompt?.trim()) {
        newErrors.system_prompt = 'System prompt is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Navigation
  const goNext = () => {
    if (!validateStep()) return;
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setStep(steps[nextIndex]);
    }
  };

  const goBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setStep(steps[prevIndex]);
    }
  };

  // Submit
  const handleSubmit = async () => {
    if (!validateStep()) return;
    if (!formData.type || !formData.name || !formData.system_prompt) return;

    await onSubmit({
      type: formData.type,
      name: formData.name,
      system_prompt: formData.system_prompt,
      voice_notes: formData.voice_notes || null,
      memory_strategy: formData.memory_strategy as MemoryStrategy,
      max_context_tokens: formData.max_context_tokens,
      memory_retrieval_count: formData.memory_retrieval_count,
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{stepInfo[step].title}</DialogTitle>
          <DialogDescription>{stepInfo[step].description}</DialogDescription>
        </DialogHeader>

        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 py-4">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all',
                  i < currentStepIndex && 'bg-primary text-primary-foreground',
                  i === currentStepIndex && 'bg-primary text-primary-foreground ring-4 ring-primary/20',
                  i > currentStepIndex && 'bg-muted text-muted-foreground'
                )}
              >
                {i < currentStepIndex ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    'w-8 h-0.5 mx-1',
                    i < currentStepIndex ? 'bg-primary' : 'bg-muted'
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="py-4 min-h-[280px]">
          {/* Type selection */}
          {step === 'type' && (
            <div className="grid grid-cols-2 gap-4">
              {PERSONA_ENGINE.PERSONA_TYPES.map((type) => {
                const Icon = iconMap[type.icon as keyof typeof iconMap] || Sparkles;
                const isSelected = formData.type === type.value;

                return (
                  <button
                    key={type.value}
                    onClick={() => setFormData({ ...formData, type: type.value as PersonaType })}
                    className={cn(
                      'p-4 rounded-xl border-2 text-left transition-all',
                      'hover:border-primary/50 hover:bg-accent/50',
                      isSelected && 'border-primary bg-primary/5',
                      !isSelected && 'border-muted'
                    )}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center',
                        isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                      )}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="font-medium">{type.label}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{type.description}</p>
                  </button>
                );
              })}
            </div>
          )}

          {/* Details */}
          {step === 'details' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Elon Musk, Trading Mentor, Alex"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={errors.name ? 'border-destructive' : ''}
                />
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="system_prompt">System Prompt *</Label>
                <Textarea
                  id="system_prompt"
                  placeholder="Describe the persona's personality, knowledge, and how they should respond..."
                  value={formData.system_prompt || ''}
                  onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })}
                  className={cn('min-h-[120px]', errors.system_prompt ? 'border-destructive' : '')}
                />
                {errors.system_prompt && <p className="text-xs text-destructive">{errors.system_prompt}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="voice_notes">Voice Notes (optional)</Label>
                <Textarea
                  id="voice_notes"
                  placeholder="Additional notes about speaking style, tone, catchphrases..."
                  value={formData.voice_notes || ''}
                  onChange={(e) => setFormData({ ...formData, voice_notes: e.target.value })}
                  className="min-h-[80px]"
                />
              </div>
            </div>
          )}

          {/* Memory configuration */}
          {step === 'memory' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Memory Strategy</Label>
                <div className="grid gap-3">
                  {PERSONA_ENGINE.MEMORY_STRATEGIES.map((strategy) => (
                    <button
                      key={strategy.value}
                      onClick={() => setFormData({ ...formData, memory_strategy: strategy.value as MemoryStrategy })}
                      className={cn(
                        'p-4 rounded-lg border-2 text-left transition-all',
                        'hover:border-primary/50',
                        formData.memory_strategy === strategy.value && 'border-primary bg-primary/5',
                        formData.memory_strategy !== strategy.value && 'border-muted'
                      )}
                    >
                      <div className="font-medium">{strategy.label}</div>
                      <p className="text-sm text-muted-foreground">{strategy.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="max_context_tokens">Max Context Tokens</Label>
                  <Input
                    id="max_context_tokens"
                    type="number"
                    value={formData.max_context_tokens || PERSONA_ENGINE.DEFAULT_MAX_CONTEXT_TOKENS}
                    onChange={(e) => setFormData({ ...formData, max_context_tokens: parseInt(e.target.value) || PERSONA_ENGINE.DEFAULT_MAX_CONTEXT_TOKENS })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="memory_retrieval_count">Memory Retrieval Count</Label>
                  <Input
                    id="memory_retrieval_count"
                    type="number"
                    value={formData.memory_retrieval_count || PERSONA_ENGINE.DEFAULT_MEMORY_RETRIEVAL_COUNT}
                    onChange={(e) => setFormData({ ...formData, memory_retrieval_count: parseInt(e.target.value) || PERSONA_ENGINE.DEFAULT_MEMORY_RETRIEVAL_COUNT })}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Review */}
          {step === 'review' && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                <div>
                  <span className="text-sm text-muted-foreground">Type</span>
                  <p className="font-medium">
                    {PERSONA_ENGINE.PERSONA_TYPES.find(t => t.value === formData.type)?.label}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Name</span>
                  <p className="font-medium">{formData.name}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">System Prompt</span>
                  <p className="text-sm line-clamp-3">{formData.system_prompt}</p>
                </div>
                {formData.voice_notes && (
                  <div>
                    <span className="text-sm text-muted-foreground">Voice Notes</span>
                    <p className="text-sm line-clamp-2">{formData.voice_notes}</p>
                  </div>
                )}
                <div>
                  <span className="text-sm text-muted-foreground">Memory Strategy</span>
                  <p className="font-medium">
                    {PERSONA_ENGINE.MEMORY_STRATEGIES.find(s => s.value === formData.memory_strategy)?.label}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <div className="flex w-full justify-between">
            <Button
              variant="ghost"
              onClick={goBack}
              disabled={currentStepIndex === 0 || isSubmitting}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            {step !== 'review' ? (
              <Button onClick={goNext}>
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <span className="animate-spin mr-2">...</span>
                    Creating...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Create Persona
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
