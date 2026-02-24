// Shared TypeScript interfaces and types (Mirrors the backend API)

export interface User {
  id: number;
  name: string;
  email: string;
  is_admin?: boolean;
  created_at: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export type QuestionType = 'SHORT_TEXT' | 'LONG_TEXT' | 'SINGLE_CHOICE' | 'MULTI_CHOICE' | 'NUMBER' | 'FILE' | 'RANKING' | 'CODE';
export type SurveyStatus = 'draft' | 'published';
export type CollaboratorRole = 'editor' | 'viewer';

export interface Question {
  id: number;
  survey_id: number;
  type: QuestionType;
  text: string;
  description: string | null;
  banner_image: string | null;
  options: string[] | null;
  required: boolean;
  correct_answer: string | null;
  position: number;
  created_at?: string;
}

export interface Collaborator {
  id: number;
  name: string;
  email: string;
  pivot: {
    role: CollaboratorRole;
  };
}

export interface Survey {
  id: number;
  owner_id: number;
  title: string;
  description: string | null;
  slug: string | null;
  status: SurveyStatus;
  is_public: boolean;
  is_accepting_responses: boolean;
  is_favorited?: boolean;
  user_role?: 'owner' | 'editor' | 'viewer';
  opens_at: string | null;
  closes_at: string | null;
  require_name: boolean;
  require_email: boolean;
  access_password: string | null;
  time_limit: number | null;
  theme_color: string | null;
  banner_image: string | null;
  show_responses_after_submit: boolean;
  show_correct_after_submit: boolean;
  one_question_per_page: boolean;
  prevent_going_back: boolean;
  created_at: string;
  updated_at: string;
  questions?: Question[];
  collaborators?: Collaborator[];
  owner?: Pick<User, 'id' | 'name' | 'email'>;
}

export interface AnswerInput {
  question_id: number;
  value: string | string[];
}

export interface SubmitResponsePayload {
  answers: AnswerInput[];
  password?: string;
  respondent_name?: string;
  respondent_email?: string;
}

export interface OptionResult {
  label: string;
  count: number;
  percentage: number;
}

export interface QuestionResult {
  question_id: number;
  question_text: string;
  type: QuestionType;
  total_answers: number;
  options?: OptionResult[];
  text_answers?: string[];
}

export interface SurveyResults {
  survey_id: number;
  survey_title: string;
  total_responses: number;
  questions: QuestionResult[];
}

export interface ResponseAnswer {
  question_id: number;
  question_text: string;
  type: QuestionType;
  value: string | string[] | null;
}

export interface SurveyResponse {
  id: number;
  respondent_name: string | null;
  respondent_email: string | null;
  submitted_at: string;
  answers: ResponseAnswer[];
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}

export interface CreateSurveyPayload {
  title: string;
  description?: string;
}

export interface UpdateSurveyPayload {
  title?: string;
  description?: string;
  is_public?: boolean;
  is_accepting_responses?: boolean;
  opens_at?: string | null;
  closes_at?: string | null;
  require_name?: boolean;
  require_email?: boolean;
  access_password?: string | null;
  time_limit?: number | null;
  theme_color?: string | null;
  banner_image?: string | null;
  show_responses_after_submit?: boolean;
  show_correct_after_submit?: boolean;
  one_question_per_page?: boolean;
  prevent_going_back?: boolean;
}

export interface CreateQuestionPayload {
  type: QuestionType;
  text: string;
  description?: string | null;
  banner_image?: string | null;
  options?: string[];
  required?: boolean;
  correct_answer?: string | null;
  position?: number;
}

export interface UpdateQuestionPayload {
  type?: QuestionType;
  text?: string;
  description?: string | null;
  banner_image?: string | null;
  options?: string[];
  required?: boolean;
  correct_answer?: string | null;
  position?: number;
}

export interface AddCollaboratorPayload {
  email: string;
  role: CollaboratorRole;
}
