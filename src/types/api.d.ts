export type UUID = string;

export type NotePermission = 'public' | 'limited' | 'private';

export interface NoteSummary {
  id: UUID;
  channel: UUID;
  permission: NotePermission;
  title: string;
  summary: string;
  tag: string;
  createdAt: number;
  updatedAt: number;
}

export interface NoteRevision {
  revision: UUID;
  channel: UUID;
  permission: NotePermission;
  body: string;
  createdAt: number;
  updatedAt: number;
}

export interface Channel {
  id: UUID;
  path: string;
}

export interface UserSettings {
  defaultChannel: UUID;
}

// GET /notes
export interface GetNotesRequestParams {
  channel?: UUID;
  includeChild?: boolean; // ハイフンを削除
  tag?: string;
  title?: string;
  body?: string;
  sortkey?: 'dateAsc' | 'dateDesc' | 'titleAsc' | 'titleDesc'; // バックエンド仕様に合わせる
  limit?: number;
  offset?: number;
}

export interface GetNotesResponse {
  total: number;
  notes: NoteSummary[];
}

// POST /notes
export interface PostNoteResponse {
  id: UUID;
  channel: UUID;
  permission: NotePermission;
  revision: UUID;
}

// PUT /notes/:note-id
export interface PutNoteRequest {
  revision: UUID;
  channel: UUID;
  permission: NotePermission;
  body: string;
}

// 409 Conflict時のレスポンス
export interface PutNoteConflictResponse {
  'latest-revision': UUID;
  channel: UUID;
  permission: NotePermission;
  diff: string; // baseRevision (編集開始時) と latestRevision (現在のサーバー) の差分
}

// GET /notes/:note-id
export type GetNoteResponse = NoteRevision;

// GET /channels
export type GetChannelsResponse = Channel[];

// GET /me/history
export interface GetMyHistoryRequestParams {
  limit?: number;
  offset?: number;
}
export type GetMyHistoryResponse = GetNotesResponse;

// GET /notes/:note-id/history
export interface GetNoteHistoryRequestParams {
  limit?: number;
  offset?: number;
}

export interface GetNoteHistoryResponse {
  total: number;
  notes: NoteRevision[];
}

// GET /me/settings
export type GetUserSettingsResponse = UserSettings;

// PUT /me/settings
export type PutUserSettingsRequest = UserSettings;
