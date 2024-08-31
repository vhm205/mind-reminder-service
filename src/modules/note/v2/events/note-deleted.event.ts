export const NOTE_DELETED_EVENT = 'note.deleted';

export class NoteDeletedEvent {
  pageId: string;
  retry: number;

  constructor(init: Partial<NoteDeletedEvent>) {
    Object.assign(this, init);
  }
}
