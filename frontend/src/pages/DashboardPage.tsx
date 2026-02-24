// DashboardPage

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { useTranslation } from '@/i18n';
import usePageTitle from '@/hooks/usePageTitle';
import { surveysApi } from '@/api/surveys';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import ConfirmDeleteDialog from '@/components/ConfirmDeleteDialog';
import { Label } from '@/components/ui/label';
import {
  Plus,
  FileText,
  Star,
  LayoutGrid,
  List,
  Trash2,
  Copy,
  User as UserIcon,
  ChevronLeft,
  ChevronRight,
  Globe,
  FilePen,
  Users,
  FolderOpen,
  type LucideIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Survey } from '@/types';

type TabKey = 'all' | 'favorites' | 'owned' | 'published' | 'draft' | 'shared';
type ViewMode = 'grid' | 'list';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  usePageTitle(t.pageTitles.dashboard);

  const TABS: { key: TabKey; label: string; icon: LucideIcon }[] = useMemo(() => [
    { key: 'all', label: t.dashboard.tabAll, icon: LayoutGrid },
    { key: 'favorites', label: t.dashboard.tabFavorites, icon: Star },
    { key: 'owned', label: t.dashboard.tabMySurveys, icon: FolderOpen },
    { key: 'published', label: t.dashboard.tabPublished, icon: Globe },
    { key: 'draft', label: t.dashboard.tabDrafts, icon: FilePen },
    { key: 'shared', label: t.dashboard.tabShared, icon: Users },
  ], [t]);
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem('dashboard-view-mode');
    return saved === 'grid' || saved === 'list' ? saved : 'list';
  });
  const handleViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('dashboard-view-mode', mode);
  };
  const [deleteTarget, setDeleteTarget] = useState<Survey | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(() => {
    const saved = localStorage.getItem('dashboard-per-page');
    return saved ? Number(saved) : 9;
  });

  const { data: surveys = [], isLoading } = useQuery({
    queryKey: ['surveys'],
    queryFn: surveysApi.list,
  });

  const createMutation = useMutation({
    mutationFn: surveysApi.create,
    onSuccess: (survey: Survey) => {
      queryClient.invalidateQueries({ queryKey: ['surveys'] });
      setIsCreateOpen(false);
      setNewTitle('');
      navigate(`/surveys/${survey.id}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: surveysApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surveys'] });
      setDeleteTarget(null);
      toast.success(t.dashboard.surveyDeleted);
    },
  });

  const favoriteMutation = useMutation({
    mutationFn: surveysApi.toggleFavorite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surveys'] });
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: surveysApi.duplicate,
    onSuccess: (newSurvey: Survey) => {
      queryClient.invalidateQueries({ queryKey: ['surveys'] });
      toast.success(t.dashboard.surveyDuplicated);
      navigate(`/surveys/${newSurvey.id}`);
    },
  });

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    createMutation.mutate({ title: newTitle });
  };

  // Filter surveys by active tab
  const filteredSurveys = useMemo(() => {
    let filtered = surveys.filter((s: Survey) => {
      switch (activeTab) {
        case 'favorites':
          return s.is_favorited;
        case 'published':
          return s.status === 'published';
        case 'draft':
          return s.status === 'draft' && s.owner_id === user?.id;
        case 'owned':
          return s.owner_id === user?.id;
        case 'shared':
          return s.owner_id !== user?.id;
        default:
          return true;
      }
    });

    // Sort favorites first then by updated_at
    filtered = [...filtered].sort((a, b) => {
      if (a.is_favorited && !b.is_favorited) return -1;
      if (!a.is_favorited && b.is_favorited) return 1;
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });

    return filtered;
  }, [surveys, activeTab, user?.id]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredSurveys.length / perPage));
  const paginatedSurveys = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return filteredSurveys.slice(start, start + perPage);
  }, [filteredSurveys, currentPage, perPage]);

  // Reset page when tab or perPage changes
  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };
  const handlePerPageChange = (value: number) => {
    setPerPage(value);
    setCurrentPage(1);
    localStorage.setItem('dashboard-per-page', String(value));
  };

  // Count per tab
  const counts = useMemo(() => {
    const c: Record<TabKey, number> = { all: 0, favorites: 0, owned: 0, published: 0, draft: 0, shared: 0 };
    for (const s of surveys as Survey[]) {
      c.all++;
      if (s.is_favorited) c.favorites++;
      if (s.owner_id === user?.id) {
        c.owned++;
        if (s.status === 'draft') c.draft++;
      } else {
        c.shared++;
      }
      if (s.status === 'published') c.published++;
    }
    return c;
  }, [surveys, user?.id]);

  // Formats a date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t.dashboard.justNow;
    if (diffMins < 60) return t.dashboard.minutesAgo.replace('{count}', String(diffMins));
    if (diffHours < 24) return t.dashboard.hoursAgo.replace('{count}', String(diffHours));
    if (diffDays < 7) return t.dashboard.daysAgo.replace('{count}', String(diffDays));
    return date.toLocaleDateString();
  };

  // Renders badges
  const surveyBadges = (survey: Survey, shrink = false) => {
    const cls = shrink ? 'text-xs shrink-0' : 'text-xs';
    return (
      <>
        {survey.owner_id !== user?.id && (
          <Badge variant="outline" className={`${cls} capitalize`}>{survey.user_role || 'Shared'}</Badge>
        )}
        <Badge variant={survey.status === 'published' ? 'default' : 'secondary'} className={cls}>
          {survey.status === 'published' ? t.dashboard.published : t.dashboard.draft}
        </Badge>
        {survey.status === 'published' && (
          <Badge
            variant="default"
            className={`${cls} ${survey.is_accepting_responses ? 'bg-green-600 hover:bg-green-600' : 'bg-red-600 hover:bg-red-600'}`}
          >
            {survey.is_accepting_responses ? t.dashboard.open : t.dashboard.closed}
          </Badge>
        )}
      </>
    );
  };

  // Favorite button
  const favoriteButton = (survey: Survey) => (
    <button
      onClick={(e) => {
        e.stopPropagation();
        favoriteMutation.mutate(survey.id);
      }}
      className="p-0.5 rounded hover:bg-gray-100 transition-colors shrink-0"
      title={survey.is_favorited ? t.dashboard.removeFromFavorites : t.dashboard.addToFavorites}
    >
      <Star
        className={`h-4 w-4 transition-colors ${
          survey.is_favorited
            ? 'fill-yellow-400 text-yellow-400'
            : 'text-gray-300 group-hover:text-gray-400'
        }`}
      />
    </button>
  );

  // Duplicate and delete
  const surveyActions = (survey: Survey) => (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
        onClick={() => duplicateMutation.mutate(survey.id)}
        disabled={duplicateMutation.isPending}
        title={t.dashboard.duplicate}
      >
        <Copy className="h-3.5 w-3.5" />
      </Button>
      {survey.owner_id === user?.id && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
          onClick={() => setDeleteTarget(survey)}
          title={t.common.delete}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      )}
    </>
  );

  // Grid view card for a single survey
  const renderSurveyCard = (survey: Survey) => (
    <Card
      key={survey.id}
      className="group cursor-pointer transition-all hover:shadow-md hover:border-gray-300"
      onClick={() => navigate(`/surveys/${survey.id}`)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base leading-snug line-clamp-1">{survey.title}</CardTitle>
          <div className="flex items-center gap-1.5 shrink-0">
            {favoriteButton(survey)}
            {surveyBadges(survey)}
          </div>
        </div>
        {survey.description && (
          <CardDescription className="line-clamp-1 mt-1">{survey.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span>{survey.questions?.length || 0} {t.dashboard.questions}</span>
            {survey.owner_id !== user?.id && survey.owner && (
              <span className="flex items-center gap-1">
                <UserIcon className="h-3 w-3" />
                {survey.owner.name}
              </span>
            )}
          </div>
          <span>{formatDate(survey.updated_at)}</span>
        </div>
        <div
          className="flex items-center justify-end gap-1 mt-3 pt-3 border-t opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          {surveyActions(survey)}
        </div>
      </CardContent>
    </Card>
  );

  // List view row for a single survey
  const renderSurveyRow = (survey: Survey) => (
    <div
      key={survey.id}
      className="group flex items-center gap-4 px-4 py-3 border rounded-lg cursor-pointer transition-all hover:shadow-sm hover:border-gray-300 bg-white"
      onClick={() => navigate(`/surveys/${survey.id}`)}
    >
      {favoriteButton(survey)}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">{survey.title}</span>
          {surveyBadges(survey, true)}
        </div>
        {survey.description && (
          <p className="text-xs text-muted-foreground truncate max-w-xs mt-0.5">{survey.description}</p>
        )}
      </div>

      {survey.owner_id !== user?.id && survey.owner && (
        <span className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground shrink-0">
          <UserIcon className="h-3 w-3" />
          {survey.owner.name}
        </span>
      )}

      <span className="hidden sm:block text-xs text-muted-foreground shrink-0">
        {survey.questions?.length || 0} {t.dashboard.questions}
      </span>

      <span className="text-xs text-muted-foreground shrink-0 w-16 text-right">
        {formatDate(survey.updated_at)}
      </span>

      <div
        className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => e.stopPropagation()}
      >
        {surveyActions(survey)}
      </div>
    </div>
  );

  return (
    <AppLayout>
      {/* Content */}
      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* Title row */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">{t.dashboard.greeting.replace('{name}', user?.name || '')}</h2>
            <p className="text-sm text-muted-foreground mt-1">{t.dashboard.subtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex items-center border rounded-lg p-0.5 gap-0.5">
              <button
                onClick={() => handleViewMode('list')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-sm font-medium transition-colors ${
                  viewMode === 'list' ? 'bg-black text-white' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <List className="h-4 w-4" />
                {t.dashboard.list}
              </button>
              <button
                onClick={() => handleViewMode('grid')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-sm font-medium transition-colors ${
                  viewMode === 'grid' ? 'bg-black text-white' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
                {t.dashboard.grid}
              </button>
            </div>

            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-1.5 h-4 w-4" />
                  {t.dashboard.newSurvey}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t.dashboard.createNewSurvey}</DialogTitle>
                  <DialogDescription>
                    {t.dashboard.createDescription}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>{t.survey.titleLabel}</Label>
                    <Input
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder={t.dashboard.surveyTitlePlaceholder}
                      onKeyDown={(e) => e.key === 'Enter' && newTitle.trim() && handleCreate()}
                    />
                  </div>
                  <Button
                    onClick={handleCreate}
                    disabled={!newTitle.trim() || createMutation.isPending}
                    className="w-full"
                  >
                    {createMutation.isPending ? t.dashboard.creating : t.dashboard.createAndEdit}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b">
          <nav className="-mb-px flex gap-6" aria-label="Tabs">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`
                  inline-flex items-center gap-2 border-b-2 px-1 pb-3 text-sm font-medium transition-colors
                  ${activeTab === tab.key
                    ? 'border-black text-foreground'
                    : 'border-transparent text-muted-foreground hover:border-gray-300 hover:text-foreground'
                  }
                `}
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
                <span
                  className={`
                    inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-medium
                    ${activeTab === tab.key
                      ? 'bg-black text-white'
                      : 'bg-gray-100 text-gray-600'
                    }
                  `}
                >
                  {counts[tab.key]}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* Survey list */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-black" />
          </div>
        ) : filteredSurveys.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <FileText className="mb-4 h-12 w-12 text-muted-foreground/50" />
              <p className="text-lg font-medium">
                {activeTab === 'all'
                  ? t.dashboard.noSurveysYet
                  : activeTab === 'favorites'
                  ? t.dashboard.noFavoriteSurveys
                  : t.dashboard.noTabSurveys.replace('{tab}', TABS.find(tb => tb.key === activeTab)?.label?.toLowerCase() || '')}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {activeTab === 'all'
                  ? t.dashboard.createFirstSurvey
                  : activeTab === 'favorites'
                  ? t.dashboard.starToFavorite
                  : activeTab === 'shared'
                  ? t.dashboard.noSharedSurveys
                  : t.dashboard.filterEmpty}
              </p>
              {activeTab !== 'shared' && activeTab !== 'favorites' && (
                <Button className="mt-4" onClick={() => setIsCreateOpen(true)}>
                  <Plus className="mr-1.5 h-4 w-4" />
                  {t.dashboard.newSurvey}
                </Button>
              )}
            </CardContent>
          </Card>
        ) : viewMode === 'grid' ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {paginatedSurveys.map(renderSurveyCard)}
          </div>
        ) : (
          <div className="space-y-2">
            {paginatedSurveys.map(renderSurveyRow)}
          </div>
        )}

        {/* Pagination */}
        {filteredSurveys.length > 0 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{t.common.show}</span>
              <select
                value={perPage}
                onChange={(e) => handlePerPageChange(Number(e.target.value))}
                className="h-8 rounded-md border bg-background px-2 text-sm"
              >
                {[6, 9, 12, 18, 24].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <span>{t.common.perPage}</span>
              <span className="ml-2 text-xs">
                ({filteredSurveys.length} {t.common.total})
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={page === currentPage ? 'default' : 'outline'}
                  size="sm"
                  className="h-8 w-8 p-0 text-xs"
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* Delete confirmation dialog */}
      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        title={t.dashboard.deleteSurvey}
        description={t.dashboard.deleteSurveyConfirm.replace('{title}', deleteTarget?.title || '')}
        loading={deleteMutation.isPending}
        cancelLabel={t.common.cancel}
        loadingLabel={t.dashboard.deleting}
        confirmLabel={t.dashboard.deleteSurvey}
      />
    </AppLayout>
  );
}
