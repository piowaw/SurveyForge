// 404 page

import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/i18n';
import usePageTitle from '@/hooks/usePageTitle';
import { Button } from '@/components/ui/button';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function NotFoundPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  usePageTitle(t.pageTitles.notFound);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50/40 px-4 text-center">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
      <h2 className="text-xl font-semibold mb-2">{t.notFound.title}</h2>
      <p className="text-muted-foreground mb-6 max-w-md">{t.notFound.message}</p>
      <Button onClick={() => navigate('/dashboard')}>{t.notFound.goHome}</Button>
    </div>
  );
}
