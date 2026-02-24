// Shared layout for Login and Register pages

import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '@/i18n';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface AuthLayoutProps {
  subtitle: string;
  children: ReactNode;
  footerText: string;
  footerLinkText: string;
  footerLinkTo: string;
}

export default function AuthLayout({ subtitle, children, footerText, footerLinkText, footerLinkTo }: AuthLayoutProps) {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50/40 px-4">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">{t.common.appName}</h1>
          <p className="text-muted-foreground mt-2">{subtitle}</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            {children}

            <Separator className="my-6" />

            <p className="text-center text-sm text-muted-foreground">
              {footerText}{' '}
              <Link to={footerLinkTo} className="text-primary font-medium hover:underline">
                {footerLinkText}
              </Link>
            </p>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          {t.common.protectedByRecaptcha}{' '}
          <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="underline">
            {t.common.privacy}
          </a>
          {' & '}
          <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" className="underline">
            {t.common.terms}
          </a>
        </p>
      </div>
    </div>
  );
}
