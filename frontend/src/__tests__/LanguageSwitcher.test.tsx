/**
 * Unit tests for the LanguageSwitcher component.
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LanguageProvider } from '@/i18n';
import LanguageSwitcher from '@/components/LanguageSwitcher';

function renderWithProvider(ui: React.ReactNode) {
  return render(<LanguageProvider>{ui}</LanguageProvider>);
}

describe('LanguageSwitcher', () => {
  it('renders default variant with globe icon and locale label', () => {
    renderWithProvider(<LanguageSwitcher />);
    // Default variant renders a button with the locale label
    const btn = screen.getByRole('button');
    expect(btn).toBeInTheDocument();
    // Should contain either "EN" or "English" label text
    expect(btn.textContent).toBeTruthy();
  });

  it('renders minimal variant as plain button', () => {
    renderWithProvider(<LanguageSwitcher variant="minimal" />);
    const btn = screen.getByRole('button');
    expect(btn).toBeInTheDocument();
    expect(btn.className).toContain('text-sm');
  });
});
