import type { Category, Note, Tag } from '@/types';

function normalizeName(value?: string | null) {
  return value?.trim().toLowerCase() || '';
}

export function isNoteShared(
  note: Pick<Note, 'category' | 'tags'>,
  categories: Category[],
  tags: Tag[],
) {
  const sharedCategories = new Set(
    categories.filter((category) => category.isShareable).map((category) => normalizeName(category.name)),
  );
  const sharedTags = new Set(tags.filter((tag) => tag.isShareable).map((tag) => normalizeName(tag.name)));

  if (sharedCategories.has(normalizeName(note.category))) {
    return true;
  }

  return note.tags.some((tag) => sharedTags.has(normalizeName(tag)));
}

export function decorateNotesWithSharing(notes: Note[], categories: Category[], tags: Tag[]) {
  return notes.map((note) => ({
    ...note,
    isShared: isNoteShared(note, categories, tags),
  }));
}
