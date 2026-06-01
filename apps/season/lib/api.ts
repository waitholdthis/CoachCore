import axios from "axios";
import { getToken } from "./auth";
import type {
  TokenResponse,
  User,
  TeamWithMeta,
  TeamMember,
  MemberRole,
  ChannelWithMeta,
  Message,
  Event,
  EventWithRSVPs,
  RSVPStatus,
  RSVP,
  Upload,
} from "./types";

const client = axios.create({
  baseURL: "/api",
});

client.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authApi = {
  register(data: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    phone?: string;
  }): Promise<TokenResponse> {
    return client.post("/auth/register", data).then((r) => r.data);
  },

  login(data: { email: string; password: string }): Promise<TokenResponse> {
    return client.post("/auth/login", data).then((r) => r.data);
  },

  demoLogin(): Promise<TokenResponse> {
    return client.post("/auth/demo").then((r) => r.data);
  },

  me(): Promise<User> {
    return client.get("/auth/me").then((r) => r.data);
  },

  updateProfile(
    data: Partial<{
      first_name: string;
      last_name: string;
      phone: string;
      avatar_key: string;
    }>
  ): Promise<User> {
    return client.patch("/auth/me", data).then((r) => r.data);
  },
};

// Teams API
export const teamsApi = {
  create(data: {
    name: string;
    sport?: string;
    season_name?: string;
    season_start?: string;
    season_end?: string;
  }): Promise<TeamWithMeta> {
    return client.post("/teams", data).then((r) => r.data);
  },

  myTeams(): Promise<TeamWithMeta[]> {
    return client.get("/teams/my").then((r) => r.data);
  },

  get(teamId: string): Promise<TeamWithMeta> {
    return client.get(`/teams/${teamId}`).then((r) => r.data);
  },

  join(invite_code: string): Promise<TeamMember> {
    return client.post("/teams/join", { invite_code }).then((r) => r.data);
  },

  members(teamId: string): Promise<TeamMember[]> {
    return client.get(`/teams/${teamId}/members`).then((r) => r.data);
  },

  approveMember(
    teamId: string,
    userId: string,
    data: {
      is_approved?: boolean;
      role?: MemberRole;
      child_names?: string[];
    }
  ): Promise<TeamMember> {
    return client
      .patch(`/teams/${teamId}/members/${userId}`, data)
      .then((r) => r.data);
  },

  removeMember(teamId: string, userId: string): Promise<void> {
    return client
      .delete(`/teams/${teamId}/members/${userId}`)
      .then(() => undefined);
  },

  resetInvite(teamId: string): Promise<import("./types").Team> {
    return client.post(`/teams/${teamId}/reset-invite`).then((r) => r.data);
  },
};

// Messages API
export const messagesApi = {
  channels(teamId: string): Promise<ChannelWithMeta[]> {
    return client
      .get(`/teams/${teamId}/channels`)
      .then((r) => r.data);
  },

  messages(
    channelId: string,
    before?: string,
    limit?: number
  ): Promise<Message[]> {
    return client
      .get(`/channels/${channelId}/messages`, {
        params: { before, limit },
      })
      .then((r) => r.data);
  },

  sendMessage(
    channelId: string,
    content: string,
    attachment_key?: string,
    attachment_type?: string
  ): Promise<Message> {
    return client
      .post(`/channels/${channelId}/messages`, {
        content,
        attachment_key,
        attachment_type,
      })
      .then((r) => r.data);
  },

  editMessage(
    channelId: string,
    messageId: string,
    content: string
  ): Promise<Message> {
    return client
      .patch(`/channels/${channelId}/messages/${messageId}`, { content })
      .then((r) => r.data);
  },

  deleteMessage(channelId: string, messageId: string): Promise<void> {
    return client
      .delete(`/channels/${channelId}/messages/${messageId}`)
      .then(() => undefined);
  },

  markRead(channelId: string): Promise<void> {
    return client
      .post(`/channels/${channelId}/read`)
      .then(() => undefined);
  },

  openDM(teamId: string, targetUserId: string): Promise<ChannelWithMeta> {
    return client
      .post(`/teams/${teamId}/dm`, { target_user_id: targetUserId })
      .then((r) => r.data);
  },
};

// Events API
export const eventsApi = {
  list(teamId: string, from?: string, to?: string): Promise<Event[]> {
    return client
      .get(`/teams/${teamId}/events`, { params: { from, to } })
      .then((r) => r.data);
  },

  create(
    teamId: string,
    data: Omit<Event, "id" | "team_id" | "created_by" | "created_at" | "is_cancelled">
  ): Promise<Event> {
    return client.post(`/teams/${teamId}/events`, data).then((r) => r.data);
  },

  get(eventId: string): Promise<EventWithRSVPs> {
    return client.get(`/events/${eventId}`).then((r) => r.data);
  },

  update(eventId: string, data: Partial<Event>): Promise<Event> {
    return client.patch(`/events/${eventId}`, data).then((r) => r.data);
  },

  delete(eventId: string): Promise<void> {
    return client.delete(`/events/${eventId}`).then(() => undefined);
  },

  rsvp(eventId: string, status: RSVPStatus, note?: string): Promise<RSVP> {
    return client
      .post(`/events/${eventId}/rsvp`, { status, note })
      .then((r) => r.data);
  },

  icalUrl(teamId: string): string {
    return `/api/teams/${teamId}/calendar.ics`;
  },
};

// Uploads API
export const uploadsApi = {
  presign(
    teamId: string,
    data: { filename: string; content_type: string; file_size: number }
  ): Promise<{ upload_id: string; presigned_url: string; s3_key: string }> {
    return client
      .post(`/teams/${teamId}/uploads/presign`, data)
      .then((r) => r.data);
  },

  confirm(
    uploadId: string,
    data?: { caption?: string; season_label?: string }
  ): Promise<Upload> {
    return client
      .post(`/uploads/${uploadId}/confirm`, data || {})
      .then((r) => r.data);
  },

  list(
    teamId: string,
    params?: {
      file_type?: string;
      season_label?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<Upload[]> {
    return client
      .get(`/teams/${teamId}/uploads`, { params })
      .then((r) => r.data);
  },

  getUrl(uploadId: string): Promise<Upload> {
    return client.get(`/uploads/${uploadId}`).then((r) => r.data);
  },

  deleteUpload(uploadId: string): Promise<void> {
    return client.delete(`/uploads/${uploadId}`).then(() => undefined);
  },

  report(uploadId: string, reason: string): Promise<void> {
    return client
      .post(`/uploads/${uploadId}/report`, { reason })
      .then(() => undefined);
  },
};
