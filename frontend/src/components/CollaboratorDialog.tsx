//CollaboratorDialog

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Users, Trash2 } from 'lucide-react';
import { useTranslation } from '@/i18n';
import type { CollaboratorRole } from '@/types';

interface Collaborator {
  id: number;
  name: string;
  email: string;
  pivot: { role: string };
}

interface CollaboratorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isOwner: boolean;
  collaborators: Collaborator[];
  collabEmail: string;
  onCollabEmailChange: (v: string) => void;
  collabRole: CollaboratorRole;
  onCollabRoleChange: (v: CollaboratorRole) => void;
  onAdd: () => void;
  addPending: boolean;
  onRemove: (userId: number) => void;
  triggerButton?: boolean;
}

export default function CollaboratorDialog({
  open,
  onOpenChange,
  isOwner,
  collaborators,
  collabEmail,
  onCollabEmailChange,
  collabRole,
  onCollabRoleChange,
  onAdd,
  addPending,
  onRemove,
  triggerButton = true,
}: CollaboratorDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {triggerButton && (
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Users className="mr-1.5 h-3 w-3" />
            {t.survey.collaborators}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isOwner ? t.survey.manageCollaborators : t.survey.collaborators}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {isOwner && (
            <>
              <div className="flex gap-2">
                <Input
                  placeholder={t.survey.emailPlaceholder}
                  value={collabEmail}
                  onChange={(e) => onCollabEmailChange(e.target.value)}
                  className="flex-1"
                />
                <Select value={collabRole} onValueChange={(v) => onCollabRoleChange(v as CollaboratorRole)}>
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="editor">{t.survey.editor}</SelectItem>
                    <SelectItem value="viewer">{t.survey.viewer}</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  onClick={onAdd}
                  disabled={!collabEmail.trim() || addPending}
                >
                  {t.survey.add}
                </Button>
              </div>
              <Separator />
            </>
          )}
          {collaborators && collaborators.length > 0 ? (
            <div className="space-y-2">
              {collaborators.map((collab) => (
                <div key={collab.id} className="flex items-center justify-between rounded border p-2">
                  <div>
                    <p className="text-sm font-medium">{collab.name}</p>
                    <p className="text-xs text-muted-foreground">{collab.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="capitalize">{collab.pivot.role}</Badge>
                    {isOwner && (
                      <Button variant="ghost" size="sm" onClick={() => onRemove(collab.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t.survey.noCollaborators}</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
