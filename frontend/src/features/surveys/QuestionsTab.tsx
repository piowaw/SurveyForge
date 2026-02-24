// QuestionsTab

import { useState } from 'react';
import { useTranslation } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  Plus,
  Trash2,
  X,
  ImagePlus,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { needsOptions, getTypeLabel, getTypeLabels, QUESTION_TYPES } from '@/lib/questionTypeUtils';
import SortableQuestionCard from './SortableQuestionCard';
import type { Question, QuestionType, Survey, UpdateQuestionPayload } from '@/types';

interface QuestionsTabProps {
  survey: Survey;
  surveyId: number;
  newQuestionOpen: boolean;
  setNewQuestionOpen: (v: boolean) => void;
  newQType: QuestionType;
  setNewQType: (v: QuestionType) => void;
  newQText: string;
  setNewQText: (v: string) => void;
  newQDescription: string;
  setNewQDescription: (v: string) => void;
  newQBannerImage: string;
  setNewQBannerImage: (v: string) => void;
  newQRequired: boolean;
  setNewQRequired: (v: boolean) => void;
  newQOptions: string[];
  setNewQOptions: (v: string[]) => void;
  newQCorrectAnswer: string;
  setNewQCorrectAnswer: (v: string) => void;
  newQHasCorrectAnswer: boolean;
  setNewQHasCorrectAnswer: (v: boolean) => void;
  handleAddQuestion: () => void;
  addQuestionMutation: { isPending: boolean };
  deleteQuestionMutation: { mutate: (id: number) => void };
  updateQuestionMutation: { mutate: (args: { questionId: number; data: UpdateQuestionPayload }) => void; isPending: boolean };
  reorderMutation: { mutate: (order: number[]) => void };
  readOnly?: boolean;
  canDelete?: boolean;
}

