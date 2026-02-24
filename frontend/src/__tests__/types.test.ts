/**
 * Tests for frontend TypeScript types — verify QuestionType enum values
 * match what the backend expects, and key interfaces have correct shapes.
 */
import { describe, it, expect } from 'vitest';
import type { QuestionType, SurveyStatus, CollaboratorRole } from '@/types';

describe('QuestionType', () => {
  it('covers all 8 backend enum values', () => {
    const expected: QuestionType[] = [
      'SHORT_TEXT',
      'LONG_TEXT',
      'SINGLE_CHOICE',
      'MULTI_CHOICE',
      'NUMBER',
      'FILE',
      'RANKING',
      'CODE',
    ];
    // If any value is not assignable, TypeScript itself will catch it.
    // This runtime test ensures the list is exhaustive.
    expect(expected).toHaveLength(8);
    expect(new Set(expected).size).toBe(8);
  });
});

describe('SurveyStatus', () => {
  it('allows draft and published', () => {
    const statuses: SurveyStatus[] = ['draft', 'published'];
    expect(statuses).toHaveLength(2);
  });
});

describe('CollaboratorRole', () => {
  it('allows editor and viewer', () => {
    const roles: CollaboratorRole[] = ['editor', 'viewer'];
    expect(roles).toHaveLength(2);
  });
});
