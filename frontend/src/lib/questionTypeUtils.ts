// Shared utilities for question types

import type { QuestionType } from '@/types';
import type { TranslationKeys } from '@/i18n';

// All question type values
export const QUESTION_TYPES: QuestionType[] = [
  'SHORT_TEXT',
  'LONG_TEXT',
  'SINGLE_CHOICE',
  'MULTI_CHOICE',
  'NUMBER',
  'FILE',
  'RANKING',
  'CODE',
];

// Types that require the user to define a list of options
const OPTION_TYPES: ReadonlySet<string> = new Set<string>([
  'SINGLE_CHOICE',
  'MULTI_CHOICE',
  'RANKING',
]);

// Whether a question type requires predefined options
export function needsOptions(type: QuestionType): boolean {
  return OPTION_TYPES.has(type);
}

// Translatable label for each question type.
// Uses the active i18n translations object.
export function getTypeLabel(type: QuestionType, t: TranslationKeys): string {
  const map: Record<QuestionType, string> = {
    SHORT_TEXT: t.survey.shortAnswer,
    LONG_TEXT: t.survey.longText,
    SINGLE_CHOICE: t.survey.singleChoice,
    MULTI_CHOICE: t.survey.multipleChoice,
    NUMBER: t.survey.number,
    FILE: t.survey.fileUpload,
    RANKING: t.survey.ranking,
    CODE: t.survey.code,
  };
  return map[type] ?? type.replace('_', ' ');
}

// Get a mapping of all question types to their labels
export function getTypeLabels(t: TranslationKeys): Record<QuestionType, string> {
  return {
    SHORT_TEXT: t.survey.shortAnswer,
    LONG_TEXT: t.survey.longText,
    SINGLE_CHOICE: t.survey.singleChoice,
    MULTI_CHOICE: t.survey.multipleChoice,
    NUMBER: t.survey.number,
    FILE: t.survey.fileUpload,
    RANKING: t.survey.ranking,
    CODE: t.survey.code,
  };
}

// Tailwind colour classes for type badges
const TYPE_COLORS: Record<QuestionType, string> = {
  SHORT_TEXT: 'bg-blue-100 text-blue-700',
  LONG_TEXT: 'bg-indigo-100 text-indigo-700',
  NUMBER: 'bg-emerald-100 text-emerald-700',
  SINGLE_CHOICE: 'bg-purple-100 text-purple-700',
  MULTI_CHOICE: 'bg-pink-100 text-pink-700',
  RANKING: 'bg-amber-100 text-amber-700',
  CODE: 'bg-gray-100 text-gray-700',
  FILE: 'bg-orange-100 text-orange-700',
};

// Get the Tailwind badge colour classes for a given question type
export function getTypeBadgeColor(type: QuestionType): string {
  return TYPE_COLORS[type] ?? 'bg-muted text-muted-foreground';
}

// Render a coloured badge 
export function typeBadgeClasses(type: QuestionType): string {
  return `inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getTypeBadgeColor(type)}`;
}
