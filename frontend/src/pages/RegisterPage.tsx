// RegisterPage
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Check } from 'lucide-react';
import ReCAPTCHA from 'react-google-recaptcha';
import { RECAPTCHA_SITE_KEY } from '@/lib/constants';
import PasswordStrengthBar from '@/components/PasswordStrengthBar';

type RegisterForm = {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
};

export default function RegisterPage() {
  const { register: authRegister } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  usePageTitle(t.pageTitles.register);
  const [error, setError] = useState('');
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaRef = useRef<ReCAPTCHA>(null);

  // Recreated when language change
  const registerSchema = useMemo(() => z
    .object({
      name: z.string().min(1, t.register.nameRequired).max(255),
      email: z.string().email(t.login.invalidEmail),
      password: z.string().min(8, t.register.passwordMinLength),
      password_confirmation: z.string().min(1, t.register.confirmRequired),
    })
    .refine((data) => data.password === data.password_confirmation, {
      message: t.register.passwordsMismatch,
      path: ['password_confirmation'],
    }), [t]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const passwordValue = watch('password', '');
  const confirmValue = watch('password_confirmation', '');

  // Submit handler
  const onSubmit = async (data: RegisterForm) => {
    if (!captchaToken) {
      setError(t.login.recaptchaRequired);
      return;
    }
    try {
      setError('');
      await authRegister(data.name, data.email, data.password);
      navigate('/dashboard');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      const serverErrors = axiosErr.response?.data?.errors;
      if (serverErrors) {
        setError(Object.values(serverErrors).flat().join(' '));
      } else {
        setError(axiosErr.response?.data?.message || t.register.registrationFailed);
      }
      captchaRef.current?.reset();
      setCaptchaToken(null);
    }
  };

  return (
    <AuthLayout
      subtitle={t.register.title}
      footerText={t.register.alreadyHaveAccount}
      footerLinkText={t.register.signIn}
      footerLinkTo="/login"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="space-y-2">
          <Label htmlFor="name">{t.common.name}</Label>
          <Input id="name" placeholder={t.register.namePlaceholder} {...register('name')} />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>
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
            placeholder={t.register.passwordPlaceholder}
            {...register('password')}
          />
          {errors.password && (
            <p className="text-sm text-destructive">{errors.password.message}</p>
          )}
          <PasswordStrengthBar password={passwordValue} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password_confirmation">{t.register.confirmPassword}</Label>
          <div className="relative">
            <Input
              id="password_confirmation"
              type="password"
              placeholder={t.register.confirmPlaceholder}
              {...register('password_confirmation')}
            />
            {confirmValue && passwordValue === confirmValue && (
              <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
            )}
          </div>
          {errors.password_confirmation && (
            <p className="text-sm text-destructive">{errors.password_confirmation.message}</p>
          )}
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
          {isSubmitting ? t.register.creatingAccount : t.register.createAccount}
        </Button>
      </form>
    </AuthLayout>
  );
}
