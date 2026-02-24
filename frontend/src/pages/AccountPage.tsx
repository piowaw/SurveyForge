// AccountPage

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { useTranslation } from '@/i18n';
import usePageTitle from '@/hooks/usePageTitle';
import { authApi } from '@/api/auth';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { ArrowLeft, Check, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import PasswordStrengthBar from '@/components/PasswordStrengthBar';

export default function AccountPage() {
  const { user, refreshUser, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  usePageTitle(t.pageTitles.account);

  // Profile form
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [profileError, setProfileError] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);

  // Delete account
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const profileDirty = name !== user?.name || email !== user?.email;

  const handleProfileSave = async () => {
    try {
      setProfileError('');
      setProfileSaving(true);
      const data: { name?: string; email?: string } = {};
      if (name !== user?.name) data.name = name;
      if (email !== user?.email) data.email = email;
      await authApi.updateProfile(data);
      await refreshUser();
      toast.success(t.account.profileUpdated);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      const serverErrors = axiosErr.response?.data?.errors;
      if (serverErrors) {
        setProfileError(Object.values(serverErrors).flat().join(' '));
      } else {
        setProfileError(axiosErr.response?.data?.message || t.account.failedUpdateProfile);
      }
    } finally {
      setProfileSaving(false);
    }
  };

  // Change password
  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      setPasswordError(t.account.passwordsMismatch);
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError(t.account.passwordMinLength);
      return;
    }
    try {
      setPasswordError('');
      setPasswordSaving(true);
      await authApi.changePassword({
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success(t.account.passwordChanged);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      const serverErrors = axiosErr.response?.data?.errors;
      if (serverErrors) {
        setPasswordError(Object.values(serverErrors).flat().join(' '));
      } else {
        setPasswordError(axiosErr.response?.data?.message || t.account.failedChangePassword);
      }
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <AppLayout>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">{t.account.title}</h2>
            <p className="text-sm text-muted-foreground mt-1">{t.account.subtitle}</p>
          </div>
        </div>

        <div className="space-y-8">
          {/* Profile Information */}
          <section className="space-y-4">
            <h3 className="text-lg font-semibold">{t.account.profileInfo}</h3>
            <p className="text-sm text-muted-foreground -mt-2">{t.account.profileDescription}</p>

            {profileError && (
              <Alert variant="destructive">
                <AlertDescription>{profileError}</AlertDescription>
              </Alert>
            )}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">{t.common.name}</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t.account.namePlaceholder}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t.common.email}</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.account.emailPlaceholder}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                onClick={handleProfileSave}
                disabled={!profileDirty || profileSaving}
              >
                {profileSaving ? t.account.saving : t.account.saveChanges}
              </Button>
            </div>
          </section>

          <Separator />

          {/* Change Password */}
          <section className="space-y-4">
            <h3 className="text-lg font-semibold">{t.account.changePassword}</h3>
            <p className="text-sm text-muted-foreground -mt-2">{t.account.changePasswordDescription}</p>

            {passwordError && (
              <Alert variant="destructive">
                <AlertDescription>{passwordError}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="current-password">{t.account.currentPassword}</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="new-password">{t.account.newPassword}</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t.register.passwordPlaceholder}
              />
              <PasswordStrengthBar password={newPassword} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">{t.account.confirmNewPassword}</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                />
                {confirmPassword && newPassword === confirmPassword && (
                  <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                )}
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-destructive">{t.account.passwordsMismatch}</p>
              )}
            </div>
            <div className="flex justify-end">
              <Button
                onClick={handlePasswordChange}
                disabled={
                  !currentPassword ||
                  !newPassword ||
                  !confirmPassword ||
                  newPassword !== confirmPassword ||
                  passwordSaving
                }
              >
                {passwordSaving ? t.account.changingPassword : t.account.changePasswordBtn}
              </Button>
            </div>
          </section>

          <Separator />

          {/* Danger Zone */}
          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-red-600">{t.account.dangerZone}</h3>
            <p className="text-sm text-muted-foreground -mt-2">
              {t.account.dangerDescription}
            </p>
            <Button
              variant="destructive"
              onClick={() => { setDeleteDialogOpen(true); setDeletePassword(''); setDeleteError(''); }}
            >
              <Trash2 className="h-4 w-4 mr-1.5" />
              {t.account.deleteAccount}
            </Button>
            <p className="text-xs text-muted-foreground">
              {t.account.accountCreated} {user?.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
            </p>
          </section>
        </div>
      </main>

      {/* Delete account confirmation */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.account.deleteAccountTitle}</DialogTitle>
            <DialogDescription>
              {t.account.deleteAccountConfirm}
            </DialogDescription>
          </DialogHeader>
          {deleteError && (
            <Alert variant="destructive">
              <AlertDescription>{deleteError}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="delete-password">{t.common.password}</Label>
            <Input
              id="delete-password"
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              placeholder={t.account.deletePasswordPlaceholder}
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              {t.common.cancel}
            </Button>
            <Button
              variant="destructive"
              disabled={!deletePassword || deleting}
              onClick={async () => {
                try {
                  setDeleteError('');
                  setDeleting(true);
                  await authApi.deleteAccount({ password: deletePassword });
                  await logout();
                  navigate('/login');
                  toast.success(t.account.accountDeleted);
                } catch (err: unknown) {
                  const axiosErr = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
                  const serverErrors = axiosErr.response?.data?.errors;
                  if (serverErrors) {
                    setDeleteError(Object.values(serverErrors).flat().join(' '));
                  } else {
                    setDeleteError(axiosErr.response?.data?.message || t.account.failedDeleteAccount);
                  }
                } finally {
                  setDeleting(false);
                }
              }}
            >
              {deleting ? t.account.deletingAccount : t.account.deleteMyAccount}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
