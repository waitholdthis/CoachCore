export type MemberRole = "parent" | "coach" | "admin";
export type ChannelType = "team_chat" | "announcements" | "direct";
export type EventType = "practice" | "game" | "other";
export type RSVPStatus = "yes" | "no" | "maybe";
export type FileType = "photo" | "video" | "document";

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  avatar_key?: string;
  created_at: string;
}

export interface Team {
  id: string;
  name: string;
  sport?: string;
  season_name?: string;
  season_start?: string;
  season_end?: string;
  invite_code: string;
  created_at: string;
}

export interface TeamWithMeta extends Team {
  member_count: number;
  my_role: MemberRole;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: MemberRole;
  child_names: string[];
  is_approved: boolean;
  joined_at: string;
  user: User;
}

export interface Message {
  id: string;
  channel_id: string;
  sender_id: string;
  content: string;
  is_deleted: boolean;
  edited_at?: string;
  attachment_key?: string;
  attachment_type?: string;
  created_at: string;
  sender: User;
}

export interface Channel {
  id: string;
  team_id: string;
  channel_type: ChannelType;
  name?: string;
  dm_user1_id?: string;
  dm_user2_id?: string;
  is_archived: boolean;
  created_at: string;
}

export interface ChannelWithMeta extends Channel {
  unread_count: number;
  last_message?: Message;
  other_user?: User;
}

export interface Event {
  id: string;
  team_id: string;
  title: string;
  event_type: EventType;
  start_time: string;
  end_time?: string;
  location?: string;
  notes?: string;
  is_cancelled: boolean;
  created_by: string;
  created_at: string;
}

export interface RSVP {
  id: string;
  event_id: string;
  user_id: string;
  status: RSVPStatus;
  note?: string;
  updated_at: string;
  user: User;
}

export interface EventWithRSVPs extends Event {
  rsvps: RSVP[];
  yes_count: number;
  no_count: number;
  maybe_count: number;
  my_rsvp?: RSVP;
}

export interface Upload {
  id: string;
  team_id: string;
  uploader_id: string;
  s3_key: string;
  thumbnail_key?: string;
  original_filename: string;
  file_type: FileType;
  content_type: string;
  file_size: number;
  season_label?: string;
  caption?: string;
  upload_confirmed: boolean;
  moderation_status: string;
  created_at: string;
  uploader: User;
  url: string;
  thumbnail_url?: string;
}

export interface TokenResponse {
  user: User;
  access_token: string;
  token_type: string;
}

export type WSEvent =
  | { type: "new_message"; channel_id: string; message: Message }
  | { type: "message_edited"; channel_id: string; message: Message }
  | { type: "message_deleted"; channel_id: string; message_id: string }
  | { type: "rsvp_updated"; event_id: string; rsvp: RSVP }
  | { type: "new_upload"; upload: Upload }
  | { type: "member_approved"; member: TeamMember }
  | { type: "pong" };
