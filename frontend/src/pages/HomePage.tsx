// Landing page

import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/i18n';
import { useAuth } from '@/features/auth/AuthContext';
import usePageTitle from '@/hooks/usePageTitle';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import {
  ClipboardList,
  BarChart3,
  Users,
  Globe,
  Timer,
  Lock,
  Code,
  GripVertical,
  FileDown,
  ShieldCheck,
  Palette,
  ArrowRight,
} from 'lucide-react';

export default function HomePage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { token } = useAuth();
  usePageTitle(t.home.pageTitle);

  const features = [
    { icon: ClipboardList, title: t.home.features.questionTypes, desc: t.home.features.questionTypesDesc },
    { icon: BarChart3, title: t.home.features.analytics, desc: t.home.features.analyticsDesc },
    { icon: Users, title: t.home.features.collaboration, desc: t.home.features.collaborationDesc },
    { icon: Globe, title: t.home.features.publicSharing, desc: t.home.features.publicSharingDesc },
    { icon: Timer, title: t.home.features.timedSurveys, desc: t.home.features.timedSurveysDesc },
    { icon: Lock, title: t.home.features.passwordProtection, desc: t.home.features.passwordProtectionDesc },
    { icon: Code, title: t.home.features.codeQuestions, desc: t.home.features.codeQuestionsDesc },
    { icon: GripVertical, title: t.home.features.dragAndDrop, desc: t.home.features.dragAndDropDesc },
    { icon: FileDown, title: t.home.features.export, desc: t.home.features.exportDesc },
    { icon: ShieldCheck, title: t.home.features.adminPanel, desc: t.home.features.adminPanelDesc },
    { icon: Palette, title: t.home.features.theming, desc: t.home.features.themingDesc },
    { icon: ArrowRight, title: t.home.features.displayModes, desc: t.home.features.displayModesDesc },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <span className="text-xl font-bold tracking-tight">
          <span className="text-primary">Survey</span>Forge
        </span>
        <div className="flex items-center gap-3">
          <LanguageSwitcher variant="minimal" />
          {token ? (
            <Button onClick={() => navigate('/dashboard')} size="sm">
              {t.home.goToDashboard}
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
                {t.home.signIn}
              </Button>
              <Button size="sm" onClick={() => navigate('/register')}>
                {t.home.signUp}
              </Button>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 pt-16 pb-20 max-w-4xl mx-auto text-center">
        <Badge variant="secondary" className="mb-4 text-sm px-3 py-1">
          {t.home.badge}
        </Badge>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight mb-4">
          {t.home.heroTitle}
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
          {t.home.heroSubtitle}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {token ? (
            <Button size="lg" onClick={() => navigate('/dashboard')}>
              {t.home.goToDashboard}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <>
              <Button size="lg" onClick={() => navigate('/register')}>
                {t.home.getStarted}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/login')}>
                {t.home.signIn}
              </Button>
            </>
          )}
        </div>
      </section>

      {/* Features grid */}
      <section className="px-6 pb-20 max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-2">{t.home.featuresTitle}</h2>
        <p className="text-muted-foreground text-center mb-10 max-w-xl mx-auto">
          {t.home.featuresSubtitle}
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <Card key={f.title} className="hover:shadow-md transition-shadow">
              <CardContent className="flex gap-4 p-5">
                <div className="shrink-0 mt-0.5 rounded-lg bg-primary/10 p-2.5 h-fit">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Tech stack */}
      <section className="px-6 pb-20 max-w-4xl mx-auto text-center">
        <h2 className="text-2xl font-bold mb-2">{t.home.techTitle}</h2>
        <p className="text-muted-foreground mb-8">{t.home.techSubtitle}</p>
        <div className="flex flex-wrap gap-2 justify-center">
          {[
            'React 19', 'TypeScript', 'Vite', 'Tailwind CSS',
            'shadcn/ui', 'Laravel 12', 'PHP 8.4', 'PostgreSQL',
            'Docker', 'Sanctum', 'TanStack Query', 'Zod',
          ].map((tech) => (
            <Badge key={tech} variant="outline" className="text-sm px-3 py-1">
              {tech}
            </Badge>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-6 px-6 text-center text-sm text-muted-foreground">
        {t.common.poweredBy}
      </footer>
    </div>
  );
}
