// SortableQuestionCard (Drag and drop question tab)
 
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTranslation } from '@/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GripVertical, Pencil, Trash2, CheckCircle2 } from 'lucide-react';
import type { Question, QuestionType } from '@/types';

interface SortableQuestionCardProps {
  question: Question;
  index: number;
  onStartEditing?: () => void;
  onDelete?: () => void;
  typeLabels: Record<QuestionType, string>;
  readOnly?: boolean;
}

export default function SortableQuestionCard({
  question,
  index,
  onStartEditing,
  onDelete,
  typeLabels,
  readOnly = false,
}: SortableQuestionCardProps) {
  const { t } = useTranslation();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id, disabled: readOnly });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className={`transition-shadow ${isDragging ? 'shadow-lg' : ''}`}>
        {question.banner_image && (
          <img src={question.banner_image} alt="" className="w-full max-h-32 object-cover rounded-t-lg" />
        )}
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 min-w-0">
              {!readOnly && (
              <button
                {...attributes}
                {...listeners}
                className="cursor-grab touch-none rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground active:cursor-grabbing mt-0.5"
                tabIndex={-1}
              >
                <GripVertical className="h-4 w-4" />
              </button>
              )}
              <span className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground mt-0.5">
                {index + 1}
              </span>
              <div className="min-w-0">
                <CardTitle className="text-base truncate">{question.text}</CardTitle>
                {question.description && (
                  <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{question.description}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Badge variant="outline" className="text-xs">{typeLabels[question.type]}</Badge>
              {question.required && <Badge variant="destructive" className="text-xs">{t.common.required}</Badge>}
              {onStartEditing && (
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onStartEditing}>
                  <Pencil className="h-3 w-3" />
                </Button>
              )}
              {onDelete && (
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={onDelete}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-2">
          {question.options && question.options.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {question.options.map((opt, i) => (
                <Badge key={i} variant="secondary" className="font-normal">{opt}</Badge>
              ))}
            </div>
          )}
          {question.correct_answer && (
            <div className="flex items-start gap-1.5 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
              <span className="text-muted-foreground">
                {t.survey.correctAnswer}: <span className="font-medium text-foreground">{question.correct_answer}</span>
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
