// Auth API

import client from './client';
import type { AuthResponse, User } from '@/types';

export const authApi = {
  register: async (data: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
  }): Promise<AuthResponse> => {
    const res = await client.post('/auth/register', data);
    return res.data;
  },

  login: async (data: { email: string; password: string }): Promise<AuthResponse> => {
    const res = await client.post('/auth/login', data);
    return res.data;
  },

  logout: async (): Promise<void> => {
    await client.post('/auth/logout');
  },

  me: async (): Promise<User> => {
    const res = await client.get('/me');
    return res.data;
  },

  updateProfile: async (data: { name?: string; email?: string }): Promise<User> => {
    const res = await client.put('/me', data);
    return res.data;
  },

  changePassword: async (data: {
    current_password: string;
    password: string;
    password_confirmation: string;
  }): Promise<{ message: string }> => {
    const res = await client.put('/me/password', data);
    return res.data;
  },

  deleteAccount: async (data: { password: string }): Promise<{ message: string }> => {
    const res = await client.delete('/me', { data });
    return res.data;
  },
};
