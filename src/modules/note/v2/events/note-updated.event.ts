export const NOTE_UPDATED_EVENT = 'note.updated';

type Block = {
  id: string;
  content: string;
};

export class NoteUpdatedEvent {
  noteId: string;
  pageId: string;
  title: string;
  blocks: Block[];
  retry: number;

  constructor(init: Partial<NoteUpdatedEvent>) {
    Object.assign(this, init);
  }
}
