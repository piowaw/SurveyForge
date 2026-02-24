// SettingsTab

import { useTranslation } from '@/i18n';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import {
  X,
  User,
  Mail,
  KeyRound,
  Timer,
  ImagePlus,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Survey } from '@/types';

interface SettingsTabProps {
  survey: Survey;
  title: string;
  description: string;
  isAcceptingResponses: boolean;
  opensAt: string;
  closesAt: string;
  requireName: boolean;
  requireEmail: boolean;
  accessPassword: string;
  timeLimit: string;
  themeColor: string;
  bannerImage: string;
  showResponsesAfterSubmit: boolean;
  showCorrectAfterSubmit: boolean;
  oneQuestionPerPage: boolean;
  preventGoingBack: boolean;
  setTitle: (v: string) => void;
  setDescription: (v: string) => void;
  setIsAcceptingResponses: (v: boolean) => void;
  setOpensAt: (v: string) => void;
  setClosesAt: (v: string) => void;
  setRequireName: (v: boolean) => void;
  setRequireEmail: (v: boolean) => void;
  setAccessPassword: (v: string) => void;
  setTimeLimit: (v: string) => void;
  setThemeColor: (v: string) => void;
  setBannerImage: (v: string) => void;
  setShowResponsesAfterSubmit: (v: boolean) => void;
  setShowCorrectAfterSubmit: (v: boolean) => void;
  setOneQuestionPerPage: (v: boolean) => void;
  setPreventGoingBack: (v: boolean) => void;
  setTitleDirty: (v: boolean) => void;
  readOnly?: boolean;
}

