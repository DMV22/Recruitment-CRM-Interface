import { MessageSquareText } from 'lucide-react';

import type { EntityNoteItem, NoteEntityType } from '@/lib/db/queries/notes';
import { AddNoteForm } from '@/components/notes/add-note-form';
import { DeleteNoteButton } from '@/components/notes/delete-note-button';
import { formatRelativeTime } from '@/lib/format-time';

type Props = {
  title?: string;
  entityType: NoteEntityType;
  entityId: number;
  notes: EntityNoteItem[];
  currentUserId: number;
  canCreate: boolean;
};

export function NotesSection({
  title = 'Notes',
  entityType,
  entityId,
  notes,
  currentUserId,
  canCreate,
}: Props) {
  return (
    <section className="detail-section">
      <div className="detail-section-header">
        <div>
          <h2 className="detail-section-title">{title}</h2>
          <p className="text-hint">Internal notes for this record.</p>
        </div>
      </div>

      {canCreate ? <AddNoteForm entityType={entityType} entityId={entityId} /> : null}

      {notes.length > 0 ? (
        <ul className="notes-list">
          {notes.map((note) => (
            <li key={note.id} className="notes-item">
              <div className="notes-item-header">
                <div className="notes-meta">
                  <span className="notes-author">{note.authorName ?? 'Unknown user'}</span>
                  <span className="notes-separator">•</span>
                  <span className="notes-date">{formatRelativeTime(note.createdAt)}</span>
                </div>

                {note.createdBy === currentUserId ? (
                  <DeleteNoteButton id={note.id} entityType={entityType} entityId={entityId} />
                ) : null}
              </div>

              <p className="notes-content">{note.content}</p>
            </li>
          ))}
        </ul>
      ) : (
        <div className="notes-empty">
          <MessageSquareText className="h-10 w-10 text-muted-foreground" />
          <div>
            <h3 className="notes-empty-title">No notes yet</h3>
            <p className="notes-empty-text">
              Notes added by recruiters and managers will appear here.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
