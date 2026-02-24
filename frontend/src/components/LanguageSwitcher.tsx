// LanguageSwitcher

import { useTranslation, LOCALE_LABELS, type Locale } from '@/i18n';
import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const LOCALES: Locale[] = ['en', 'pl'];

interface LanguageSwitcherProps {
  variant?: 'default' | 'minimal';
}

export default function LanguageSwitcher({ variant = 'default' }: LanguageSwitcherProps) {
  const { locale, setLocale } = useTranslation();

  if (variant === 'minimal') {
    return (
      <button
        type="button"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        onClick={() => setLocale(locale === 'en' ? 'pl' : 'en')}
      >
        <Globe className="h-4 w-4" />
        {LOCALE_LABELS[locale]}
      </button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1 px-2 text-muted-foreground">
          <Globe className="h-4 w-4" />
          {LOCALE_LABELS[locale]}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[80px]">
        {LOCALES.map((loc) => (
          <DropdownMenuItem
            key={loc}
            onClick={() => setLocale(loc)}
            className={loc === locale ? 'font-semibold' : ''}
          >
            {LOCALE_LABELS[loc]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
