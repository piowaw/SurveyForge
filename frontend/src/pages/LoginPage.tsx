// LoginPage

import { useState, useRef, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import AuthLayout from '@/features/auth/AuthLayout';
import { useTranslation } from '@/i18n';
import usePageTitle from '@/hooks/usePageTitle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import ReCAPTCHA from 'react-google-recaptcha';
import { RECAPTCHA_SITE_KEY } from '@/lib/constants';

type LoginForm = { email: string; password: string };

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  usePageTitle(t.pageTitles.login);
  const [error, setError] = useState('');
  const [remember, setRemember] = useState(true);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaRef = useRef<ReCAPTCHA>(null);

  // Recreated when language change
  const loginSchema = useMemo(() => z.object({
    email: z.string().email(t.login.invalidEmail),
    password: z.string().min(1, t.login.passwordRequired),
  }), [t]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  // Submit handler
  const onSubmit = async (data: LoginForm) => {
    if (!captchaToken) {
      setError(t.login.recaptchaRequired);
      return;
    }
    try {
      setError('');
      await login(data.email, data.password, remember);
      navigate('/dashboard');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || t.login.loginFailed);
      captchaRef.current?.reset();
      setCaptchaToken(null);
    }
  };

  return (
    <AuthLayout
      subtitle={t.login.title}
      footerText={t.login.noAccount}
      footerLinkText={t.login.createAccount}
      footerLinkTo="/register"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="space-y-2">
          <Label htmlFor="email">{t.common.email}</Label>
          <Input
            id="email"
            type="email"
            placeholder={t.login.emailPlaceholder}
            {...register('email')}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">{t.common.password}</Label>
          <Input
            id="password"
            type="password"
            placeholder={t.login.passwordPlaceholder}
            {...register('password')}
          />
          {errors.password && (
            <p className="text-sm text-destructive">{errors.password.message}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="remember"
            checked={remember}
            onCheckedChange={(checked) => setRemember(checked === true)}
          />
          <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">
            {t.login.rememberMe}
          </Label>
        </div>

        <div className="flex justify-start">
          <ReCAPTCHA
            ref={captchaRef}
            sitekey={RECAPTCHA_SITE_KEY}
            onChange={(token) => setCaptchaToken(token)}
            onExpired={() => setCaptchaToken(null)}
          />
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? t.login.signingIn : t.login.signIn}
        </Button>
      </form>
    </AuthLayout>
  );
}
