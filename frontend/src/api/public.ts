// Submitting surveys API

import client from './client';
import type { Survey, SubmitResponsePayload } from '@/types';

export const publicApi = {
  getSurvey: async (slug: string): Promise<Survey> => {
    const res = await client.get(`/public/surveys/${slug}`);
    return res.data;
  },

  submitResponse: async (
    slug: string,
    data: SubmitResponsePayload,
  ): Promise<{ message: string; response_id: number }> => {
    const res = await client.post(`/public/surveys/${slug}/responses`, data);
    return res.data;
  },
};
