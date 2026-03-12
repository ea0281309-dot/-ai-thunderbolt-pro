/// <reference types="vite/client" />
import axios from 'axios';
import type { Voice, CreateVoicePayload, Agent } from '@/types/voice';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

const api = axios.create({
  baseURL: `${BASE_URL}/api`,
});

// Voices API
export const voicesApi = {
  list: () => api.get<Voice[]>('/voices').then(r => r.data),

  get: (id: string) => api.get<Voice>(`/voices/${id}`).then(r => r.data),

  create: (payload: CreateVoicePayload) => {
    const formData = new FormData();
    formData.append('name', payload.name);
    formData.append('description', payload.description);
    formData.append('gender', payload.gender);
    formData.append('language', payload.language);
    formData.append('audio', payload.audioFile);
    return api.post<Voice>('/voices', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data);
  },

  update: (id: string, data: Partial<Omit<Voice, 'id' | 'createdAt'>>) =>
    api.patch<Voice>(`/voices/${id}`, data).then(r => r.data),

  delete: (id: string) => api.delete(`/voices/${id}`),

  preview: (id: string, text: string) =>
    api.post<{ audioUrl: string }>(`/voices/${id}/preview`, { text }).then(r => r.data),
};

// Agents API
export const agentsApi = {
  list: () => api.get<Agent[]>('/agents').then(r => r.data),

  create: (data: Omit<Agent, 'id' | 'createdAt'>) =>
    api.post<Agent>('/agents', data).then(r => r.data),

  update: (id: string, data: Partial<Omit<Agent, 'id' | 'createdAt'>>) =>
    api.patch<Agent>(`/agents/${id}`, data).then(r => r.data),

  delete: (id: string) => api.delete(`/agents/${id}`),
};
