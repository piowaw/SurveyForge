// PasswordStrengthBar

import { useMemo } from 'react';
import { useTranslation } from '@/i18n';

interface PasswordStrengthBarProps {
  password: string;
}

export default function PasswordStrengthBar({ password }: PasswordStrengthBarProps) {
  const { t } = useTranslation();
  const strength = useMemo(() => {
    if (!password) return { score: 0, label: '', color: '' };

    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    if (score <= 1) return { score: 1, label: t.register.strengthWeak, color: 'bg-red-500' };
    if (score <= 2) return { score: 2, label: t.register.strengthFair, color: 'bg-orange-500' };
    if (score <= 3) return { score: 3, label: t.register.strengthGood, color: 'bg-yellow-500' };
    if (score <= 4) return { score: 4, label: t.register.strengthStrong, color: 'bg-green-500' };
    return { score: 5, label: t.register.strengthVeryStrong, color: 'bg-emerald-500' };
  }, [password, t]);

  if (!password) return null;

  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i <= strength.score ? strength.color : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        {t.register.passwordStrength}: <span className="font-medium">{strength.label}</span>
      </p>
    </div>
  );
}
