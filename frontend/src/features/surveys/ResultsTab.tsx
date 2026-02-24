// ResultsTab

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { surveysApi } from '@/api/surveys';
import { useTranslation } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  Eye,
  ChevronDown,
  ChevronUp,
  FileText,
  Download,
  CheckCircle2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { getTypeLabels } from '@/lib/questionTypeUtils';
import { formatValue } from '@/lib/formatValue';
import type { Question, QuestionType, QuestionResult, SurveyResponse } from '@/types';

interface ResultsTabProps {
  surveyId: number;
  results: { survey_title: string; total_responses: number; questions: QuestionResult[] } | undefined;
  isLoading: boolean;
  questions: Question[];
  canEdit?: boolean;
}

export default function ResultsTab({
  surveyId,
  results,
  isLoading,
  questions,
  canEdit = true,
}: ResultsTabProps) {
  const [view, setView] = useState<'statistics' | 'responses'>('statistics');
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [responsesLoading, setResponsesLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [respPage, setRespPage] = useState(1);
  const [respPerPage, setRespPerPage] = useState(10);
  const queryClient = useQueryClient();

  const { t } = useTranslation();

  const TYPE_LABELS = getTypeLabels(t);

  const loadResponses = async () => {
    setResponsesLoading(true);
    try {
      const data = await surveysApi.getResponses(surveyId);
      setResponses(data);
    } catch {
      toast.error(t.survey.failedLoadResponses);
    } finally {
      setResponsesLoading(false);
    }
  };

  const handleDeleteResponse = async (responseId: number) => {
    setDeletingId(responseId);
    try {
      await surveysApi.deleteResponse(surveyId, responseId);
      setResponses((prev) => prev.filter((r) => r.id !== responseId));
      queryClient.invalidateQueries({ queryKey: ['results', surveyId] });
      toast.success(t.survey.responseDeleted);
    } catch {
      toast.error(t.survey.failedDeleteResponse);
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-black" />
      </div>
    );
  }

  if (!results) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-muted-foreground">{t.survey.noResultsAvailable}</p>
      </div>
    );
  }

  return (
    <>
      {/* Sub-tabs */}
      <div className="mb-6 flex gap-1 rounded-lg border p-1">
        <button
          onClick={() => setView('statistics')}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            view === 'statistics'
              ? 'bg-black text-white'
              : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          <BarChart3 className="mr-1.5 inline h-4 w-4" />
          {t.survey.statistics}
        </button>
        <button
          onClick={() => {
            setView('responses');
            if (responses.length === 0) loadResponses();
          }}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            view === 'responses'
              ? 'bg-black text-white'
              : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          <Eye className="mr-1.5 inline h-4 w-4" />
          {t.survey.responsesView} ({results.total_responses})
        </button>
      </div>

      {/* Statistics View */}
      {view === 'statistics' && (
        <div className="space-y-4">
          {results.questions.map((q: QuestionResult, idx: number) => (
            <Card key={q.question_id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    <span className="mr-2 text-muted-foreground">Q{idx + 1}.</span>
                    {q.question_text}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {TYPE_LABELS[q.type as QuestionType] || q.type}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {q.options && q.options.length > 0 ? (
                  <div className="space-y-3">
                    {q.options
                      .slice()
                      .sort((a, b) => b.count - a.count)
                      .map((opt, oi) => (
                        <div key={opt.label} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              {oi === 0 && q.total_answers > 0 && (
                                <span className="text-xs font-bold text-primary">★</span>
                              )}
                              <span>{opt.label}</span>
                            </div>
                            <span className="font-medium tabular-nums">
                              {opt.count} ({opt.percentage}%)
                            </span>
                          </div>
                          <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-primary transition-all duration-500"
                              style={{ width: `${opt.percentage}%` }}
                            />
                          </div>
                        </div>
                      ))}
                  </div>
                ) : q.text_answers ? (
                  <div className="space-y-2">
                    {q.text_answers.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic">{t.survey.noAnswersYet}</p>
                    ) : (
                      <>
                        {q.text_answers.slice(0, 5).map((answer, i) => {
                          const strAnswer = String(answer);
                          if (q.type === 'FILE') {
                            if (!strAnswer || strAnswer === 'null') return (
                              <div key={i} className="rounded-md border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                                {t.survey.noFileUploaded}
                              </div>
                            );
                            const mimeMatch = strAnswer.match(/^data:([^;]+);/);
                            const mime = mimeMatch ? mimeMatch[1] : 'unknown';
                            const ext = mime.split('/').pop() || 'file';
                            return (
                              <div key={i} className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2 text-sm">
                                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                                <span className="truncate">{t.survey.uploadedFile.replace('{ext}', ext)}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="ml-auto h-7 px-2"
                                  onClick={() => {
                                    const a = document.createElement('a');
                                    a.href = strAnswer;
                                    a.download = `file_${i + 1}.${ext}`;
                                    a.click();
                                  }}
                                >
                                  <Download className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            );
                          }
                          return (
                          <div key={i} className="rounded-md border bg-muted/50 px-3 py-2 text-sm">
                            {q.type === 'CODE' ? (
                              <pre className="whitespace-pre-wrap font-mono text-xs">{strAnswer}</pre>
                            ) : (
                              strAnswer
                            )}
                          </div>
                          );
                        })}
                        {q.text_answers.length > 5 && (
                          <p className="text-xs text-muted-foreground">
                            {t.survey.moreAnswers.replace('{count}', String(q.text_answers.length - 5))}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Individual Responses View */}
      {view === 'responses' && (
        <div className="space-y-4">
          {responsesLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-black" />
            </div>
          ) : responses.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <p className="text-muted-foreground">{t.survey.noResponsesYet}</p>
            </div>
          ) : (
            <>
            {(() => {
              const totalRespPages = Math.ceil(responses.length / respPerPage);
              const paginatedResponses = responses.slice((respPage - 1) * respPerPage, respPage * respPerPage);
              return (
                <>
                  {/* Pagination header */}
                  {responses.length > 10 && (
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{t.common.show}</span>
                        <select
                          value={respPerPage}
                          onChange={(e) => { setRespPerPage(Number(e.target.value)); setRespPage(1); }}
                          className="rounded border px-2 py-1 text-sm bg-background"
                        >
                          {[5, 10, 20, 50].map((n) => (
                            <option key={n} value={n}>{n}</option>
                          ))}
                        </select>
                        <span>{t.common.perPage}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={respPage <= 1}
                          onClick={() => setRespPage((p) => p - 1)}
                        >
                          {t.common.previous}
                        </Button>
                        <span className="text-sm tabular-nums">
                          {respPage} / {totalRespPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={respPage >= totalRespPages}
                          onClick={() => setRespPage((p) => p + 1)}
                        >
                          {t.common.next}
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
            {paginatedResponses.map((resp) => {
              const isExpanded = expandedId === resp.id;

              return (
                <Card key={resp.id}>
                  <CardHeader
                    className="pb-0 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : resp.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base">
                          {resp.respondent_name || resp.respondent_email || `Response #${resp.id}`}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(resp.submitted_at).toLocaleString()}
                          {resp.respondent_email && resp.respondent_name && (
                            <span className="ml-2">({resp.respondent_email})</span>
                          )}
                        </p>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </CardHeader>

                  {isExpanded && (
                    <CardContent>
                      <div className="divide-y">
                        {resp.answers.map((ans, ai) => {
                          const q = questions.find((qq) => qq.id === ans.question_id);
                          const hasCorrect = !!q?.correct_answer;
                          let isCorrect = false;
                          if (hasCorrect && ans.value !== null && q?.correct_answer) {
                            const ca = q.correct_answer;
                            if (Array.isArray(ans.value) && ca.startsWith('[')) {
                              try {
                                const expected = JSON.parse(ca) as string[];
                                if (q.type === 'MULTI_CHOICE') {
                                  isCorrect = JSON.stringify([...ans.value].sort()) === JSON.stringify([...expected].sort());
                                } else {
                                  isCorrect = JSON.stringify(ans.value) === JSON.stringify(expected);
                                }
                              } catch { isCorrect = false; }
                            } else {
                              isCorrect = String(ans.value).toLowerCase().trim() === String(ca).toLowerCase().trim();
                            }
                          }

                          return (
                          <div key={ans.question_id} className="py-3 pl-3">
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center flex-wrap gap-1.5">
                                  <span>Q{ai + 1}. {ans.question_text}</span>
                                  <Badge variant="outline" className="text-[10px] py-0">
                                    {TYPE_LABELS[ans.type as QuestionType] || ans.type}
                                  </Badge>
                                  {hasCorrect && ans.value !== null && (
                                    isCorrect
                                      ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                                      : <X className="h-3.5 w-3.5 text-red-500" />
                                  )}
                                </p>
                                <div className="text-sm">
                                  {ans.value === null || (ans.type === 'FILE' && String(ans.value) === 'null') ? (
                                    <span className="text-muted-foreground">{t.survey.noAnswer}</span>
                                  ) : ans.type === 'CODE' ? (
                                    <pre className="mt-1 rounded bg-muted p-2 font-mono text-xs whitespace-pre-wrap">{formatValue(ans.value, ans.type)}</pre>
                                  ) : ans.type === 'RANKING' && Array.isArray(ans.value) ? (
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {ans.value.map((v, ri) => (
                                        <Badge key={ri} variant="secondary" className="text-xs">
                                          {ri + 1}. {v}
                                        </Badge>
                                      ))}
                                    </div>
                                  ) : ans.type === 'MULTI_CHOICE' && Array.isArray(ans.value) ? (
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {ans.value.map((v, ci) => (
                                        <Badge key={ci} variant="outline" className="text-xs">
                                          {v}
                                        </Badge>
                                      ))}
                                    </div>
                                  ) : ans.type === 'FILE' && typeof ans.value === 'string' && ans.value.startsWith('data:') ? (
                                    (() => {
                                      const val = ans.value as string;
                                      const mimeMatch = val.match(/^data:([^;]+);/);
                                      const mime = mimeMatch ? mimeMatch[1] : 'unknown';
                                      const ext = mime.split('/').pop() || 'file';
                                      return (
                                        <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2 text-sm mt-1">
                                          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                                          <span className="truncate">{t.survey.uploadedFile.replace('{ext}', ext)}</span>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="ml-auto h-7 px-2"
                                            onClick={() => {
                                              const a = document.createElement('a');
                                              a.href = val;
                                              a.download = `${ans.question_text || 'file'}.${ext}`;
                                              a.click();
                                            }}
                                          >
                                            <Download className="h-3.5 w-3.5" />
                                          </Button>
                                        </div>
                                      );
                                    })()
                                  ) : (
                                    <p>{formatValue(ans.value, ans.type)}</p>
                                  )}
                                  {hasCorrect && ans.value !== null && !isCorrect && (
                                    ans.type === 'CODE' ? (
                                      <div className="mt-1">
                                        <span className="text-xs text-green-600 font-medium">{t.survey.correct}:</span>
                                        <pre className="mt-0.5 rounded bg-green-50 p-2 font-mono text-xs text-green-700 whitespace-pre-wrap">{q?.correct_answer}</pre>
                                      </div>
                                    ) : (
                                      <p className="mt-1 text-xs text-green-600">
                                        {t.survey.correct}: {q?.correct_answer}
                                      </p>
                                    )
                                  )}
                                </div>
                            </div>
                          </div>
                          );
                        })}
                      </div>

                      {/* Delete button */}
                      {canEdit && (
                      <div className="border-t pt-3 flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-destructive hover:text-destructive"
                          onClick={() => handleDeleteResponse(resp.id)}
                          disabled={deletingId === resp.id}
                        >
                          {deletingId === resp.id ? (
                            <div className="mr-1 h-3 w-3 animate-spin rounded-full border-2 border-red-300 border-t-red-500" />
                          ) : (
                            <X className="mr-1 h-3 w-3" />
                          )}
                          {t.survey.deleteResponse}
                        </Button>
                      </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              );
            })}
                  </div>

                  {/* Pagination footer */}
                  {responses.length > 10 && (
                    <div className="flex items-center justify-end gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={respPage <= 1}
                        onClick={() => setRespPage((p) => p - 1)}
                      >
                        {t.common.previous}
                      </Button>
                      <span className="text-sm tabular-nums">
                        {respPage} / {totalRespPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={respPage >= totalRespPages}
                        onClick={() => setRespPage((p) => p + 1)}
                      >
                        {t.common.next}
                      </Button>
                    </div>
                  )}
                </>
              );
            })()}
            </>
          )}
        </div>
      )}
    </>
  );
}
