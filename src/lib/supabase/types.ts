import type {
  AlertChannel,
  AlertStatus,
  BoardInvitationStatus,
  BoardRole,
  EmailActionStatus,
  NoteStatus,
  Priority,
} from '@/types';

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          email: string;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          email: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      boards: {
        Row: {
          id: string;
          owner_user_id: string;
          name: string;
          is_personal: boolean;
          webhook_url: string | null;
          n8n_connected: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_user_id: string;
          name: string;
          is_personal?: boolean;
          webhook_url?: string | null;
          n8n_connected?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_user_id?: string;
          name?: string;
          is_personal?: boolean;
          webhook_url?: string | null;
          n8n_connected?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      board_members: {
        Row: {
          board_id: string;
          user_id: string;
          role: BoardRole;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          board_id: string;
          user_id: string;
          role?: BoardRole;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          board_id?: string;
          user_id?: string;
          role?: BoardRole;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      board_invitations: {
        Row: {
          id: string;
          board_id: string;
          email: string;
          invited_by: string;
          status: BoardInvitationStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          board_id: string;
          email: string;
          invited_by: string;
          status?: BoardInvitationStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          board_id?: string;
          email?: string;
          invited_by?: string;
          status?: BoardInvitationStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_settings: {
        Row: {
          user_id: string;
          email_alerts_enabled: boolean;
          in_app_alerts_enabled: boolean;
          push_reminders_enabled: boolean;
          default_reminder_time: string;
          default_snooze_interval: string;
          active_board_id: string | null;
          api_endpoint: string | null;
          webhook_url: string | null;
          n8n_connected: boolean;
          email_provider: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          email_alerts_enabled?: boolean;
          in_app_alerts_enabled?: boolean;
          push_reminders_enabled?: boolean;
          default_reminder_time?: string;
          default_snooze_interval?: string;
          active_board_id?: string | null;
          api_endpoint?: string | null;
          webhook_url?: string | null;
          n8n_connected?: boolean;
          email_provider?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          email_alerts_enabled?: boolean;
          in_app_alerts_enabled?: boolean;
          push_reminders_enabled?: boolean;
          default_reminder_time?: string;
          default_snooze_interval?: string;
          active_board_id?: string | null;
          api_endpoint?: string | null;
          webhook_url?: string | null;
          n8n_connected?: boolean;
          email_provider?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          user_id: string;
          board_id: string;
          name: string;
          icon: string | null;
          color: string | null;
          is_shareable: boolean;
          position: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          board_id: string;
          name: string;
          icon?: string | null;
          color?: string | null;
          is_shareable?: boolean;
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          board_id?: string;
          name?: string;
          icon?: string | null;
          color?: string | null;
          is_shareable?: boolean;
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      tags: {
        Row: {
          id: string;
          user_id: string;
          board_id: string;
          name: string;
          color: string;
          is_shareable: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          board_id: string;
          name: string;
          color?: string;
          is_shareable?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          board_id?: string;
          name?: string;
          color?: string;
          is_shareable?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      notes: {
        Row: {
          id: string;
          user_id: string;
          board_id: string;
          title: string;
          content: string;
          priority: Priority;
          status: NoteStatus;
          tags: string[];
          category: string | null;
          due_at: string | null;
          reminder_at: string | null;
          pinned: boolean;
          has_alert: boolean;
          has_email_action: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          board_id: string;
          title?: string;
          content?: string;
          priority?: Priority;
          status?: NoteStatus;
          tags?: string[];
          category?: string | null;
          due_at?: string | null;
          reminder_at?: string | null;
          pinned?: boolean;
          has_alert?: boolean;
          has_email_action?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          board_id?: string;
          title?: string;
          content?: string;
          priority?: Priority;
          status?: NoteStatus;
          tags?: string[];
          category?: string | null;
          due_at?: string | null;
          reminder_at?: string | null;
          pinned?: boolean;
          has_alert?: boolean;
          has_email_action?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      reminders: {
        Row: {
          id: string;
          user_id: string;
          board_id: string;
          note_id: string;
          reminder_at: string;
          completed: boolean;
          completed_at: string | null;
          snoozed_until: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          board_id: string;
          note_id: string;
          reminder_at: string;
          completed?: boolean;
          completed_at?: string | null;
          snoozed_until?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          board_id?: string;
          note_id?: string;
          reminder_at?: string;
          completed?: boolean;
          completed_at?: string | null;
          snoozed_until?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      alerts: {
        Row: {
          id: string;
          user_id: string;
          board_id: string;
          note_id: string;
          type: string;
          channel: AlertChannel;
          scheduled_at: string;
          status: AlertStatus;
          last_error: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          board_id: string;
          note_id: string;
          type?: string;
          channel?: AlertChannel;
          scheduled_at: string;
          status?: AlertStatus;
          last_error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          board_id?: string;
          note_id?: string;
          type?: string;
          channel?: AlertChannel;
          scheduled_at?: string;
          status?: AlertStatus;
          last_error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      email_actions: {
        Row: {
          id: string;
          user_id: string;
          board_id: string;
          note_id: string;
          recipient: string;
          subject: string;
          body_preview: string;
          status: EmailActionStatus;
          scheduled_at: string | null;
          sent_at: string | null;
          last_error: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          board_id: string;
          note_id: string;
          recipient: string;
          subject: string;
          body_preview: string;
          status?: EmailActionStatus;
          scheduled_at?: string | null;
          sent_at?: string | null;
          last_error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          board_id?: string;
          note_id?: string;
          recipient?: string;
          subject?: string;
          body_preview?: string;
          status?: EmailActionStatus;
          scheduled_at?: string | null;
          sent_at?: string | null;
          last_error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      push_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          endpoint: string;
          subscription: Json;
          user_agent: string | null;
          created_at: string;
          updated_at: string;
          last_used_at: string;
          last_error: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          endpoint: string;
          subscription: Json;
          user_agent?: string | null;
          created_at?: string;
          updated_at?: string;
          last_used_at?: string;
          last_error?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          endpoint?: string;
          subscription?: Json;
          user_agent?: string | null;
          created_at?: string;
          updated_at?: string;
          last_used_at?: string;
          last_error?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      connect_user_to_board: {
        Args: {
          target_email: string;
          target_board_id?: string | null;
        };
        Returns: Json;
      };
      remove_user_from_board: {
        Args: {
          target_user_id: string;
          target_board_id?: string | null;
        };
        Returns: Json;
      };
      revoke_board_invitation: {
        Args: {
          invitation_id: string;
        };
        Returns: Json;
      };
      delete_category_definition: {
        Args: {
          target_category_id: string;
        };
        Returns: Json;
      };
      delete_tag_definition: {
        Args: {
          target_tag_id: string;
        };
        Returns: Json;
      };
    };
    Enums: {
      priority_enum: Priority;
      note_status_enum: NoteStatus;
      alert_status_enum: AlertStatus;
      alert_channel_enum: AlertChannel;
      email_action_status_enum: EmailActionStatus;
      board_role_enum: BoardRole;
      board_invitation_status_enum: BoardInvitationStatus;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

export type Inserts<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

export type Updates<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];
