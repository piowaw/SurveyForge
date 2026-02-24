// AdminPanelPage

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { useTranslation } from '@/i18n';
import usePageTitle from '@/hooks/usePageTitle';
import { adminApi, type AdminUser, type AdminSurvey } from '@/api/admin';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import ConfirmDeleteDialog from '@/components/ConfirmDeleteDialog';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  ExternalLink,
  Shield,
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';

// Per page in tables
const PER_PAGE = 10;

// Format date
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// Pagination buttons
function PaginationBar({
  page,
  totalPages,
  total,
  onPrev,
  onNext,
  showingLabel,
  ofLabel,
}: {
  page: number;
  totalPages: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  showingLabel: string;
  ofLabel: string;
}) {
  return (
    <div className="flex items-center justify-between pt-2">
      <p className="text-sm text-muted-foreground">
        {showingLabel} {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, total)} {ofLabel} {total}
      </p>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={onPrev}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm px-2">{page} / {totalPages}</span>
        <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={onNext}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// Edit user
function EditUserDialog({
  user,
  open,
  onClose,
  onSaved,
  currentUserId,
}: {
  user: AdminUser | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  currentUserId: number;
}) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setIsAdmin(user.is_admin);
      setPassword('');
      setError('');
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    try {
      setError('');
      setSaving(true);
      const data: Record<string, unknown> = {};
      if (name !== user.name) data.name = name;
      if (email !== user.email) data.email = email;
      if (isAdmin !== user.is_admin) data.is_admin = isAdmin;
      if (password) data.password = password;

      if (Object.keys(data).length === 0) {
        onClose();
        return;
      }

      await adminApi.updateUser(user.id, data as Parameters<typeof adminApi.updateUser>[1]);
      toast.success(`User "${name}" updated`);
      onSaved();
      onClose();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      const serverErrors = axiosErr.response?.data?.errors;
      if (serverErrors) {
        setError(Object.values(serverErrors).flat().join(' '));
      } else {
        setError(axiosErr.response?.data?.message || 'Failed to update user');
      }
    } finally {
      setSaving(false);
    }
  };

  const isSelf = user?.id === currentUserId;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t.admin.editUser}</DialogTitle>
          <DialogDescription>{t.admin.editUserDescription}</DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">{t.common.name}</Label>
            <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-email">{t.common.email}</Label>
            <Input id="edit-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t.admin.administrator}</Label>
              <p className="text-xs text-muted-foreground">
                {isSelf ? t.admin.cannotRemoveOwnAdmin : t.admin.grantAdminPrivileges}
              </p>
            </div>
            <Switch checked={isAdmin} onCheckedChange={setIsAdmin} disabled={isSelf} />
          </div>
          <Separator />
          <div className="space-y-2">
            <Label htmlFor="edit-password">{t.account.newPassword}</Label>
            <Input
              id="edit-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t.admin.newPasswordPlaceholder}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            {t.common.cancel}
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? t.account.saving : t.account.saveChanges}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminPanelPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  usePageTitle(t.pageTitles.admin);

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [surveys, setSurveys] = useState<AdminSurvey[]>([]);
  const [loading, setLoading] = useState(true);

  const [userSearch, setUserSearch] = useState('');
  const [surveySearch, setSurveySearch] = useState('');
  const [userPage, setUserPage] = useState(1);
  const [surveyPage, setSurveyPage] = useState(1);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<AdminUser | null>(null);
  const [deleteUserLoading, setDeleteUserLoading] = useState(false);
  const [deletingSurvey, setDeletingSurvey] = useState<AdminSurvey | null>(null);
  const [deleteSurveyLoading, setDeleteSurveyLoading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [u, s] = await Promise.all([adminApi.getUsers(), adminApi.getSurveys()]);
      setUsers(u);
      setSurveys(s);
    } catch {
      toast.error(t.admin.failedLoadData);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Delete user
  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    try {
      setDeleteUserLoading(true);
      await adminApi.deleteUser(deletingUser.id);
      toast.success(t.admin.userDeleted.replace('{name}', deletingUser.name));
      setDeletingUser(null);
      fetchData();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      toast.error(axiosErr.response?.data?.message || t.admin.failedDeleteUser);
    } finally {
      setDeleteUserLoading(false);
    }
  };

  // Delete survey
  const handleDeleteSurvey = async () => {
    if (!deletingSurvey) return;
    try {
      setDeleteSurveyLoading(true);
      await adminApi.deleteSurvey(deletingSurvey.id);
      toast.success(t.admin.surveyDeleted.replace('{title}', deletingSurvey.title));
      setDeletingSurvey(null);
      fetchData();
    } catch {
      toast.error(t.admin.failedDeleteSurvey);
    } finally {
      setDeleteSurveyLoading(false);
    }
  };

  // Filter and paginate users
  const { filtered: filteredUsers, paginated: paginatedUsers, totalPages: totalUserPages } = useMemo(() => {
    const q = userSearch.toLowerCase();
    const filtered = users.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
    const paginated = filtered.slice((userPage - 1) * PER_PAGE, userPage * PER_PAGE);
    return { filtered, paginated, totalPages };
  }, [users, userSearch, userPage]);

  // Filter and paginate surveys
  const { filtered: filteredSurveys, paginated: paginatedSurveys, totalPages: totalSurveyPages } = useMemo(() => {
    const q = surveySearch.toLowerCase();
    const filtered = surveys.filter((s) =>
      s.title.toLowerCase().includes(q) ||
      (s.owner?.name || '').toLowerCase().includes(q) ||
      (s.owner?.email || '').toLowerCase().includes(q),
    );
    const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
    const paginated = filtered.slice((surveyPage - 1) * PER_PAGE, surveyPage * PER_PAGE);
    return { filtered, paginated, totalPages };
  }, [surveys, surveySearch, surveyPage]);

  // Admin only access

  if (!user?.is_admin) {
    return (
      <AppLayout>
        <main className="mx-auto max-w-6xl px-4 py-8">
          <Alert variant="destructive">
            <AlertDescription>{t.admin.noPermission}</AlertDescription>
          </Alert>
        </main>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
              <Shield className="h-6 w-6" />
              {t.admin.title}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {t.admin.subtitle}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Users section */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    {t.admin.users}
                    <Badge variant="secondary" className="ml-1">
                      {users.length}
                    </Badge>
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t.admin.usersDescription}
                  </p>
                </div>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t.admin.searchUsers}
                    className="pl-9"
                    value={userSearch}
                    onChange={(e) => { setUserSearch(e.target.value); setUserPage(1); }}
                  />
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">{t.admin.id}</TableHead>
                      <TableHead>{t.common.name}</TableHead>
                      <TableHead>{t.common.email}</TableHead>
                      <TableHead className="text-center">{t.admin.role}</TableHead>
                      <TableHead className="text-center">{t.admin.surveys}</TableHead>
                      <TableHead>{t.admin.joined}</TableHead>
                      <TableHead className="text-right">{t.common.actions}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          {userSearch ? t.admin.noUsersMatch : t.admin.noUsersFound}
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedUsers.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {u.id}
                          </TableCell>
                          <TableCell className="font-medium">{u.name}</TableCell>
                          <TableCell className="text-muted-foreground">{u.email}</TableCell>
                          <TableCell className="text-center">
                            {u.is_admin ? (
                              <Badge className="bg-violet-100 text-violet-700 hover:bg-violet-100">
                                {t.admin.adminRole}
                              </Badge>
                            ) : (
                              <Badge variant="secondary">{t.admin.userRole}</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-center">{u.owned_surveys_count}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {fmtDate(u.created_at)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingUser(u)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-600"
                                onClick={() => setDeletingUser(u)}
                                disabled={u.id === user.id}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              {filteredUsers.length > PER_PAGE && (
                <PaginationBar
                  page={userPage}
                  totalPages={totalUserPages}
                  total={filteredUsers.length}
                  onPrev={() => setUserPage((p) => p - 1)}
                  onNext={() => setUserPage((p) => p + 1)}
                  showingLabel={t.admin.showing}
                  ofLabel={t.admin.of}
                />
              )}
            </section>

            <Separator />

            {/* Surveys section */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    {t.admin.surveysSection}
                    <Badge variant="secondary" className="ml-1">
                      {surveys.length}
                    </Badge>
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t.admin.surveysDescription}
                  </p>
                </div>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t.admin.searchSurveys}
                    className="pl-9"
                    value={surveySearch}
                    onChange={(e) => { setSurveySearch(e.target.value); setSurveyPage(1); }}
                  />
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">{t.admin.id}</TableHead>
                      <TableHead>{t.survey.titleLabel}</TableHead>
                      <TableHead>{t.admin.owner}</TableHead>
                      <TableHead className="text-center">{t.admin.status}</TableHead>
                      <TableHead className="text-center">{t.admin.questionsCol}</TableHead>
                      <TableHead className="text-center">{t.admin.responses}</TableHead>
                      <TableHead>{t.admin.created}</TableHead>
                      <TableHead className="text-right">{t.common.actions}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSurveys.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          {surveySearch ? t.admin.noSurveysMatch : t.admin.noSurveysFound}
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedSurveys.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {s.id}
                          </TableCell>
                          <TableCell className="font-medium max-w-[200px] truncate">
                            {s.title}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {s.owner?.name || '—'}
                          </TableCell>
                          <TableCell className="text-center">
                            {s.status === 'published' ? (
                              <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                                {t.dashboard.published}
                              </Badge>
                            ) : (
                              <Badge variant="secondary">{t.dashboard.draft}</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-center">{s.questions_count}</TableCell>
                          <TableCell className="text-center">{s.responses_count}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {fmtDate(s.created_at)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/surveys/${s.id}`)}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-600"
                                onClick={() => setDeletingSurvey(s)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              {filteredSurveys.length > PER_PAGE && (
                <PaginationBar
                  page={surveyPage}
                  totalPages={totalSurveyPages}
                  total={filteredSurveys.length}
                  onPrev={() => setSurveyPage((p) => p - 1)}
                  onNext={() => setSurveyPage((p) => p + 1)}
                  showingLabel={t.admin.showing}
                  ofLabel={t.admin.of}
                />
              )}
            </section>
          </div>
        )}
      </main>

      {/* Edit user dialog */}
      <EditUserDialog
        user={editingUser}
        open={!!editingUser}
        onClose={() => setEditingUser(null)}
        onSaved={fetchData}
        currentUserId={user.id}
      />

      {/* Delete user dialog */}
      <ConfirmDeleteDialog
        open={!!deletingUser}
        onClose={() => setDeletingUser(null)}
        onConfirm={handleDeleteUser}
        title={t.admin.deleteUser}
        description={t.admin.deleteUserConfirm.replace('{name}', deletingUser?.name || '')}
        loading={deleteUserLoading}
        cancelLabel={t.common.cancel}
        loadingLabel={t.dashboard.deleting}
        confirmLabel={t.common.delete}
      />

      {/* Delete survey dialog */}
      <ConfirmDeleteDialog
        open={!!deletingSurvey}
        onClose={() => setDeletingSurvey(null)}
        onConfirm={handleDeleteSurvey}
        title={t.admin.deleteSurvey}
        description={t.admin.deleteSurveyConfirm.replace('{title}', deletingSurvey?.title || '')}
        loading={deleteSurveyLoading}
        cancelLabel={t.common.cancel}
        loadingLabel={t.dashboard.deleting}
        confirmLabel={t.common.delete}
      />
    </AppLayout>
  );
}
