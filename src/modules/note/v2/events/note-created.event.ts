export const NOTE_CREATED_EVENT = 'note.created';

export class NoteCreatedEvent {
  noteId: string;
  pageId: string;
  title: string;
  blocks: string;
  html: string;
  markdown: string;
  pushNotification: boolean;
  retry: number;

  constructor(init: Partial<NoteCreatedEvent>) {
    Object.assign(this, init);
  }
}
