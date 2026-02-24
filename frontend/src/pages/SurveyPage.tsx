// Full survey management

import { useState, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { surveysApi } from '@/api/surveys';
import { useAuth } from '@/features/auth/AuthContext';
import AppLayout from '@/components/AppLayout';
import CollaboratorDialog from '@/components/CollaboratorDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Copy,
  Save,
  Send,
  Settings,
  ListChecks,
  BarChart3,
  FileText,
  FileSpreadsheet,
  Star,
} from 'lucide-react';
import type { QuestionType, CollaboratorRole, UpdateQuestionPayload, UpdateSurveyPayload } from '@/types';
import { useTranslation } from '@/i18n';
import usePageTitle from '@/hooks/usePageTitle';
import { toast } from 'sonner';
import { needsOptions } from '@/lib/questionTypeUtils';
import { downloadBlob } from '@/lib/downloadBlob';

import SettingsTab from '@/features/surveys/SettingsTab';
import QuestionsTab from '@/features/surveys/QuestionsTab';
import ResultsTab from '@/features/surveys/ResultsTab';

type SurveyTab = 'settings' | 'questions' | 'results';

export default function SurveyPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const surveyId = Number(id);

  const tabParam = searchParams.get('tab');
  const activeTab: SurveyTab = tabParam === 'results' ? 'results' : tabParam === 'questions' ? 'questions' : 'settings';
  const setActiveTab = (tab: SurveyTab) => setSearchParams({ tab });

  // Form state synced from server
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isAcceptingResponses, setIsAcceptingResponses] = useState(true);
  const [opensAt, setOpensAt] = useState('');
  const [closesAt, setClosesAt] = useState('');

  usePageTitle(title || t.pageTitles.survey);
  const [requireName, setRequireName] = useState(false);
  const [requireEmail, setRequireEmail] = useState(false);
  const [accessPassword, setAccessPassword] = useState('');
  const [timeLimit, setTimeLimit] = useState<string>('');
  const [themeColor, setThemeColor] = useState<string>('');
  const [bannerImage, setBannerImage] = useState<string>('');
  const [showResponsesAfterSubmit, setShowResponsesAfterSubmit] = useState(false);
  const [showCorrectAfterSubmit, setShowCorrectAfterSubmit] = useState(false);
  const [oneQuestionPerPage, setOneQuestionPerPage] = useState(false);
  const [preventGoingBack, setPreventGoingBack] = useState(false);
  const [titleDirty, setTitleDirty] = useState(false);

  const [collabOpen, setCollabOpen] = useState(false);
  const [collabEmail, setCollabEmail] = useState('');
  const [collabRole, setCollabRole] = useState<CollaboratorRole>('viewer');

  const [newQuestionOpen, setNewQuestionOpen] = useState(false);
  const [newQType, setNewQType] = useState<QuestionType>('SHORT_TEXT');
  const [newQText, setNewQText] = useState('');
  const [newQDescription, setNewQDescription] = useState('');
  const [newQBannerImage, setNewQBannerImage] = useState('');
  const [newQRequired, setNewQRequired] = useState(false);
  const [newQOptions, setNewQOptions] = useState<string[]>(['']);
  const [newQCorrectAnswer, setNewQCorrectAnswer] = useState('');
  const [newQHasCorrectAnswer, setNewQHasCorrectAnswer] = useState(false);

  // Fetch survey details
  const { data: survey, isLoading } = useQuery({
    queryKey: ['survey', surveyId],
    queryFn: () => surveysApi.get(surveyId),
    enabled: !!surveyId,
  });

  // Fetch aggregated results
  const { data: results, isLoading: resultsLoading } = useQuery({
    queryKey: ['results', surveyId],
    queryFn: () => surveysApi.getResults(surveyId),
    enabled: !!surveyId && survey?.status === 'published',
  });

  // Sync local form state from server data
  if (survey && !titleDirty) {
    if (title !== survey.title) setTitle(survey.title);
    if (description !== (survey.description || '')) setDescription(survey.description || '');
    const serverAccepting = survey.is_accepting_responses ?? true;
    if (isAcceptingResponses !== serverAccepting) setIsAcceptingResponses(serverAccepting);
    const serverOpens = survey.opens_at ? survey.opens_at.slice(0, 16) : '';
    if (opensAt !== serverOpens) setOpensAt(serverOpens);
    const serverCloses = survey.closes_at ? survey.closes_at.slice(0, 16) : '';
    if (closesAt !== serverCloses) setClosesAt(serverCloses);
    const serverRequireName = survey.require_name ?? false;
    if (requireName !== serverRequireName) setRequireName(serverRequireName);
    const serverRequireEmail = survey.require_email ?? false;
    if (requireEmail !== serverRequireEmail) setRequireEmail(serverRequireEmail);
    const serverAccessPassword = survey.access_password ?? '';
    if (accessPassword !== serverAccessPassword) setAccessPassword(serverAccessPassword);
    const serverTimeLimit = survey.time_limit != null ? String(survey.time_limit) : '';
    if (timeLimit !== serverTimeLimit) setTimeLimit(serverTimeLimit);
    const serverThemeColor = survey.theme_color ?? '';
    if (themeColor !== serverThemeColor) setThemeColor(serverThemeColor);
    const serverBanner = survey.banner_image ?? '';
    if (bannerImage !== serverBanner) setBannerImage(serverBanner);
    const serverShowResponses = survey.show_responses_after_submit ?? false;
    if (showResponsesAfterSubmit !== serverShowResponses) setShowResponsesAfterSubmit(serverShowResponses);
    const serverShowCorrect = survey.show_correct_after_submit ?? false;
    if (showCorrectAfterSubmit !== serverShowCorrect) setShowCorrectAfterSubmit(serverShowCorrect);
    const serverOnePerPage = survey.one_question_per_page ?? false;
    if (oneQuestionPerPage !== serverOnePerPage) setOneQuestionPerPage(serverOnePerPage);
    const serverPreventBack = survey.prevent_going_back ?? false;
    if (preventGoingBack !== serverPreventBack) setPreventGoingBack(serverPreventBack);
  }

  // Dirty tracking
  const isDirty = useMemo(() => {
    if (!survey) return false;
    return (
      title !== survey.title ||
      description !== (survey.description || '') ||
      isAcceptingResponses !== (survey.is_accepting_responses ?? true) ||
      opensAt !== (survey.opens_at ? survey.opens_at.slice(0, 16) : '') ||
      closesAt !== (survey.closes_at ? survey.closes_at.slice(0, 16) : '') ||
      requireName !== (survey.require_name ?? false) ||
      requireEmail !== (survey.require_email ?? false) ||
      accessPassword !== (survey.access_password ?? '') ||
      timeLimit !== (survey.time_limit != null ? String(survey.time_limit) : '') ||
      themeColor !== (survey.theme_color ?? '') ||
      bannerImage !== (survey.banner_image ?? '') ||
      showResponsesAfterSubmit !== (survey.show_responses_after_submit ?? false) ||
      showCorrectAfterSubmit !== (survey.show_correct_after_submit ?? false) ||
      oneQuestionPerPage !== (survey.one_question_per_page ?? false) ||
      preventGoingBack !== (survey.prevent_going_back ?? false)
    );
  }, [survey, title, description, isAcceptingResponses, opensAt, closesAt, requireName, requireEmail, accessPassword, timeLimit, themeColor, bannerImage, showResponsesAfterSubmit, showCorrectAfterSubmit, oneQuestionPerPage, preventGoingBack]);

  // Save survey settings
  const updateMutation = useMutation({
    mutationFn: (data: UpdateSurveyPayload) =>
      surveysApi.update(surveyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['survey', surveyId] });
      toast.success(t.survey.surveySaved);
      setTitleDirty(false);
    },
  });

  // Publish survey
  const publishMutation = useMutation({
    mutationFn: () => surveysApi.publish(surveyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['survey', surveyId] });
      queryClient.invalidateQueries({ queryKey: ['surveys'] });
      toast.success(t.survey.surveyPublished);
    },
  });

  // Add a new question
  const addQuestionMutation = useMutation({
    mutationFn: (data: { type: QuestionType; text: string; description?: string | null; banner_image?: string | null; options?: string[]; required?: boolean; correct_answer?: string | null }) =>
      surveysApi.addQuestion(surveyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['survey', surveyId] });
      setNewQuestionOpen(false);
      resetNewQuestion();
      toast.success(t.survey.questionAdded);
    },
  });

  // Delete a question
  const deleteQuestionMutation = useMutation({
    mutationFn: (questionId: number) => surveysApi.deleteQuestion(questionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['survey', surveyId] });
      toast.success(t.survey.questionDeleted);
    },
  });

  // Update a question
  const updateQuestionMutation = useMutation({
    mutationFn: ({ questionId, data }: { questionId: number; data: UpdateQuestionPayload }) =>
      surveysApi.updateQuestion(questionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['survey', surveyId] });
      toast.success(t.survey.questionUpdated);
    },
  });

  // Reorder questions
  const reorderMutation = useMutation({
    mutationFn: (order: number[]) => surveysApi.reorderQuestions(surveyId, order),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['survey', surveyId] });
    },
  });

  // Add collaborator
  const addCollabMutation = useMutation({
    mutationFn: (data: { email: string; role: CollaboratorRole }) =>
      surveysApi.addCollaborator(surveyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['survey', surveyId] });
      setCollabEmail('');
      toast.success(t.survey.collaboratorAdded);
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      toast.error(axiosErr.response?.data?.message || t.survey.failedAddCollaborator);
    },
  });

  // Remove collaborator
  const removeCollabMutation = useMutation({
    mutationFn: (userId: number) => surveysApi.removeCollaborator(surveyId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['survey', surveyId] });
      toast.success(t.survey.collaboratorRemoved);
    },
  });

  // Add to favorite 
  const favoriteMutation = useMutation({
    mutationFn: surveysApi.toggleFavorite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['survey', surveyId] });
      queryClient.invalidateQueries({ queryKey: ['surveys'] });
    },
  });

  // Helpers
  // Signals change
  const dirtySet = <T,>(setter: (v: T) => void) => (v: T) => { setter(v); setTitleDirty(true); };

  // Reset question form to defaults
  const resetNewQuestion = () => {
    setNewQType('SHORT_TEXT');
    setNewQText('');
    setNewQDescription('');
    setNewQBannerImage('');
    setNewQRequired(false);
    setNewQOptions(['']);
    setNewQCorrectAnswer('');
    setNewQHasCorrectAnswer(false);
  };

  // Save all changes
  const handleSave = () => {
    updateMutation.mutate({
      title,
      description: description || undefined,
      is_accepting_responses: isAcceptingResponses,
      opens_at: opensAt || null,
      closes_at: closesAt || null,
      require_name: requireName,
      require_email: requireEmail,
      access_password: accessPassword || null,
      time_limit: timeLimit ? Number(timeLimit) : null,
      theme_color: themeColor || null,
      banner_image: bannerImage || null,
      show_responses_after_submit: showResponsesAfterSubmit,
      show_correct_after_submit: showCorrectAfterSubmit,
      one_question_per_page: oneQuestionPerPage,
      prevent_going_back: preventGoingBack,
    });
  };

  // Validate and submit a new question
  const handleAddQuestion = () => {
    if (!newQText.trim()) return;
    const options =
      needsOptions(newQType) ? newQOptions.filter((o) => o.trim() !== '') : undefined;
    addQuestionMutation.mutate({
      type: newQType,
      text: newQText,
      description: newQDescription || null,
      banner_image: newQBannerImage || null,
      options,
      required: newQRequired,
      correct_answer: newQHasCorrectAnswer && newQType !== 'FILE' && newQCorrectAnswer ? newQCorrectAnswer : null,
    });
  };

  // Copy URL to clipboard
  const copyPublicLink = () => {
    if (survey?.slug) {
      const url = `${window.location.origin}/s/${survey.slug}`;
      navigator.clipboard.writeText(url);
      toast.success(t.survey.linkCopied);
    }
  };

  // Export results as CSV file
  const handleExportCsv = async () => {
    try {
      const blob = await surveysApi.exportCsv(surveyId);
      downloadBlob(blob, 'results.csv');
      toast.success(t.survey.csvExported);
    } catch {
      toast.error(t.survey.exportFailed);
    }
  };

  // Export results as XLSX file
  const handleExportExcel = async () => {
    try {
      const blob = await surveysApi.exportExcel(surveyId);
      downloadBlob(blob, 'results.xlsx');
      toast.success(t.survey.excelExported);
    } catch {
      toast.error(t.survey.exportFailed);
    }
  };

  const isOwner = survey?.owner_id === user?.id;
  const canEdit = survey?.user_role === 'owner' || survey?.user_role === 'editor';
  const isViewer = survey?.user_role === 'viewer';

  // Loading and error
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-black" />
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">{t.survey.surveyNotFound}</p>
      </div>
    );
  }

  return (
    <AppLayout>
      {/* Sub-header */}
      <header>
        {/* Title row */}
        <div className="mx-auto max-w-6xl px-4 pt-5 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0">
              <Button variant="ghost" size="icon" className="mt-0.5 h-8 w-8 shrink-0" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <h1 className="truncate text-2xl font-semibold tracking-tight">{survey.title}</h1>
                  <button
                    onClick={() => favoriteMutation.mutate(surveyId)}
                    className="p-1 rounded hover:bg-gray-100 transition-colors shrink-0"
                    title={survey.is_favorited ? t.dashboard.removeFromFavorites : t.dashboard.addToFavorites}
                  >
                    <Star
                      className={`h-5 w-5 transition-colors ${
                        survey.is_favorited
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300 hover:text-gray-400'
                      }`}
                    />
                  </button>
                  <Badge variant={survey.status === 'published' ? 'default' : 'secondary'} className="shrink-0">
                    {survey.status === 'published' ? t.dashboard.published : t.dashboard.draft}
                  </Badge>
                  <Badge
                    variant="default"
                    className={`shrink-0 ${
                      (survey.is_accepting_responses ?? true)
                        ? 'bg-green-600 hover:bg-green-600'
                        : 'bg-red-600 hover:bg-red-600'
                    }`}
                  >
                    {(survey.is_accepting_responses ?? true) ? t.dashboard.open : t.dashboard.closed}
                  </Badge>
                  {!isOwner && survey.user_role && (
                    <Badge variant="outline" className="shrink-0 capitalize">
                      {survey.user_role}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {survey.questions?.length || 0} {t.dashboard.questions}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
            {(activeTab === 'settings' || activeTab === 'questions') && (
              <>
                {survey.status === 'published' && survey.slug && (
                  <Button variant="outline" size="sm" onClick={copyPublicLink}>
                    <Copy className="mr-1.5 h-3 w-3" />
                    {t.survey.copyLink}
                  </Button>
                )}
                <CollaboratorDialog
                  open={collabOpen}
                  onOpenChange={setCollabOpen}
                  isOwner={isOwner}
                  collaborators={survey.collaborators ?? []}
                  collabEmail={collabEmail}
                  onCollabEmailChange={setCollabEmail}
                  collabRole={collabRole}
                  onCollabRoleChange={setCollabRole}
                  onAdd={() => addCollabMutation.mutate({ email: collabEmail, role: collabRole })}
                  addPending={addCollabMutation.isPending}
                  onRemove={(userId) => removeCollabMutation.mutate(userId)}
                />
                {canEdit && (
                  <Button size="sm" onClick={handleSave} disabled={updateMutation.isPending || !isDirty}>
                    <Save className="mr-1.5 h-3 w-3" />
                    {t.survey.saveSurvey}
                  </Button>
                )}
                {survey.status === 'draft' && isOwner && (
                  <Button
                    size="sm"
                    onClick={() => publishMutation.mutate()}
                    disabled={publishMutation.isPending || (survey.questions?.length || 0) === 0}
                  >
                    <Send className="mr-1.5 h-3 w-3" />
                    {t.survey.publish}
                  </Button>
                )}
              </>
            )}
            {activeTab === 'results' && (
              <>
                <Button variant="outline" size="sm" onClick={handleExportCsv}>
                  <FileText className="mr-1.5 h-3 w-3" />
                  CSV
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportExcel}>
                  <FileSpreadsheet className="mr-1.5 h-3 w-3" />
                  Excel
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

        {/* Tabs */}
        <div className="mx-auto max-w-6xl px-4">
          <nav className="-mb-px flex gap-6 border-b">
            <button
              onClick={() => setActiveTab('settings')}
              className={`inline-flex items-center gap-1.5 border-b-2 px-1 pb-3 pt-2 text-sm font-medium transition-colors ${
                activeTab === 'settings'
                  ? 'border-black text-foreground'
                  : 'border-transparent text-muted-foreground hover:border-gray-300 hover:text-foreground'
              }`}
            >
              <Settings className="h-3.5 w-3.5" />
              {t.survey.settingsTab}
            </button>
            <button
              onClick={() => setActiveTab('questions')}
              className={`inline-flex items-center gap-1.5 border-b-2 px-1 pb-3 pt-2 text-sm font-medium transition-colors ${
                activeTab === 'questions'
                  ? 'border-black text-foreground'
                  : 'border-transparent text-muted-foreground hover:border-gray-300 hover:text-foreground'
              }`}
            >
              <ListChecks className="h-3.5 w-3.5" />
              {t.survey.questionsTab}
              {survey.questions && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">{survey.questions.length}</Badge>
              )}
            </button>
            <button
              onClick={() => setActiveTab('results')}
              disabled={survey.status !== 'published'}
              className={`inline-flex items-center gap-1.5 border-b-2 px-1 pb-3 pt-2 text-sm font-medium transition-colors ${
                survey.status !== 'published'
                  ? 'cursor-not-allowed border-transparent text-muted-foreground/40'
                  : activeTab === 'results'
                  ? 'border-black text-foreground'
                  : 'border-transparent text-muted-foreground hover:border-gray-300 hover:text-foreground'
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              {t.survey.resultsTab}
              {survey.status === 'published' && results && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">{results.total_responses}</Badge>
              )}
              {survey.status !== 'published' && (
                <span className="text-xs">{t.survey.publishFirst}</span>
              )}
            </button>
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-6xl px-4 py-8">
        {activeTab === 'settings' && (
          <SettingsTab
            survey={survey}
            title={title}
            description={description}
            isAcceptingResponses={isAcceptingResponses}
            opensAt={opensAt}
            closesAt={closesAt}
            requireName={requireName}
            requireEmail={requireEmail}
            accessPassword={accessPassword}
            setTitle={setTitle}
            setDescription={setDescription}
            setIsAcceptingResponses={dirtySet(setIsAcceptingResponses)}
            setOpensAt={dirtySet(setOpensAt)}
            setClosesAt={dirtySet(setClosesAt)}
            setRequireName={dirtySet(setRequireName)}
            setRequireEmail={dirtySet(setRequireEmail)}
            setAccessPassword={dirtySet(setAccessPassword)}
            timeLimit={timeLimit}
            setTimeLimit={dirtySet(setTimeLimit)}
            themeColor={themeColor}
            setThemeColor={dirtySet(setThemeColor)}
            bannerImage={bannerImage}
            setBannerImage={dirtySet(setBannerImage)}
            showResponsesAfterSubmit={showResponsesAfterSubmit}
            setShowResponsesAfterSubmit={dirtySet(setShowResponsesAfterSubmit)}
            showCorrectAfterSubmit={showCorrectAfterSubmit}
            setShowCorrectAfterSubmit={dirtySet(setShowCorrectAfterSubmit)}
            oneQuestionPerPage={oneQuestionPerPage}
            setOneQuestionPerPage={dirtySet(setOneQuestionPerPage)}
            preventGoingBack={preventGoingBack}
            setPreventGoingBack={dirtySet(setPreventGoingBack)}
            setTitleDirty={setTitleDirty}
            readOnly={isViewer}
          />
        )}
        {activeTab === 'questions' && (
          <QuestionsTab
            survey={survey}
            surveyId={surveyId}
            newQuestionOpen={newQuestionOpen}
            setNewQuestionOpen={setNewQuestionOpen}
            newQType={newQType}
            setNewQType={setNewQType}
            newQText={newQText}
            setNewQText={setNewQText}
            newQDescription={newQDescription}
            setNewQDescription={setNewQDescription}
            newQBannerImage={newQBannerImage}
            setNewQBannerImage={setNewQBannerImage}
            newQRequired={newQRequired}
            setNewQRequired={setNewQRequired}
            newQOptions={newQOptions}
            setNewQOptions={setNewQOptions}
            newQCorrectAnswer={newQCorrectAnswer}
            setNewQCorrectAnswer={setNewQCorrectAnswer}
            newQHasCorrectAnswer={newQHasCorrectAnswer}
            setNewQHasCorrectAnswer={setNewQHasCorrectAnswer}
            handleAddQuestion={handleAddQuestion}
            addQuestionMutation={addQuestionMutation}
            deleteQuestionMutation={deleteQuestionMutation}
            updateQuestionMutation={updateQuestionMutation}
            reorderMutation={reorderMutation}
            readOnly={isViewer}
            canDelete={isOwner}
          />
        )}
        {activeTab === 'results' && (
          <ResultsTab
            surveyId={surveyId}
            results={results}
            isLoading={resultsLoading}
            questions={survey?.questions || []}
            canEdit={canEdit}
          />
        )}
      </main>
    </AppLayout>
  );
}
