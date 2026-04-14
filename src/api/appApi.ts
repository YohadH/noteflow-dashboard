import { alertsApi } from './alertsApi';
import { boardsApi } from './boardsApi';
import { categoriesApi } from './categoriesApi';
import { emailActionsApi } from './emailActionsApi';
import { notesApi } from './notesApi';
import { remindersApi } from './remindersApi';
import { settingsApi } from './settingsApi';
import { tagsApi } from './tagsApi';

export const appApi = {
  async loadAll() {
    const [settings, boards] = await Promise.all([settingsApi.get(), boardsApi.listBoards()]);
    const activeBoardId = settings.activeBoardId || boards[0]?.id || undefined;

    if (!activeBoardId) {
      return {
        notes: [],
        reminders: [],
        alerts: [],
        emailActions: [],
        categories: [],
        tags: [],
        settings,
        boards,
        boardMembers: [],
        boardInvitations: [],
      };
    }

    const [notes, reminders, alerts, emailActions, categories, tags, boardMembers, boardInvitations] =
      await Promise.all([
        notesApi.list(activeBoardId),
        remindersApi.list(activeBoardId),
        alertsApi.list(activeBoardId),
        emailActionsApi.list(activeBoardId),
        categoriesApi.list(activeBoardId),
        tagsApi.list(activeBoardId),
        boardsApi.listMembers(activeBoardId),
        boardsApi.listInvitations(activeBoardId),
      ]);

    return {
      notes,
      reminders,
      alerts,
      emailActions,
      categories,
      tags,
      settings: {
        ...settings,
        activeBoardId,
      },
      boards,
      boardMembers,
      boardInvitations,
    };
  },
};
