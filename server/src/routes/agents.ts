import { Router, Request, Response } from 'express';
import { agentStore, voiceStore } from '../store.js';
import type { CreateAgentBody, UpdateAgentBody } from '../types/voice.js';

const router = Router();

// GET /api/agents
router.get('/', (_req: Request, res: Response) => {
  res.json(agentStore.list());
});

// GET /api/agents/:id
router.get('/:id', (req: Request, res: Response) => {
  const agent = agentStore.get(req.params.id);
  if (!agent) return res.status(404).json({ error: 'Agent not found.' });
  return res.json(agent);
});

// POST /api/agents
router.post('/', (req: Request, res: Response) => {
  const { name, description = '', voiceId, language = 'en' } = req.body as CreateAgentBody;

  if (!name?.trim()) {
    return res.status(400).json({ error: 'Agent name is required.' });
  }

  if (voiceId && !voiceStore.get(voiceId)) {
    return res.status(400).json({ error: 'Invalid voiceId – voice does not exist.' });
  }

  const agent = agentStore.create({
    name: name.trim(),
    description: description.trim(),
    voiceId,
    language,
  });

  return res.status(201).json(agent);
});

// PATCH /api/agents/:id
router.patch('/:id', (req: Request, res: Response) => {
  const agent = agentStore.get(req.params.id);
  if (!agent) return res.status(404).json({ error: 'Agent not found.' });

  const { name, description, voiceId, language } = req.body as UpdateAgentBody;

  if (name !== undefined && !name.trim()) {
    return res.status(400).json({ error: 'Agent name cannot be empty.' });
  }

  if (voiceId !== undefined && voiceId !== null && !voiceStore.get(voiceId)) {
    return res.status(400).json({ error: 'Invalid voiceId – voice does not exist.' });
  }

  const updated = agentStore.update(req.params.id, {
    ...(name !== undefined && { name: name.trim() }),
    ...(description !== undefined && { description: description.trim() }),
    ...(voiceId !== undefined && { voiceId: voiceId ?? undefined }),
    ...(language !== undefined && { language }),
  });

  return res.json(updated);
});

// DELETE /api/agents/:id
router.delete('/:id', (req: Request, res: Response) => {
  const agent = agentStore.get(req.params.id);
  if (!agent) return res.status(404).json({ error: 'Agent not found.' });
  agentStore.delete(req.params.id);
  return res.status(204).send();
});

export default router;
