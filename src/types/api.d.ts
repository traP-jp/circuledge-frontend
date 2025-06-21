export type UUID = string;

export type NotePermission = 'public' | 'limited' | 'private';

export interface NoteSummary {
  id: UUID;
  channel: UUID;
  permission: NotePermission;
  title: string;
  summary: string;
  tag: string;
  createdAt: string;
  updatedAt: string;
}

export interface NoteRevision {
  revision: UUID;
  channel: UUID;
  permission: Permission;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export interface Channel {
  id: UUID;
  path: string;
}

export interface UserSettings {
  defaultchannel: UUID;
}

// GET /notes
export interface GetNotesRequestParams {
  channel?: UUID;
  'include-child'?: boolean;
  tag?: string;
  title?: string;
  body?: string;
  sortkey?: 'date' | 'title';
  limit?: number;
  offset?: number;
}

export interface GetNotesResponse {
  total: number;
  notes: NoteSummary[];
}

// POST /notes
// export interface PostNoteRequest {}

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
  diff: string;
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
