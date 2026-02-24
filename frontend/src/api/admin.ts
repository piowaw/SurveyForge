// Admin API
import client from './client';

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  is_admin: boolean;
  owned_surveys_count: number;
  created_at: string;
}

export interface AdminSurvey {
  id: number;
  title: string;
  slug: string;
  status: string;
  owner_id: number;
  owner: { id: number; name: string; email: string } | null;
  questions_count: number;
  responses_count: number;
  created_at: string;
  updated_at: string;
}

export const adminApi = {
  getUsers: async (): Promise<AdminUser[]> => {
    const res = await client.get('/admin/users');
    return res.data;
  },

  updateUser: async (
    id: number,
    data: { name?: string; email?: string; is_admin?: boolean; password?: string },
  ) => {
    const res = await client.put(`/admin/users/${id}`, data);
    return res.data;
  },

  deleteUser: async (id: number): Promise<{ message: string }> => {
    const res = await client.delete(`/admin/users/${id}`);
    return res.data;
  },

  getSurveys: async (): Promise<AdminSurvey[]> => {
    const res = await client.get('/admin/surveys');
    return res.data;
  },

  deleteSurvey: async (id: number): Promise<{ message: string }> => {
    const res = await client.delete(`/admin/surveys/${id}`);
    return res.data;
  },
};
