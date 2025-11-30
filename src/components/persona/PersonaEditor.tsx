// ============================================================================
// Persona Editor Component
// Form dialog for editing existing personas
// ============================================================================

import { useState, useEffect } from 'react';
import { Save, X } from 'lucide-react';
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
import { Switch } from '../ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { cn } from '../../lib/utils';
import { PERSONA_ENGINE } from '../../lib/constants';
import type { Persona, PersonaUpdate } from '../../types/persona';
import type { MemoryStrategy } from '../../lib/constants';

// ----------------------------------------------------------------------------
// Props
// ----------------------------------------------------------------------------

interface PersonaEditorProps {
  persona: Persona | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (id: string, data: PersonaUpdate) => Promise<void>;
  isSubmitting?: boolean;
}

// ----------------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------------

export function PersonaEditor({
  persona,
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
}: PersonaEditorProps) {
  const [formData, setFormData] = useState<PersonaUpdate>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize form data when persona changes
  useEffect(() => {
    if (persona) {
      setFormData({
        name: persona.name,
        system_prompt: persona.system_prompt,
        voice_notes: persona.voice_notes || '',
        memory_strategy: persona.memory_strategy,
        max_context_tokens: persona.max_context_tokens,
        memory_retrieval_count: persona.memory_retrieval_count,
        is_active: persona.is_active,
      });
      setHasChanges(false);
    }
  }, [persona]);

  // Track changes
  const updateFormData = (updates: Partial<PersonaUpdate>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  // Validation
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!formData.system_prompt?.trim()) {
      newErrors.system_prompt = 'System prompt is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit
  const handleSubmit = async () => {
    if (!validate() || !persona) return;
    await onSubmit(persona.id, formData);
  };

  // Handle dialog close with unsaved changes
  const handleOpenChange = (open: boolean) => {
    if (!open && hasChanges) {
      if (!confirm('You have unsaved changes. Are you sure you want to close?')) {
        return;
      }
    }
    onOpenChange(open);
  };

  if (!persona) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Persona</DialogTitle>
          <DialogDescription>
            Update the persona settings and configuration
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="memory">Memory</TabsTrigger>
          </TabsList>

          {/* General settings */}
          <TabsContent value="general" className="space-y-4 mt-4">
            <div className="flex items-center justify-between py-2 px-4 rounded-lg bg-muted/50">
              <div>
                <Label>Active Status</Label>
                <p className="text-sm text-muted-foreground">
                  Enable or disable this persona
                </p>
              </div>
              <Switch
                checked={formData.is_active ?? true}
                onCheckedChange={(checked) => updateFormData({ is_active: checked })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                value={formData.name || ''}
                onChange={(e) => updateFormData({ name: e.target.value })}
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-system_prompt">System Prompt *</Label>
              <Textarea
                id="edit-system_prompt"
                value={formData.system_prompt || ''}
                onChange={(e) => updateFormData({ system_prompt: e.target.value })}
                className={cn('min-h-[150px]', errors.system_prompt ? 'border-destructive' : '')}
              />
              {errors.system_prompt && (
                <p className="text-xs text-destructive">{errors.system_prompt}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-voice_notes">Voice Notes</Label>
              <Textarea
                id="edit-voice_notes"
                placeholder="Additional notes about speaking style..."
                value={formData.voice_notes || ''}
                onChange={(e) => updateFormData({ voice_notes: e.target.value })}
                className="min-h-[80px]"
              />
            </div>

            <div className="space-y-2">
              <Label>Persona Type</Label>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="font-medium">
                  {PERSONA_ENGINE.PERSONA_TYPES.find((t) => t.value === persona.type)?.label}
                </p>
                <p className="text-sm text-muted-foreground">
                  Persona type cannot be changed after creation
                </p>
              </div>
            </div>
          </TabsContent>

          {/* Memory settings */}
          <TabsContent value="memory" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Memory Strategy</Label>
              <Select
                value={formData.memory_strategy}
                onValueChange={(value) => updateFormData({ memory_strategy: value as MemoryStrategy })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select strategy" />
                </SelectTrigger>
                <SelectContent>
                  {PERSONA_ENGINE.MEMORY_STRATEGIES.map((strategy) => (
                    <SelectItem key={strategy.value} value={strategy.value}>
                      <div>
                        <div className="font-medium">{strategy.label}</div>
                        <div className="text-xs text-muted-foreground">
                          {strategy.description}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-max_context_tokens">Max Context Tokens</Label>
                <Input
                  id="edit-max_context_tokens"
                  type="number"
                  value={formData.max_context_tokens || ''}
                  onChange={(e) =>
                    updateFormData({ max_context_tokens: parseInt(e.target.value) || undefined })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Maximum tokens for context window
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-memory_retrieval_count">Retrieval Count</Label>
                <Input
                  id="edit-memory_retrieval_count"
                  type="number"
                  value={formData.memory_retrieval_count || ''}
                  onChange={(e) =>
                    updateFormData({
                      memory_retrieval_count: parseInt(e.target.value) || undefined,
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Number of memories to retrieve
                </p>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-muted/30 border">
              <h4 className="font-medium mb-2">Memory Strategy Tips</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>
                  <strong>Simple Facts:</strong> Best for companions and simple personas
                </li>
                <li>
                  <strong>RAG:</strong> Best for personas with extensive knowledge bases
                </li>
                <li>
                  <strong>Hybrid:</strong> Combines both for maximum flexibility
                </li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isSubmitting}>
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !hasChanges}>
            {isSubmitting ? (
              <>
                <span className="animate-spin mr-2">...</span>
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