export default function QuestionsTab({
  survey,
  newQuestionOpen,
  setNewQuestionOpen,
  newQType,
  setNewQType,
  newQText,
  setNewQText,
  newQDescription,
  setNewQDescription,
  newQBannerImage,
  setNewQBannerImage,
  newQRequired,
  setNewQRequired,
  newQOptions,
  setNewQOptions,
  newQCorrectAnswer,
  setNewQCorrectAnswer,
  newQHasCorrectAnswer,
  setNewQHasCorrectAnswer,
  handleAddQuestion,
  addQuestionMutation,
  deleteQuestionMutation,
  updateQuestionMutation,
  reorderMutation,
  readOnly = false,
  canDelete = true,
}: QuestionsTabProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editBannerImage, setEditBannerImage] = useState('');
  const [editType, setEditType] = useState<QuestionType>('SHORT_TEXT');
  const [editRequired, setEditRequired] = useState(false);
  const [editOptions, setEditOptions] = useState<string[]>([]);
  const [editCorrectAnswer, setEditCorrectAnswer] = useState('');
  const [editHasCorrectAnswer, setEditHasCorrectAnswer] = useState(false);

  const { t } = useTranslation();

  // Optimistic local ordering — sync from server on every render when data changes
  const [localQuestions, setLocalQuestions] = useState<Question[]>([]);
  const serverQuestions = survey.questions ?? [];

  const serverKey = serverQuestions.map((q) => `${q.id}:${q.text}:${q.description}:${q.correct_answer}:${q.type}:${q.required}`).join('|');
  const localKey = localQuestions.map((q) => `${q.id}:${q.text}:${q.description}:${q.correct_answer}:${q.type}:${q.required}`).join('|');
  if (localKey !== serverKey) {
    setLocalQuestions(serverQuestions);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const startEditing = (q: Question) => {
    setEditingId(q.id);
    setEditText(q.text);
    setEditDescription(q.description || '');
    setEditBannerImage(q.banner_image || '');
    setEditType(q.type);
    setEditRequired(q.required);
    setEditOptions(q.options ? [...q.options] : ['']);
    setEditCorrectAnswer(q.correct_answer || '');
    setEditHasCorrectAnswer(!!q.correct_answer);
    setEditDialogOpen(true);
  };

  const saveEditing = () => {
    if (!editingId || !editText.trim()) return;
    const hasOptions = needsOptions(editType);
    const options = hasOptions ? editOptions.filter((o) => o.trim()) : undefined;
    updateQuestionMutation.mutate({
      questionId: editingId,
      data: {
        text: editText,
        description: editDescription || null,
        banner_image: editBannerImage || null,
        type: editType,
        required: editRequired,
        options,
        correct_answer: editHasCorrectAnswer && editType !== 'FILE' && editCorrectAnswer ? editCorrectAnswer : null,
      },
    });
    setEditDialogOpen(false);
    setEditingId(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = localQuestions.findIndex((q) => q.id === active.id);
    const newIndex = localQuestions.findIndex((q) => q.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(localQuestions, oldIndex, newIndex);
    setLocalQuestions(reordered);
    reorderMutation.mutate(reordered.map((q) => q.id));
  };

  const TYPE_LABELS = getTypeLabels(t);

  const bannerUpload = (bannerValue: string, setBanner: (v: string) => void) => (
    <div className="space-y-2">
      <Label>{t.survey.bannerImage}</Label>
      {bannerValue ? (
        <div className="relative">
          <img src={bannerValue} alt="Banner" className="w-full max-h-32 object-cover rounded-md border" />
          <button
            type="button"
            onClick={() => setBanner('')}
            className="absolute top-1 right-1 bg-background/80 backdrop-blur rounded-full p-1 hover:bg-background"
          >
            <X className="h-3 w-3 text-destructive" />
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center h-20 border-2 border-dashed rounded-md cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors">
          <ImagePlus className="h-5 w-5 text-muted-foreground mb-1" />
          <span className="text-xs text-muted-foreground">{t.survey.uploadBannerImage}</span>
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
                if (typeof reader.result === 'string') setBanner(reader.result);
              };
              reader.readAsDataURL(file);
            }}
          />
        </label>
      )}
    </div>
  );

  const correctAnswerField = (
    type: QuestionType,
    correctAnswer: string,
    setCorrectAnswer: (v: string) => void,
    hasCorrectAnswer: boolean,
    setHasCorrectAnswer: (v: boolean) => void,
    options: string[],
  ) => {
    if (type === 'FILE') return null;

    const selectedMulti = correctAnswer ? correctAnswer.split(',').map((s) => s.trim()).filter(Boolean) : [];
    const toggleMulti = (opt: string, checked: boolean) => {
      const next = checked ? [...selectedMulti, opt] : selectedMulti.filter((v) => v !== opt);
      setCorrectAnswer(next.join(', '));
    };

    const rankingOrder = correctAnswer ? correctAnswer.split(',').map((s) => s.trim()).filter(Boolean) : [...options.filter((o) => o.trim())];

    return (
      <div className="space-y-3 rounded-md border p-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">{t.survey.correctAnswer}</Label>
          <Switch checked={hasCorrectAnswer} onCheckedChange={(v) => { setHasCorrectAnswer(v); if (!v) setCorrectAnswer(''); }} />
        </div>
        {hasCorrectAnswer && (
          <div className="space-y-2">
            {type === 'SHORT_TEXT' && (
              <Input
                value={correctAnswer}
                onChange={(e) => setCorrectAnswer(e.target.value)}
                placeholder={t.survey.expectedShortAnswer}
              />
            )}
            {type === 'LONG_TEXT' && (
              <Textarea
                value={correctAnswer}
                onChange={(e) => setCorrectAnswer(e.target.value)}
                placeholder={t.survey.expectedAnswer}
                className="min-h-[60px]"
              />
            )}
            {type === 'NUMBER' && (
              <Input
                type="number"
                value={correctAnswer}
                onChange={(e) => setCorrectAnswer(e.target.value)}
                placeholder={t.survey.expectedNumber}
              />
            )}
            {type === 'CODE' && (
              <textarea
                className="w-full min-h-[80px] rounded-md border bg-muted/30 px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder={t.survey.expectedCode}
                value={correctAnswer}
                onChange={(e) => setCorrectAnswer(e.target.value)}
                spellCheck={false}
              />
            )}
            {type === 'SINGLE_CHOICE' && (
              <RadioGroup value={correctAnswer} onValueChange={setCorrectAnswer}>
                {options.filter((o) => o.trim()).map((opt, i) => (
                  <div key={i} className="flex items-center space-x-2">
                    <RadioGroupItem value={opt} id={`ca-sc-${i}`} />
                    <Label htmlFor={`ca-sc-${i}`} className="font-normal">{opt}</Label>
                  </div>
                ))}
                {options.filter((o) => o.trim()).length === 0 && (
                  <p className="text-xs text-muted-foreground">{t.survey.addOptionsFirst}</p>
                )}
              </RadioGroup>
            )}
            {type === 'MULTI_CHOICE' && (
              <div className="space-y-2">
                {options.filter((o) => o.trim()).map((opt, i) => (
                  <div key={i} className="flex items-center space-x-2">
                    <Checkbox
                      id={`ca-mc-${i}`}
                      checked={selectedMulti.includes(opt)}
                      onCheckedChange={(checked) => toggleMulti(opt, checked === true)}
                    />
                    <Label htmlFor={`ca-mc-${i}`} className="font-normal">{opt}</Label>
                  </div>
                ))}
                {options.filter((o) => o.trim()).length === 0 && (
                  <p className="text-xs text-muted-foreground">{t.survey.addOptionsFirst}</p>
                )}
              </div>
            )}
            {type === 'RANKING' && (
              <div className="space-y-2">
                {rankingOrder.map((item, i, arr) => (
                  <div key={item} className="flex items-center gap-2 rounded-md border px-3 py-2">
                    <span className="text-sm font-medium text-muted-foreground w-6">{i + 1}.</span>
                    <span className="flex-1 text-sm">{item}</span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        disabled={i === 0}
                        className="p-1 rounded hover:bg-muted disabled:opacity-30"
                        onClick={() => {
                          const newArr = [...arr];
                          [newArr[i - 1], newArr[i]] = [newArr[i], newArr[i - 1]];
                          setCorrectAnswer(newArr.join(', '));
                        }}
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={i === arr.length - 1}
                        className="p-1 rounded hover:bg-muted disabled:opacity-30"
                        onClick={() => {
                          const newArr = [...arr];
                          [newArr[i], newArr[i + 1]] = [newArr[i + 1], newArr[i]];
                          setCorrectAnswer(newArr.join(', '));
                        }}
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground">{t.survey.arrangeCorrectOrder}</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const questionFormFields = (
    type: QuestionType,
    setType: (v: QuestionType) => void,
    text: string,
    setText: (v: string) => void,
    desc: string,
    setDesc: (v: string) => void,
    banner: string,
    setBanner: (v: string) => void,
    required: boolean,
    setRequired: (v: boolean) => void,
    options: string[],
    setOptions: (v: string[]) => void,
    correctAnswer: string,
    setCorrectAnswer: (v: string) => void,
    hasCorrectAnswer: boolean,
    setHasCorrectAnswer: (v: boolean) => void,
  ) => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>{t.survey.type} <span className="text-destructive">*</span></Label>
        <Select value={type} onValueChange={(v) => setType(v as QuestionType)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {QUESTION_TYPES.map((qt) => (
              <SelectItem key={qt} value={qt}>{getTypeLabel(qt, t)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>{t.survey.questionText} <span className="text-destructive">*</span></Label>
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t.survey.questionPlaceholder}
        />
      </div>
      <div className="space-y-2">
        <Label>{t.survey.descriptionOptional}</Label>
        <Textarea
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder={t.survey.descriptionInstructions}
          className="min-h-[60px]"
        />
      </div>
      {bannerUpload(banner, setBanner)}
      {needsOptions(type) && (
        <div className="space-y-2">
          <Label>{type === 'RANKING' ? t.survey.itemsToRank : t.survey.options} <span className="text-destructive">*</span></Label>
          {options.map((opt, idx) => (
            <div key={idx} className="flex gap-2">
              <Input
                value={opt}
                onChange={(e) => {
                  const updated = [...options];
                  updated[idx] = e.target.value;
                  setOptions(updated);
                }}
                placeholder={type === 'RANKING' ? t.survey.itemPlaceholder.replace('{n}', String(idx + 1)) : t.survey.optionPlaceholder.replace('{n}', String(idx + 1))}
              />
              {options.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setOptions(options.filter((_, i) => i !== idx))}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => setOptions([...options, ''])}>
            <Plus className="mr-1 h-3 w-3" />
            {type === 'RANKING' ? t.survey.addItem : t.survey.addOption}
          </Button>
        </div>
      )}
      {correctAnswerField(type, correctAnswer, setCorrectAnswer, hasCorrectAnswer, setHasCorrectAnswer, options)}
      <div className="flex items-center gap-2">
        <Switch checked={required} onCheckedChange={setRequired} />
        <Label>{t.common.required}</Label>
      </div>
    </div>
  );

  return (
    <>
      {/* ─── Questions ─── */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">{t.survey.questionsCount.replace('{count}', String(localQuestions.length))}</h3>
        {!readOnly && (
        <Dialog open={newQuestionOpen} onOpenChange={setNewQuestionOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-1 h-3 w-3" />
              {t.survey.addQuestion}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t.survey.addQuestion}</DialogTitle>
            </DialogHeader>
            {questionFormFields(
              newQType, setNewQType,
              newQText, setNewQText,
              newQDescription, setNewQDescription,
              newQBannerImage, setNewQBannerImage,
              newQRequired, setNewQRequired,
              newQOptions, setNewQOptions,
              newQCorrectAnswer, setNewQCorrectAnswer,
              newQHasCorrectAnswer, setNewQHasCorrectAnswer,
            )}
            <Button
              onClick={handleAddQuestion}
              disabled={!newQText.trim() || addQuestionMutation.isPending}
              className="w-full"
            >
              {addQuestionMutation.isPending ? t.survey.adding : t.survey.addQuestion}
            </Button>
          </DialogContent>
        </Dialog>
        )}
      </div>

      {/* Edit dialog */}
      {!readOnly && (
      <Dialog open={editDialogOpen} onOpenChange={(open) => { if (!open) { setEditDialogOpen(false); setEditingId(null); } }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t.survey.editQuestion}</DialogTitle>
          </DialogHeader>
          {questionFormFields(
            editType, setEditType,
            editText, setEditText,
            editDescription, setEditDescription,
            editBannerImage, setEditBannerImage,
            editRequired, setEditRequired,
            editOptions, setEditOptions,
            editCorrectAnswer, setEditCorrectAnswer,
            editHasCorrectAnswer, setEditHasCorrectAnswer,
          )}
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => { setEditDialogOpen(false); setEditingId(null); }}>
              {t.common.cancel}
            </Button>
            <Button
              className="flex-1"
              onClick={saveEditing}
              disabled={!editText.trim() || updateQuestionMutation.isPending}
            >
              {updateQuestionMutation.isPending ? t.common.loading : t.common.save}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      )}

      {localQuestions.length > 0 ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={localQuestions.map((q) => q.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {localQuestions.map((q: Question, idx: number) => (
                <SortableQuestionCard
                  key={q.id}
                  question={q}
                  index={idx}
                  onStartEditing={readOnly ? undefined : () => startEditing(q)}
                  onDelete={canDelete ? () => deleteQuestionMutation.mutate(q.id) : undefined}
                  typeLabels={TYPE_LABELS}
                  readOnly={readOnly}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground">
            {t.survey.noQuestionsYet}
          </CardContent>
        </Card>
      )}
    </>
  );
}
