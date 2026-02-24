/**
 * QuestionInput — Renders the appropriate input widget for a given question type.
 *
 * Extracted from PublicSurveyPage to eliminate duplication and provide a
 * single, reusable component for all 8 question types:
 *   SHORT_TEXT, LONG_TEXT, NUMBER, FILE, SINGLE_CHOICE, MULTI_CHOICE, RANKING, CODE
 */
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { ArrowUp, ArrowDown, Paperclip } from 'lucide-react';
import type { Question } from '@/types';
import type { TranslationKeys } from '@/i18n';

export interface QuestionInputProps {
  /** The question definition (type, options, etc.). */
  question: Question;
  /** Current answer value for this question. */
  value: string | string[] | undefined;
  /** Callback when a text-like value changes (SHORT_TEXT, LONG_TEXT, NUMBER, CODE). */
  onTextChange: (questionId: number, value: string) => void;
  /** Callback for single-choice radio selection. */
  onSingleChoice: (questionId: number, value: string) => void;
  /** Callback for multi-choice checkbox toggle. */
  onMultiChoice: (questionId: number, option: string, checked: boolean) => void;
  /** Direct setter for the answers map (used by FILE upload and RANKING reorder). */
  onSetAnswer: (questionId: number, value: string | string[]) => void;
  /** Remove an answer entirely (used by FILE remove). */
  onRemoveAnswer: (questionId: number) => void;
  /** Active translation strings. */
  t: TranslationKeys;
  /** Whether the input is disabled (e.g. post-submit review). */
  disabled?: boolean;
}

/**
 * Renders the appropriate input widget based on `question.type`.
 */
export default function QuestionInput({
  question: q,
  value,
  onTextChange,
  onSingleChoice,
  onMultiChoice,
  onSetAnswer,
  onRemoveAnswer,
  t,
  disabled = false,
}: QuestionInputProps) {
  if (q.type === 'SHORT_TEXT') {
    return (
      <Input
        placeholder={t.publicSurvey.yourAnswer}
        value={(value as string) || ''}
        onChange={(e) => onTextChange(q.id, e.target.value)}
        disabled={disabled}
      />
    );
  }

  if (q.type === 'LONG_TEXT') {
    return (
      <Textarea
        placeholder={t.publicSurvey.yourAnswer}
        value={(value as string) || ''}
        onChange={(e) => onTextChange(q.id, e.target.value)}
        disabled={disabled}
      />
    );
  }

  if (q.type === 'NUMBER') {
    return (
      <Input
        type="number"
        placeholder={t.publicSurvey.enterNumber}
        value={(value as string) || ''}
        onChange={(e) => onTextChange(q.id, e.target.value)}
        disabled={disabled}
      />
    );
  }

  if (q.type === 'FILE') {
    return (
      <div>
        {value ? (
          <div className="flex items-center gap-2">
            <Paperclip className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{t.publicSurvey.fileAttached}</span>
            {!disabled && (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => onRemoveAnswer(q.id)}
              >
                {t.publicSurvey.remove}
              </Button>
            )}
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed rounded-md cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors">
            <Paperclip className="h-6 w-6 text-muted-foreground mb-1" />
            <span className="text-sm text-muted-foreground">{t.publicSurvey.clickToUploadFile}</span>
            <input
              type="file"
              className="hidden"
              disabled={disabled}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (file.size > 5 * 1024 * 1024) { alert(t.publicSurvey.fileTooLarge); return; }
                const reader = new FileReader();
                reader.onload = () => {
                  if (typeof reader.result === 'string') {
                    onSetAnswer(q.id, reader.result);
                  }
                };
                reader.readAsDataURL(file);
              }}
            />
          </label>
        )}
      </div>
    );
  }

  if (q.type === 'SINGLE_CHOICE' && q.options) {
    return (
      <RadioGroup
        value={(value as string) || ''}
        onValueChange={(v) => onSingleChoice(q.id, v)}
        disabled={disabled}
      >
        {q.options.map((opt) => (
          <div key={opt} className="flex items-center space-x-2">
            <RadioGroupItem value={opt} id={`q${q.id}-${opt}`} />
            <Label htmlFor={`q${q.id}-${opt}`}>{opt}</Label>
          </div>
        ))}
      </RadioGroup>
    );
  }

  if (q.type === 'MULTI_CHOICE' && q.options) {
    return (
      <div className="space-y-2">
        {q.options.map((opt) => (
          <div key={opt} className="flex items-center space-x-2">
            <Checkbox
              id={`q${q.id}-${opt}`}
              checked={((value as string[]) || []).includes(opt)}
              onCheckedChange={(checked) => onMultiChoice(q.id, opt, checked === true)}
              disabled={disabled}
            />
            <Label htmlFor={`q${q.id}-${opt}`}>{opt}</Label>
          </div>
        ))}
      </div>
    );
  }

  if (q.type === 'RANKING' && q.options) {
    const items = (value as string[]) || q.options;
    return (
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={item} className="flex items-center gap-2 rounded-md border px-3 py-2">
            <span className="text-sm font-medium text-muted-foreground w-6">{i + 1}.</span>
            <span className="flex-1 text-sm">{item}</span>
            {!disabled && (
              <div className="flex gap-1">
                <button
                  type="button"
                  disabled={i === 0}
                  className="p-1 rounded hover:bg-muted disabled:opacity-30"
                  onClick={() => {
                    const newArr = [...items];
                    [newArr[i - 1], newArr[i]] = [newArr[i], newArr[i - 1]];
                    onSetAnswer(q.id, newArr);
                  }}
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  disabled={i === items.length - 1}
                  className="p-1 rounded hover:bg-muted disabled:opacity-30"
                  onClick={() => {
                    const newArr = [...items];
                    [newArr[i], newArr[i + 1]] = [newArr[i + 1], newArr[i]];
                    onSetAnswer(q.id, newArr);
                  }}
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        ))}
        <p className="text-xs text-muted-foreground">{t.publicSurvey.useArrowsToArrange}</p>
      </div>
    );
  }

  if (q.type === 'CODE') {
    return (
      <textarea
        className="w-full min-h-[120px] rounded-md border bg-muted/30 px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        placeholder={t.publicSurvey.writeCodeHere}
        value={(value as string) || ''}
        onChange={(e) => onTextChange(q.id, e.target.value)}
        spellCheck={false}
        disabled={disabled}
      />
    );
  }

  return null;
}
