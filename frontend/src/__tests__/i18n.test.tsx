/**
 * Unit tests for the i18n system — language context, translation keys, locale switching.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LanguageProvider, useTranslation } from '@/i18n';
import en from '@/i18n/en';
import pl from '@/i18n/pl';

beforeEach(() => {
  localStorage.clear();
});

/** Helper component that displays current locale and translation text */
function TestConsumer() {
  const { locale, setLocale, t } = useTranslation();
  return (
    <div>
      <span data-testid="locale">{locale}</span>
      <span data-testid="app-name">{t.common.appName}</span>
      <button onClick={() => setLocale('pl')}>Switch PL</button>
      <button onClick={() => setLocale('en')}>Switch EN</button>
    </div>
  );
}

describe('i18n / LanguageContext', () => {
  it('defaults to English', () => {
    render(
      <LanguageProvider>
        <TestConsumer />
      </LanguageProvider>,
    );
    expect(screen.getByTestId('locale').textContent).toBe('en');
    expect(screen.getByTestId('app-name').textContent).toBe(en.common.appName);
  });

  it('switches to Polish on setLocale("pl")', () => {
    render(
      <LanguageProvider>
        <TestConsumer />
      </LanguageProvider>,
    );
    fireEvent.click(screen.getByText('Switch PL'));
    expect(screen.getByTestId('locale').textContent).toBe('pl');
    expect(screen.getByTestId('app-name').textContent).toBe(pl.common.appName);
  });

  it('persists locale in localStorage', () => {
    render(
      <LanguageProvider>
        <TestConsumer />
      </LanguageProvider>,
    );
    fireEvent.click(screen.getByText('Switch PL'));
    expect(localStorage.getItem('surveyforge-locale')).toBe('pl');
  });

  it('restores locale from localStorage', () => {
    localStorage.setItem('surveyforge-locale', 'pl');
    render(
      <LanguageProvider>
        <TestConsumer />
      </LanguageProvider>,
    );
    expect(screen.getByTestId('locale').textContent).toBe('pl');
  });

  it('en and pl have identical key structures', () => {
    /** Recursively collect all leaf keys */
    function leafKeys(obj: Record<string, unknown>, prefix = ''): string[] {
      return Object.entries(obj).flatMap(([k, v]) => {
        const path = prefix ? `${prefix}.${k}` : k;
        return typeof v === 'object' && v !== null
          ? leafKeys(v as Record<string, unknown>, path)
          : [path];
      });
    }

    const enKeys = leafKeys(en).sort();
    const plKeys = leafKeys(pl).sort();
    expect(enKeys).toEqual(plKeys);
  });
});