export default function SettingsTab({
  title,
  description,
  isAcceptingResponses,
  opensAt,
  closesAt,
  requireName,
  requireEmail,
  accessPassword,
  timeLimit,
  themeColor,
  bannerImage,
  setTitle,
  setDescription,
  setIsAcceptingResponses,
  setOpensAt,
  setClosesAt,
  setRequireName,
  setRequireEmail,
  setAccessPassword,
  setTimeLimit,
  setThemeColor,
  setBannerImage,
  showResponsesAfterSubmit,
  setShowResponsesAfterSubmit,
  showCorrectAfterSubmit,
  setShowCorrectAfterSubmit,
  oneQuestionPerPage,
  setOneQuestionPerPage,
  preventGoingBack,
  setPreventGoingBack,
  setTitleDirty,
  readOnly = false,
}: SettingsTabProps) {
  const { t } = useTranslation();
  return (
    <fieldset disabled={readOnly} className={readOnly ? 'opacity-60 pointer-events-none' : ''}>
    <div className="space-y-8">
      {/* General */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold">{t.survey.general}</h3>
        <div className="space-y-2">
          <Label>{t.survey.titleLabel} <span className="text-destructive">*</span></Label>
          <Input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setTitleDirty(true);
            }}
            placeholder={t.survey.titlePlaceholder}
          />
        </div>
        <div className="space-y-2">
          <Label>{t.survey.descriptionLabel}</Label>
          <Textarea
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              setTitleDirty(true);
            }}
            placeholder={t.survey.descriptionPlaceholder}
          />
        </div>
        <div className="space-y-2">
          <Label>{t.survey.bannerImage}</Label>
          {bannerImage ? (
            <div className="relative">
              <img
                src={bannerImage}
                alt="Banner preview"
                className="w-full max-h-48 object-cover rounded-md border"
              />
              <button
                type="button"
                onClick={() => setBannerImage('')}
                className="absolute top-2 right-2 bg-background/80 backdrop-blur rounded-full p-1 hover:bg-background"
              >
                <X className="h-4 w-4 text-destructive" />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-md cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors">
              <ImagePlus className="h-8 w-8 text-muted-foreground mb-2" />
              <span className="text-sm text-muted-foreground">{t.survey.clickToUpload}</span>
              <span className="text-xs text-muted-foreground mt-1">{t.survey.imageSize}</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 2 * 1024 * 1024) {
                    toast.error(t.survey.imageTooLarge);
                    return;
                  }
                  const reader = new FileReader();
                  reader.onload = () => {
                    if (typeof reader.result === 'string') {
                      setBannerImage(reader.result);
                    }
                  };
                  reader.readAsDataURL(file);
                }}
              />
            </label>
          )}
        </div>
      </section>

      <Separator />

      {/* Theme */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold">{t.survey.theme}</h3>
        <p className="text-sm text-muted-foreground -mt-2">{t.survey.themeDescription}</p>
        <div className="flex flex-wrap gap-3">
          {[
            { value: '', color: 'bg-zinc-900' },
            { value: 'blue', color: 'bg-blue-600' },
            { value: 'green', color: 'bg-green-600' },
            { value: 'purple', color: 'bg-purple-600' },
            { value: 'rose', color: 'bg-rose-600' },
            { value: 'orange', color: 'bg-orange-500' },
            { value: 'teal', color: 'bg-teal-600' },
          ].map((themeOpt) => (
            <button
              key={themeOpt.value}
              type="button"
              onClick={() => setThemeColor(themeOpt.value)}
              className={`h-6 w-6 rounded-full ${themeOpt.color} transition-all ${
                themeColor === themeOpt.value ? 'ring-2 ring-offset-2 ring-foreground scale-110' : 'hover:scale-105'
              }`}
            />
          ))}
        </div>
      </section>

      <Separator />

      {/* Availability */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold">{t.survey.availability}</h3>

        {/* Accepting toggle */}
        <div className="flex items-center justify-between">
          <div>
            <Label>{t.survey.acceptResponses}</Label>
            <p className="text-sm text-muted-foreground">
              {isAcceptingResponses ? t.survey.surveyOpen : t.survey.surveyClosed}
            </p>
          </div>
          <Switch
            checked={isAcceptingResponses}
            onCheckedChange={setIsAcceptingResponses}
          />
        </div>

        {/* Schedule */}
        <div className="space-y-3">
          <Label>{t.survey.schedule}</Label>
          <p className="text-sm text-muted-foreground -mt-1">
            {t.survey.scheduleDescription}
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{t.survey.opensAt}</Label>
              <Input
                type="datetime-local"
                value={opensAt}
                onChange={(e) => setOpensAt(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t.survey.closesAt}</Label>
              <Input
                type="datetime-local"
                value={closesAt}
                onChange={(e) => setClosesAt(e.target.value)}
                min={opensAt || undefined}
              />
            </div>
          </div>
          {(opensAt || closesAt) && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-destructive hover:text-destructive"
              onClick={() => { setOpensAt(''); setClosesAt(''); }}
            >
              <X className="mr-1 h-3 w-3" />
              {t.survey.clearSchedule}
            </Button>
          )}
        </div>
      </section>

      <Separator />

      {/* Respondent Information */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold">{t.survey.respondentInfo}</h3>
        <p className="text-sm text-muted-foreground -mt-2">
          {t.survey.respondentInfoDescription}
        </p>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Checkbox
              id="require-name"
              checked={requireName}
              onCheckedChange={(v) => setRequireName(v === true)}
            />
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="require-name" className="cursor-pointer">{t.survey.requireName}</Label>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Checkbox
              id="require-email"
              checked={requireEmail}
              onCheckedChange={(v) => setRequireEmail(v === true)}
            />
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="require-email" className="cursor-pointer">{t.survey.requireEmail}</Label>
            </div>
          </div>
        </div>
      </section>

      <Separator />

      {/* Access Password */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold">{t.survey.accessPassword}</h3>
        <p className="text-sm text-muted-foreground -mt-2">
          {t.survey.accessPasswordDescription}
        </p>

        <div className="space-y-2">
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              value={accessPassword}
              onChange={(e) => setAccessPassword(e.target.value)}
              placeholder={t.survey.noPasswordSet}
              className="pl-10"
            />
          </div>
          {accessPassword && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-destructive hover:text-destructive"
              onClick={() => setAccessPassword('')}
            >
              <X className="mr-1 h-3 w-3" />
              {t.survey.removePassword}
            </Button>
          )}
        </div>
      </section>

      <Separator />

      {/* Time Limit */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold">{t.survey.timeLimit}</h3>
        <p className="text-sm text-muted-foreground -mt-2">
          {t.survey.timeLimitDescription}
        </p>

        <div className="space-y-2">
          <div className="relative">
            <Timer className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="number"
              min="1"
              max="1440"
              value={timeLimit}
              onChange={(e) => setTimeLimit(e.target.value)}
              placeholder={t.survey.noTimeLimit}
              className="pl-10"
            />
          </div>
          {timeLimit && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-destructive hover:text-destructive"
              onClick={() => setTimeLimit('')}
            >
              <X className="mr-1 h-3 w-3" />
              {t.survey.removeTimeLimit}
            </Button>
          )}
        </div>
      </section>

      <Separator />

      {/* Question Display */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold">{t.survey.questionDisplay}</h3>
        <p className="text-sm text-muted-foreground -mt-2">
          {t.survey.questionDisplayDescription}
        </p>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>{t.survey.oneQuestionPerPage}</Label>
              <p className="text-sm text-muted-foreground">
                {t.survey.oneQuestionPerPageDescription}
              </p>
            </div>
            <Switch
              checked={oneQuestionPerPage}
              onCheckedChange={(v) => {
                setOneQuestionPerPage(v);
                if (!v) setPreventGoingBack(false);
              }}
            />
          </div>

          {oneQuestionPerPage && (
            <div className="flex items-center justify-between">
              <div>
                <Label>{t.survey.preventGoingBack}</Label>
                <p className="text-sm text-muted-foreground">
                  {t.survey.preventGoingBackDescription}
                </p>
              </div>
              <Switch
                checked={preventGoingBack}
                onCheckedChange={setPreventGoingBack}
              />
            </div>
          )}
        </div>
      </section>

      <Separator />

      {/* After Submission */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold">{t.survey.afterSubmission}</h3>
        <p className="text-sm text-muted-foreground -mt-2">
          {t.survey.afterSubmissionDescription}
        </p>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>{t.survey.showLockedSurvey}</Label>
              <p className="text-sm text-muted-foreground">
                {t.survey.showLockedSurveyDescription}
              </p>
            </div>
            <Switch
              checked={showResponsesAfterSubmit}
              onCheckedChange={(v) => {
                setShowResponsesAfterSubmit(v);
                if (!v) setShowCorrectAfterSubmit(false);
              }}
            />
          </div>

          {showResponsesAfterSubmit && (
            <div className="flex items-center justify-between">
              <div>
                <Label>{t.survey.showCorrectAnswers}</Label>
                <p className="text-sm text-muted-foreground">
                  {t.survey.showCorrectAnswersDescription}
                </p>
              </div>
              <Switch
                checked={showCorrectAfterSubmit}
                onCheckedChange={setShowCorrectAfterSubmit}
              />
            </div>
          )}
        </div>
      </section>
    </div>
    </fieldset>
  );
}
