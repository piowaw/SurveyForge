// PublicSurveyPage

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { publicApi } from '@/api/public';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  CheckCircle2, KeyRound, User, Mail, Lock, Timer, AlertTriangle,
  ChevronLeft, ChevronRight, Paperclip,
  LogOut, Eraser, Play, ShieldCheck, ClipboardList,
} from 'lucide-react';
import ReCAPTCHA from 'react-google-recaptcha';
import type { Question, AnswerInput } from '@/types';
import { useTranslation } from '@/i18n';
import usePageTitle from '@/hooks/usePageTitle';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import QuestionInput from '@/components/QuestionInput';
import { RECAPTCHA_SITE_KEY } from '@/lib/constants';
import { THEME_STYLES } from '@/lib/themeStyles';

// Session helpers
interface SessionData {
  answers: Record<number, string | string[]>;
  respondentName: string;
  respondentEmail: string;
  passwordVerified: boolean;
  gateCompleted: boolean;
  currentPage: number;
  timerDeadline?: number;
}

const sKey = (slug: string) => `surveyforge-session-${slug}`;

function loadSession(slug: string): SessionData | null {
  try {
    const raw = localStorage.getItem(sKey(slug));
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveSession(slug: string, data: SessionData) {
  try { localStorage.setItem(sKey(slug), JSON.stringify(data)); } catch { /* quota */ }
}

function clearSession(slug: string) {
  localStorage.removeItem(sKey(slug));
}

export default function PublicSurveyPage() {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useTranslation();

  // Restore session
  const session = slug ? loadSession(slug) : null;

  // State
  const [answers, setAnswers] = useState<Record<number, string | string[]>>(session?.answers || {});
  const [submitted, setSubmitted] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordVerified, setPasswordVerified] = useState(session?.passwordVerified || false);
  const [passwordError, setPasswordError] = useState('');
  const [respondentName, setRespondentName] = useState(session?.respondentName || '');
  const [respondentEmail, setRespondentEmail] = useState(session?.respondentEmail || '');
  const [gateCompleted, setGateCompleted] = useState(session?.gateCompleted || false);
  const [timeExpired, setTimeExpired] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const timerStarted = useRef(false);
  const [currentPage, setCurrentPage] = useState(session?.currentPage || 0);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaRef = useRef<ReCAPTCHA>(null);

  // Fetch public survey data
  const { data: survey, isLoading, error } = useQuery({
    queryKey: ['public-survey', slug],
    queryFn: () => publicApi.getSurvey(slug!),
    enabled: !!slug,
  });

  usePageTitle(survey?.title || t.pageTitles.publicSurvey);

  const submitMutation = useMutation({
    mutationFn: (data: { answers: AnswerInput[]; password?: string; respondent_name?: string; respondent_email?: string }) =>
      publicApi.submitResponse(slug!, data),
    onSuccess: () => {
      setSubmitted(true);
      if (slug) clearSession(slug);
    },
  });

  // Persist session on relevant state changes
  const timerDeadlineRef = useRef<number | null>(session?.timerDeadline ?? null);

  useEffect(() => {
    if (!slug || submitted) return;
    saveSession(slug, {
      answers, respondentName, respondentEmail,
      passwordVerified, gateCompleted, currentPage,
      timerDeadline: timerDeadlineRef.current ?? undefined,
    });
  }, [answers, respondentName, respondentEmail, passwordVerified, gateCompleted, currentPage, slug, submitted]);

  // Timer
  const needsGate = !!survey && !!(survey.access_password || survey.require_name || survey.require_email);
  const surveyStarted = !needsGate || gateCompleted;
  const canStartTimer = !!survey && !submitted && surveyStarted;

  useEffect(() => {
    if (!canStartTimer || !survey?.time_limit || timerStarted.current) return;
    timerStarted.current = true;

    // Restore timer from session
    if (timerDeadlineRef.current) {
      const remaining = Math.max(0, Math.floor((timerDeadlineRef.current - Date.now()) / 1000));
      if (remaining <= 0) {
        setSecondsLeft(0);
        setTimeExpired(true);
        return;
      }
      setSecondsLeft(remaining);
      return;
    }

    let seconds = survey.time_limit * 60;
    // If closes_at is set, cap the timer to remaining open time
    if (survey.closes_at) {
      const remaining = Math.floor((new Date(survey.closes_at).getTime() - Date.now()) / 1000);
      if (remaining > 0) seconds = Math.min(seconds, remaining);
    }

    // Save absolute deadline
    timerDeadlineRef.current = Date.now() + seconds * 1000;
    if (slug) {
      saveSession(slug, {
        answers, respondentName, respondentEmail,
        passwordVerified, gateCompleted, currentPage,
        timerDeadline: timerDeadlineRef.current,
      });
    }
    setSecondsLeft(seconds);
  }, [canStartTimer, survey?.time_limit, survey?.closes_at]);

  useEffect(() => {
    if (secondsLeft === null || secondsLeft <= 0) return;
    const id = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(id);
          setTimeExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [secondsLeft !== null && secondsLeft > 0]);

  // Build answer payload from current state
  const buildPayload = useCallback(() => {
    if (!survey) return null;
    const answerPayload: AnswerInput[] = (survey.questions || []).map((q) => ({
      question_id: q.id,
      value: answers[q.id] || (['MULTI_CHOICE', 'RANKING'].includes(q.type) ? [] : ''),
    }));
    return {
      answers: answerPayload,
      ...(survey.access_password ? { password: passwordInput } : {}),
      ...(respondentName ? { respondent_name: respondentName } : {}),
      ...(respondentEmail ? { respondent_email: respondentEmail } : {}),
    };
  }, [survey, answers, passwordInput, respondentName, respondentEmail]);

  // Force-submit current answers (Used on time expiry)
  const forceSubmit = useCallback(() => {
    const payload = buildPayload();
    if (payload) submitMutation.mutate(payload);
  }, [buildPayload, submitMutation]);

  // Format seconds
  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  // Answer change handler
  const handleChange = (qid: number, value: string) =>
    setAnswers((prev) => ({ ...prev, [qid]: value }));

  // Multi-choice handler
  const handleMultiChoice = (qid: number, option: string, checked: boolean) => {
    setAnswers((prev) => {
      const current = (prev[qid] as string[]) || [];
      return { ...prev, [qid]: checked ? [...current, option] : current.filter((v) => v !== option) };
    });
  };

  // Submit handler
  const handleSubmit = () => {
    if (!survey) return;

    if (survey.require_name && !respondentName.trim()) { alert(t.publicSurvey.pleaseEnterName); return; }
    if (survey.require_email && !respondentEmail.trim()) { alert(t.publicSurvey.pleaseEnterEmail); return; }
    if (!captchaToken) { alert(t.publicSurvey.recaptchaRequired); return; }

    for (const q of survey.questions || []) {
      if (q.required) {
        const a = answers[q.id];
        if (!a || (Array.isArray(a) && a.length === 0)) { alert(t.publicSurvey.pleaseAnswer.replace('{question}', q.text)); return; }
      }
    }

    const payload = buildPayload();
    if (payload) submitMutation.mutate(payload);
  };

  // Entrance handler
  const handleGateSubmit = () => {
    if (!survey) return;
    if (survey.access_password && passwordInput !== survey.access_password) {
      setPasswordError(t.publicSurvey.incorrectPassword); return;
    }
    if (survey.require_name && !respondentName.trim()) {
      setPasswordError(t.publicSurvey.pleaseEnterName); return;
    }
    if (survey.require_email && !respondentEmail.trim()) {
      setPasswordError(t.publicSurvey.pleaseEnterEmail); return;
    }
    setPasswordVerified(true);
    setPasswordError('');
    setGateCompleted(true);
  };

  // Quit and clear
  const resetSurvey = () => {
    if (slug) clearSession(slug);
    window.location.reload();
  };

  const confirmAndReset = (msg: string) => {
    if (confirm(msg)) resetSurvey();
  };

  const handleClearAnswers = () => {
    if (confirm(t.publicSurvey.clearConfirm)) {
      setAnswers({});
      setCurrentPage(0);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <div className="absolute top-4 right-4"><LanguageSwitcher /></div>
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">{t.publicSurvey.loadingSurvey}</p>
        </div>
      </div>
    );
  }

  if (error || !survey) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <div className="absolute top-4 right-4"><LanguageSwitcher /></div>
        <div className="text-center">
          <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-lg font-medium">{t.publicSurvey.surveyNotFound}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {t.publicSurvey.surveyNotAvailable}
          </p>
        </div>
      </div>
    );
  }

  // Derived values
  const theme = THEME_STYLES[survey.theme_color || ''] || THEME_STYLES[''];
  const questions = survey.questions || [];
  const isOnePerPage = survey.one_question_per_page && questions.length > 1;
  const totalPages = isOnePerPage ? questions.length : 1;
  const canGoBack = isOnePerPage && currentPage > 0 && !survey.prevent_going_back;
  const isLastPage = !isOnePerPage || currentPage === totalPages - 1;

  const handleNext = () => {
    if (isOnePerPage) {
      const q = questions[currentPage];
      if (q?.required) {
        const a = answers[q.id];
        if (!a || (Array.isArray(a) && a.length === 0)) { alert(t.publicSurvey.pleaseAnswer.replace('{question}', q.text)); return; }
      }
      setCurrentPage((p) => Math.min(p + 1, totalPages - 1));
    }
  };

  const handleBack = () => {
    if (canGoBack) setCurrentPage((p) => Math.max(p - 1, 0));
  };

  // Submitted
  if (submitted) {
    const showLocked = survey.show_responses_after_submit;
    const showCorrect = survey.show_correct_after_submit;

    if (!showLocked) {
      return (
        <div className={`flex min-h-screen items-center justify-center ${theme.pageBg}`}>
          <Card className="max-w-md text-center overflow-hidden shadow-lg">
            <CardContent className="py-12">
              <CheckCircle2 className={`mx-auto mb-4 h-12 w-12 ${theme.accent || 'text-green-500'}`} />
              <h2 className="text-2xl font-bold">{t.publicSurvey.thankYou}</h2>
              <p className="mt-2 text-muted-foreground">
                {t.publicSurvey.responseSubmitted}
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Correctness helpers
    const isCorrect = (q: Question): boolean | null => {
      if (!showCorrect || !q.correct_answer) return null;
      const userAnswer = answers[q.id];
      if (['SINGLE_CHOICE', 'SHORT_TEXT', 'NUMBER', 'CODE', 'LONG_TEXT'].includes(q.type)) {
        return String(userAnswer || '').trim().toLowerCase() === q.correct_answer.trim().toLowerCase();
      }
      if (q.type === 'MULTI_CHOICE') {
        const userArr = Array.isArray(userAnswer) ? [...userAnswer].sort() : [];
        const correctArr = q.correct_answer.split(',').map((s) => s.trim()).filter(Boolean).sort();
        return JSON.stringify(userArr) === JSON.stringify(correctArr);
      }
      if (q.type === 'RANKING') {
        const userArr = Array.isArray(userAnswer) ? userAnswer : [];
        const correctArr = q.correct_answer.split(',').map((s) => s.trim()).filter(Boolean);
        return JSON.stringify(userArr) === JSON.stringify(correctArr);
      }
      return null;
    };

    const renderLockedAnswer = (q: Question) => {
      const val = answers[q.id];
      if (q.type === 'SHORT_TEXT' || q.type === 'NUMBER') {
        return <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">{String(val || '—')}</div>;
      }
      if (q.type === 'LONG_TEXT') {
        return <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm whitespace-pre-wrap">{String(val || '—')}</div>;
      }
      if (q.type === 'CODE') {
        return <pre className="rounded-md border bg-muted/30 px-3 py-2 font-mono text-sm whitespace-pre-wrap">{String(val || '—')}</pre>;
      }
      if (q.type === 'FILE') {
        return <div className="flex items-center gap-2 text-sm text-muted-foreground"><Paperclip className="h-4 w-4" />{val ? t.publicSurvey.fileAttachedShort : t.publicSurvey.noFile}</div>;
      }
      if (q.type === 'SINGLE_CHOICE' && q.options) {
        const correctVal = showCorrect && q.correct_answer ? q.correct_answer : null;
        return (
          <div className="space-y-1.5">
            {q.options.map((opt) => {
              const isSelected = val === opt;
              const isCorrectOpt = correctVal === opt;
              return (
                <div key={opt} className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${isSelected ? 'border-primary bg-primary/5 font-medium' : 'opacity-60'} ${isCorrectOpt && showCorrect ? 'ring-2 ring-green-500/50' : ''}`}>
                  <div className={`h-3.5 w-3.5 rounded-full border-2 ${isSelected ? 'border-primary bg-primary' : 'border-muted-foreground'}`} />
                  <span className="flex-1">{opt}</span>
                  {isCorrectOpt && showCorrect && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                </div>
              );
            })}
          </div>
        );
      }
      if (q.type === 'MULTI_CHOICE' && q.options) {
        const selected = Array.isArray(val) ? val : [];
        const correctArr = showCorrect && q.correct_answer ? q.correct_answer.split(',').map((s) => s.trim()).filter(Boolean) : [];
        return (
          <div className="space-y-1.5">
            {q.options.map((opt) => {
              const isSelected = selected.includes(opt);
              const isCorrectOpt = correctArr.includes(opt);
              return (
                <div key={opt} className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${isSelected ? 'border-primary bg-primary/5 font-medium' : 'opacity-60'} ${isCorrectOpt && showCorrect ? 'ring-2 ring-green-500/50' : ''}`}>
                  <div className={`h-3.5 w-3.5 rounded-sm border-2 ${isSelected ? 'border-primary bg-primary' : 'border-muted-foreground'}`} />
                  <span className="flex-1">{opt}</span>
                  {isCorrectOpt && showCorrect && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                </div>
              );
            })}
          </div>
        );
      }
      if (q.type === 'RANKING' && q.options) {
        const ranked = Array.isArray(val) ? val : q.options;
        const correctArr = showCorrect && q.correct_answer ? q.correct_answer.split(',').map((s) => s.trim()).filter(Boolean) : [];
        return (
          <div className="space-y-1.5">
            {ranked.map((item, i) => {
              const correctAtPos = correctArr[i];
              const posCorrect = correctAtPos === item;
              return (
                <div key={item} className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${showCorrect && correctArr.length > 0 ? (posCorrect ? 'ring-2 ring-green-500/50' : 'ring-2 ring-red-500/30') : ''}`}>
                  <span className="font-medium text-muted-foreground w-6">{i + 1}.</span>
                  <span className="flex-1">{item}</span>
                  {showCorrect && correctArr.length > 0 && (posCorrect ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <span className="text-xs text-red-500">→ {correctAtPos}</span>)}
                </div>
              );
            })}
          </div>
        );
      }
      return <div className="text-sm text-muted-foreground">—</div>;
    };

    return (
      <div className={`min-h-screen ${theme.pageBg} py-8`}>
        <div className="absolute top-4 right-4 z-50"><LanguageSwitcher /></div>
        <div className="mx-auto max-w-4xl px-4">
          {/* Success banner */}
          <Card className="mb-6 border-green-200 bg-green-50 shadow-sm">
            <CardContent className="py-4 flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-green-600 shrink-0" />
              <div>
                <h2 className="text-lg font-bold text-green-900">{t.publicSurvey.thankYou}</h2>
                <p className="text-sm text-green-700">{t.publicSurvey.responseSubmittedReview}</p>
              </div>
            </CardContent>
          </Card>

          {/* Survey header */}
          <div className="mb-6">
            {survey.banner_image && (
              <img src={survey.banner_image} alt="" className="w-full max-h-48 object-cover rounded-lg" />
            )}
            <h1 className="text-2xl font-semibold mt-2">{survey.title}</h1>
            {survey.description && (
              <p className="text-base text-muted-foreground mt-1">{survey.description}</p>
            )}
          </div>

          {/* Locked question cards */}
          <div className="space-y-4">
            {survey.questions?.map((q: Question, idx: number) => {
              const correctness = isCorrect(q);
              return (
                <Card key={q.id} className={`shadow-sm ${correctness === true ? 'border-green-300' : correctness === false ? 'border-red-300' : ''}`}>
                  {q.banner_image && (
                    <img src={q.banner_image} alt="" className="w-full max-h-48 object-cover rounded-t-lg" />
                  )}
                  <CardHeader className="pb-2">
                    <div className="flex items-start gap-2">
                      <span className={`text-sm font-medium ${theme.accent}`}>{idx + 1}.</span>
                      <div className="flex-1">
                        <CardTitle className="text-base">
                          {q.text}
                          {q.required && <span className="ml-1 text-destructive">*</span>}
                        </CardTitle>
                        {q.description && (
                          <p className="text-sm text-muted-foreground mt-1">{q.description}</p>
                        )}
                      </div>
                      {correctness === true && <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />}
                      {correctness === false && <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {renderLockedAnswer(q)}
                    {showCorrect && q.correct_answer && correctness === false && !['SINGLE_CHOICE', 'MULTI_CHOICE', 'RANKING'].includes(q.type) && (
                      <div className="mt-2 flex items-start gap-1.5 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">
                          {t.survey.correct}: <span className="font-medium text-green-700">{q.correct_answer}</span>
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            {t.common.poweredBy}
          </p>
        </div>
      </div>
    );
  }

  // Time expired
  if (timeExpired && !submitted) {
    return (
      <div className={`flex min-h-screen items-center justify-center ${theme.pageBg}`}>
        <div className="absolute top-4 right-4"><LanguageSwitcher /></div>
        <Card className="w-full max-w-sm shadow-lg overflow-hidden">
          <CardContent className="py-10 text-center space-y-6">
            <AlertTriangle className={`mx-auto h-12 w-12 ${theme.accent || 'text-amber-600'}`} />
            <div>
              <h2 className="text-xl font-bold">{t.publicSurvey.timesUp}</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {t.publicSurvey.timesUpMessage}
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <Button
                onClick={forceSubmit}
                disabled={submitMutation.isPending}
                className={`w-full ${theme.button}`}
              >
                {submitMutation.isPending ? t.publicSurvey.submitting : t.publicSurvey.submitMyAnswers}
              </Button>
              <Button
                variant="outline"
                onClick={() => confirmAndReset(t.publicSurvey.discardConfirm)}
                className="w-full"
              >
                {t.publicSurvey.discard}
              </Button>
            </div>
            {submitMutation.isError && (
              <p className="text-sm text-destructive">{t.publicSurvey.failedToSubmit}</p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Entrance handler
  if (needsGate && !gateCompleted) {
    return (
      <div className={`min-h-screen ${theme.pageBg} py-12`}>
        <div className="absolute top-4 right-4 z-50"><LanguageSwitcher /></div>
        <div className="mx-auto max-w-lg px-4">
          {/* Survey header */}
          <div className="mb-6">
            {survey.banner_image && (
              <img src={survey.banner_image} alt="" className="w-full max-h-48 object-cover rounded-lg" />
            )}
            <h1 className="text-2xl font-semibold mt-2">{survey.title}</h1>
            {survey.description && (
              <p className="text-base text-muted-foreground mt-1">{survey.description}</p>
            )}
            <div className="flex flex-wrap gap-3 pt-2 text-sm text-muted-foreground">
              {questions.length > 0 && (
                <span className="flex items-center gap-1">
                  <ClipboardList className="h-3.5 w-3.5" />
                  {questions.length} {questions.length === 1 ? t.publicSurvey.questionCount.split(' | ')[0].replace('{count} ', '') : t.publicSurvey.questionCount.split(' | ')[1].replace('{count} ', '')}
                </span>
              )}
              {survey.time_limit && (
                <span className="flex items-center gap-1">
                  <Timer className="h-3.5 w-3.5" />
                  {t.publicSurvey.timeLimitInfo.replace('{minutes}', String(survey.time_limit))}
                </span>
                )}
              </div>
          </div>

          {/* Gate card */}
          <Card className="overflow-hidden shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShieldCheck className="h-5 w-5" />
                {t.publicSurvey.beforeYouBegin}
              </CardTitle>
              <CardDescription>
                {survey.access_password
                  ? t.publicSurvey.verifyAndProvide
                  : t.publicSurvey.provideInfo}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {survey.access_password && (
                <div className="space-y-2">
                  <Label htmlFor="gate-password" className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    {t.publicSurvey.surveyPassword} <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="gate-password"
                      type="password"
                      value={passwordInput}
                      onChange={(e) => { setPasswordInput(e.target.value); setPasswordError(''); }}
                      placeholder={t.publicSurvey.enterPassword}
                      className="pl-10"
                      onKeyDown={(e) => e.key === 'Enter' && handleGateSubmit()}
                    />
                  </div>
                </div>
              )}
              {survey.require_name && (
                <div className="space-y-2">
                  <Label htmlFor="gate-name" className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    {t.publicSurvey.fullName} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="gate-name"
                    value={respondentName}
                    onChange={(e) => { setRespondentName(e.target.value); setPasswordError(''); }}
                    placeholder={t.publicSurvey.fullNamePlaceholder}
                    onKeyDown={(e) => e.key === 'Enter' && handleGateSubmit()}
                  />
                </div>
              )}
              {survey.require_email && (
                <div className="space-y-2">
                  <Label htmlFor="gate-email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    {t.publicSurvey.emailAddress} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="gate-email"
                    type="email"
                    value={respondentEmail}
                    onChange={(e) => { setRespondentEmail(e.target.value); setPasswordError(''); }}
                    placeholder={t.publicSurvey.emailPlaceholder}
                    onKeyDown={(e) => e.key === 'Enter' && handleGateSubmit()}
                  />
                </div>
              )}

              {passwordError && (
                <p className="text-sm text-destructive">{passwordError}</p>
              )}

              <Button onClick={handleGateSubmit} className={`w-full ${theme.button}`} size="lg">
                <Play className="mr-2 h-4 w-4" />
                {t.publicSurvey.startSurvey}
              </Button>
            </CardContent>
          </Card>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            {t.common.poweredBy}
          </p>
        </div>
      </div>
    );
  }

  // Question card helper
  const renderQuestionCard = (q: Question, idx: number) => (
    <Card key={q.id} className="shadow-sm">
      {q.banner_image && (
        <img src={q.banner_image} alt="" className="w-full max-h-48 object-cover rounded-t-lg" />
      )}
      <CardHeader className="pb-2">
        <div className="flex items-start gap-2">
          <span className={`text-sm font-medium ${theme.accent}`}>{idx + 1}.</span>
          <div>
            <CardTitle className="text-base">
              {q.text}
              {q.required && <span className="ml-1 text-destructive">*</span>}
            </CardTitle>
            {q.description && (
              <p className="text-sm text-muted-foreground mt-1">{q.description}</p>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <QuestionInput
          question={q}
          value={answers[q.id]}
          onTextChange={handleChange}
          onSingleChoice={handleChange}
          onMultiChoice={handleMultiChoice}
          onSetAnswer={(qid, val) => setAnswers((prev) => ({ ...prev, [qid]: val }))}
          onRemoveAnswer={(qid) => setAnswers((prev) => { const n = { ...prev }; delete n[qid]; return n; })}
          t={t}
        />
      </CardContent>
    </Card>
  );

  // Main survey form
  return (
    <div className={`min-h-screen ${theme.pageBg} py-8`}>
      <div className="absolute top-4 right-4 z-50"><LanguageSwitcher /></div>
      <div className="mx-auto max-w-4xl px-4">
        {/* Floating timer */}
        {secondsLeft !== null && secondsLeft > 0 && (
          <div className={`sticky top-4 z-50 mb-4 flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium shadow-md ${
            secondsLeft <= 60
              ? 'border-red-200 bg-red-50 text-red-700'
              : secondsLeft <= 300
                ? 'border-amber-200 bg-amber-50 text-amber-700'
                : theme.timerDefault || 'border-border bg-background text-foreground'
          }`}>
            <Timer className="h-4 w-4" />
            {t.publicSurvey.timeRemaining}: {formatTime(secondsLeft)}
          </div>
        )}

        {/* Survey header */}
        <div className="mb-6">
          {survey.banner_image && (
            <img src={survey.banner_image} alt="" className="w-full max-h-48 object-cover rounded-lg" />
          )}
          <h1 className="text-2xl font-semibold mt-2">{survey.title}</h1>
          {survey.description && (
            <p className="text-base text-muted-foreground mt-1">{survey.description}</p>
          )}
        </div>

        {/* Progress indicator for one-per-page */}
        {isOnePerPage && totalPages > 1 && (
          <div className="mb-4 space-y-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{t.publicSurvey.questionOf.replace('{current}', String(currentPage + 1)).replace('{total}', String(totalPages))}</span>
              <span>{Math.round(((currentPage + 1) / totalPages) * 100)}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${theme.progressBar || 'bg-primary'}`}
                style={{ width: `${((currentPage + 1) / totalPages) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Questions */}
        <div className="space-y-4">
          {isOnePerPage
            ? questions[currentPage] && renderQuestionCard(questions[currentPage], currentPage)
            : questions.map((q, idx) => renderQuestionCard(q, idx))
          }
        </div>

        {/* reCAPTCHA */}
        {isLastPage && (
          <div className="mt-6">
            <ReCAPTCHA
              ref={captchaRef}
              sitekey={RECAPTCHA_SITE_KEY}
              onChange={(token) => setCaptchaToken(token)}
              onExpired={() => setCaptchaToken(null)}
            />
          </div>
        )}

        {/* Navigation */}
        <div className="mt-6 space-y-3">
          {isOnePerPage ? (
            <div className="flex gap-3">
              {canGoBack && (
                <Button variant="outline" onClick={handleBack} size="lg" className="flex-1">
                  <ChevronLeft className="mr-1.5 h-4 w-4" />
                  {t.common.back}
                </Button>
              )}
              {isLastPage ? (
                <Button
                  onClick={handleSubmit}
                  disabled={submitMutation.isPending || !captchaToken}
                  className={`flex-1 ${theme.button}`}
                  size="lg"
                >
                  {submitMutation.isPending ? t.publicSurvey.submitting : t.publicSurvey.submitResponse}
                </Button>
              ) : (
                <Button onClick={handleNext} className={`flex-1 ${theme.button}`} size="lg">
                  {t.common.next}
                  <ChevronRight className="ml-1.5 h-4 w-4" />
                </Button>
              )}
            </div>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={submitMutation.isPending || !captchaToken}
              className={`w-full ${theme.button}`}
              size="lg"
            >
              {submitMutation.isPending ? t.publicSurvey.submitting : t.publicSurvey.submitResponse}
            </Button>
          )}
          {submitMutation.isError && (
            <p className="text-center text-sm text-destructive">
              {t.publicSurvey.failedToSubmit}
            </p>
          )}
        </div>

        {/* Utility bar */}
        <div className="mt-6 flex items-center justify-center gap-4 border-t pt-4">
          <Button variant="ghost" size="sm" onClick={() => confirmAndReset(t.publicSurvey.quitConfirm)} className="text-muted-foreground hover:text-destructive">
            <LogOut className="mr-1.5 h-4 w-4" />
            {t.publicSurvey.quitSurvey}
          </Button>
          <Button variant="ghost" size="sm" onClick={handleClearAnswers} className="text-muted-foreground hover:text-destructive">
            <Eraser className="mr-1.5 h-4 w-4" />
            {t.publicSurvey.clearAnswers}
          </Button>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          {t.common.poweredBy}
        </p>
      </div>
    </div>
  );
}
