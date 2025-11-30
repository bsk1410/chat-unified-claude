// ============================================================================
// Personas Page
// Persona management interface
// ============================================================================

import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { DashboardLayout } from '@/components/layout';
import { PersonaGrid, PersonaCreator, PersonaEditor } from '@/components/persona';
import { DebugPanel, DebugToggle } from '@/components/debug';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/hooks';
import { personaApi } from '@/lib/api-client';
import { debugLog } from '@/stores/debugStore';
import { ROUTES } from '@/lib/constants';
import type { Persona, PersonaCreate, PersonaUpdate } from '@/types/persona';

// ----------------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------------

export function PersonasPage() {
  const navigate = useNavigate();
  const { accessToken } = useAuth();

  // State
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dialog state
  const [creatorOpen, setCreatorOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);

  // Conversation counts (would come from API in real app)
  const [conversationCounts] = useState<Record<string, number>>({});

  // Load personas
  const loadPersonas = useCallback(async () => {
    if (!accessToken) return;

    try {
      debugLog.info('Personas', 'Loading personas');
      setIsLoading(true);
      const response = await personaApi.list(accessToken);
      setPersonas(response.data);
      debugLog.info('Personas', 'Loaded personas', { count: response.data.length });
    } catch (err) {
      debugLog.error('Personas', 'Failed to load personas', err);
      toast.error('Failed to load personas');
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    loadPersonas();
  }, [loadPersonas]);

  // Create persona
  const handleCreate = useCallback(async (data: PersonaCreate) => {
    if (!accessToken) return;

    try {
      debugLog.info('Personas', 'Creating persona', { name: data.name });
      setIsSubmitting(true);
      const response = await personaApi.create(accessToken, data);
      setPersonas((prev) => [...prev, response.data]);
      setCreatorOpen(false);
      toast.success(`Created ${response.data.name}`);
      debugLog.info('Personas', 'Created persona', { id: response.data.id });
    } catch (err) {
      debugLog.error('Personas', 'Failed to create persona', err);
      toast.error('Failed to create persona');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, [accessToken]);

  // Update persona
  const handleUpdate = useCallback(async (id: string, data: PersonaUpdate) => {
    if (!accessToken) return;

    try {
      debugLog.info('Personas', 'Updating persona', { id });
      setIsSubmitting(true);
      const response = await personaApi.update(accessToken, id, data);
      setPersonas((prev) =>
        prev.map((p) => (p.id === id ? response.data : p))
      );
      setEditorOpen(false);
      setSelectedPersona(null);
      toast.success('Persona updated');
      debugLog.info('Personas', 'Updated persona', { id });
    } catch (err) {
      debugLog.error('Personas', 'Failed to update persona', err);
      toast.error('Failed to update persona');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, [accessToken]);

  // Delete persona
  const handleDelete = useCallback(async () => {
    if (!accessToken || !selectedPersona) return;

    try {
      debugLog.info('Personas', 'Deleting persona', { id: selectedPersona.id });
      setIsSubmitting(true);
      await personaApi.delete(accessToken, selectedPersona.id);
      setPersonas((prev) => prev.filter((p) => p.id !== selectedPersona.id));
      setDeleteDialogOpen(false);
      setSelectedPersona(null);
      toast.success(`Deleted ${selectedPersona.name}`);
      debugLog.info('Personas', 'Deleted persona', { id: selectedPersona.id });
    } catch (err) {
      debugLog.error('Personas', 'Failed to delete persona', err);
      toast.error('Failed to delete persona');
    } finally {
      setIsSubmitting(false);
    }
  }, [accessToken, selectedPersona]);

  // Navigate to chat with persona
  const handleSelectPersona = useCallback((persona: Persona) => {
    debugLog.info('Personas', 'Selected persona for chat', { id: persona.id });
    navigate(ROUTES.CHAT, { state: { personaId: persona.id } });
  }, [navigate]);

  // Open edit dialog
  const handleEditPersona = useCallback((persona: Persona) => {
    setSelectedPersona(persona);
    setEditorOpen(true);
  }, []);

  // Open delete dialog
  const handleDeleteClick = useCallback((persona: Persona) => {
    setSelectedPersona(persona);
    setDeleteDialogOpen(true);
  }, []);

  // Navigate to memory page
  const handleViewMemory = useCallback((persona: Persona) => {
    navigate(ROUTES.PERSONA_MEMORY.replace(':id', persona.id));
  }, [navigate]);

  return (
    <>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold">Personas</h1>
            <p className="text-muted-foreground mt-1">
              Create and manage your AI personas for different use cases
            </p>
          </div>

          {/* Persona grid */}
          <PersonaGrid
            personas={personas}
            conversationCounts={conversationCounts}
            isLoading={isLoading}
            onSelectPersona={handleSelectPersona}
            onCreatePersona={() => setCreatorOpen(true)}
            onEditPersona={handleEditPersona}
            onDeletePersona={handleDeleteClick}
            onViewMemory={handleViewMemory}
          />
        </div>
      </DashboardLayout>

      {/* Creator dialog */}
      <PersonaCreator
        open={creatorOpen}
        onOpenChange={setCreatorOpen}
        onSubmit={handleCreate}
        isSubmitting={isSubmitting}
      />

      {/* Editor dialog */}
      <PersonaEditor
        persona={selectedPersona}
        open={editorOpen}
        onOpenChange={setEditorOpen}
        onSubmit={handleUpdate}
        isSubmitting={isSubmitting}
      />

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Persona</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedPersona?.name}"? This action
              cannot be undone and will delete all associated conversations and
              memories.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Debug components */}
      <DebugToggle />
      <DebugPanel />
    </>
  );
}

export default PersonasPage;
