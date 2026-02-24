//Surveys API (Editor)
 
import client from './client';
import type {
  Survey,
  CreateSurveyPayload,
  UpdateSurveyPayload,
  CreateQuestionPayload,
  UpdateQuestionPayload,
  Question,
  AddCollaboratorPayload,
  SurveyResults,
  SurveyResponse,
} from '@/types';

export const surveysApi = {
  list: async (): Promise<Survey[]> => {
    const res = await client.get('/surveys');
    return res.data;
  },

  get: async (id: number): Promise<Survey> => {
    const res = await client.get(`/surveys/${id}`);
    return res.data;
  },

  create: async (data: CreateSurveyPayload): Promise<Survey> => {
    const res = await client.post('/surveys', data);
    return res.data;
  },

  update: async (id: number, data: UpdateSurveyPayload): Promise<Survey> => {
    const res = await client.put(`/surveys/${id}`, data);
    return res.data;
  },

  delete: async (id: number): Promise<void> => {
    await client.delete(`/surveys/${id}`);
  },

  publish: async (id: number): Promise<Survey> => {
    const res = await client.post(`/surveys/${id}/publish`);
    return res.data;
  },

  toggleFavorite: async (id: number): Promise<{ is_favorited: boolean }> => {
    const res = await client.post(`/surveys/${id}/favorite`);
    return res.data;
  },

  duplicate: async (id: number): Promise<Survey> => {
    const res = await client.post(`/surveys/${id}/duplicate`);
    return res.data;
  },

  // Questions
  addQuestion: async (surveyId: number, data: CreateQuestionPayload): Promise<Question> => {
    const res = await client.post(`/surveys/${surveyId}/questions`, data);
    return res.data;
  },

  updateQuestion: async (questionId: number, data: UpdateQuestionPayload): Promise<Question> => {
    const res = await client.put(`/questions/${questionId}`, data);
    return res.data;
  },

  deleteQuestion: async (questionId: number): Promise<void> => {
    await client.delete(`/questions/${questionId}`);
  },

  reorderQuestions: async (surveyId: number, order: number[]): Promise<Question[]> => {
    const res = await client.post(`/surveys/${surveyId}/questions/reorder`, { order });
    return res.data;
  },

  // Collaborators
  addCollaborator: async (surveyId: number, data: AddCollaboratorPayload): Promise<Survey> => {
    const res = await client.post(`/surveys/${surveyId}/collaborators`, data);
    return res.data;
  },

  removeCollaborator: async (surveyId: number, userId: number): Promise<void> => {
    await client.delete(`/surveys/${surveyId}/collaborators/${userId}`);
  },

  // Results
  getResults: async (surveyId: number): Promise<SurveyResults> => {
    const res = await client.get(`/surveys/${surveyId}/results`);
    return res.data;
  },

  getResponses: async (surveyId: number): Promise<SurveyResponse[]> => {
    const res = await client.get(`/surveys/${surveyId}/responses`);
    return res.data;
  },

  deleteResponse: async (surveyId: number, responseId: number): Promise<void> => {
    await client.delete(`/surveys/${surveyId}/responses/${responseId}`);
  },

  exportCsv: async (surveyId: number): Promise<Blob> => {
    const res = await client.get(`/surveys/${surveyId}/export?format=csv`, {
      responseType: 'blob',
    });
    return res.data;
  },

  exportExcel: async (surveyId: number): Promise<Blob> => {
    const res = await client.get(`/surveys/${surveyId}/export?format=excel`, {
      responseType: 'blob',
    });
    return res.data;
  },
};
