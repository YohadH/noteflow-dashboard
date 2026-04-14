import type { Board, BoardInvitation, BoardMember } from '@/types';
import { supabase, ensureSupabaseConfigured } from '@/lib/supabase/client';
import { mapBoard, mapBoardInvitation, mapBoardMember } from './mappers';
import { getRequiredUserId } from './session';

type BoardMembershipRow = {
  board_id: string;
  role: Board['role'];
  boards: {
    id: string;
    owner_user_id: string;
    name: string;
    is_personal: boolean;
    created_at: string;
    updated_at: string;
  } | null;
};

type BoardMemberRow = {
  board_id: string;
  user_id: string;
  role: BoardMember['role'];
  created_at: string;
  updated_at: string;
  profiles: {
    id: string;
    name: string;
    email: string;
  } | null;
};

export const boardsApi = {
  async listBoards(): Promise<Board[]> {
    ensureSupabaseConfigured();

    const { data, error } = await supabase
      .from('board_members')
      .select('board_id, role, boards:boards!inner(id, owner_user_id, name, is_personal, created_at, updated_at)')
      .order('created_at', { foreignTable: 'boards', ascending: true });

    if (error) {
      throw error;
    }

    return ((data as BoardMembershipRow[] | null) || [])
      .filter((row): row is BoardMembershipRow & { boards: NonNullable<BoardMembershipRow['boards']> } => Boolean(row.boards))
      .map((row) => mapBoard(row.boards, row.role));
  },

  async listMembers(boardId: string): Promise<BoardMember[]> {
    ensureSupabaseConfigured();

    const currentUserId = await getRequiredUserId();
    const { data, error } = await supabase
      .from('board_members')
      .select('board_id, user_id, role, created_at, updated_at, profiles:profiles!inner(id, name, email)')
      .eq('board_id', boardId)
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    return ((data as BoardMemberRow[] | null) || [])
      .filter((row): row is BoardMemberRow & { profiles: NonNullable<BoardMemberRow['profiles']> } => Boolean(row.profiles))
      .map((row) => mapBoardMember(row, row.profiles, currentUserId));
  },

  async listInvitations(boardId: string): Promise<BoardInvitation[]> {
    ensureSupabaseConfigured();

    const { data, error } = await supabase
      .from('board_invitations')
      .select('*')
      .eq('board_id', boardId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return (data || []).map(mapBoardInvitation);
  },

  async connectUser(email: string, boardId?: string) {
    ensureSupabaseConfigured();

    const { data, error } = await supabase.rpc('connect_user_to_board', {
      target_email: email,
      target_board_id: boardId || null,
    });

    if (error) {
      throw error;
    }

    return data;
  },

  async removeUser(userId: string, boardId?: string) {
    ensureSupabaseConfigured();

    const { data, error } = await supabase.rpc('remove_user_from_board', {
      target_user_id: userId,
      target_board_id: boardId || null,
    });

    if (error) {
      throw error;
    }

    return data;
  },

  async revokeInvitation(invitationId: string) {
    ensureSupabaseConfigured();

    const { data, error } = await supabase.rpc('revoke_board_invitation', {
      invitation_id: invitationId,
    });

    if (error) {
      throw error;
    }

    return data;
  },
};
