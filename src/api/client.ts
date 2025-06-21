import type {
  UUID,
  NotePermission,
  GetNotesRequestParams,
  GetNotesResponse,
  PostNoteResponse,
  PutNoteRequest,
  PutNoteConflictResponse,
  GetNoteResponse,
  GetChannelsResponse,
  GetMyHistoryRequestParams,
  GetMyHistoryResponse,
  GetNoteHistoryRequestParams,
  GetNoteHistoryResponse,
  GetUserSettingsResponse,
  PutUserSettingsRequest,
} from '../types/api';

const API_BASE_URL = '/api';

export class ApiError extends Error {
  constructor(
    public response: Response,
    message?: string
  ) {
    super(message || `API Error: ${response.status} ${response.statusText}`);
    this.name = 'ApiError';
  }
}

/**
 * `PUT /notes/:note-id` で409 Conflictが発生した際にスローされるカスタムエラー。
 * サーバーから返却された最新リビジョンや差分情報を保持します。
 */
export class ConflictError extends ApiError {
  constructor(
    public response: Response,
    public data: PutNoteConflictResponse
  ) {
    super(response, `Conflict: A newer revision of the note exists.`);
    this.name = 'ConflictError';
  }
}

/**
 * fetchをラップする共通関数。
 * JSON形式のリクエストヘッダーを付与し、APIのベースURLを結合します。
 * @param path リクエストパス (例: '/notes')
 * @param options fetchに渡すオプション
 */
async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });
  return response;
}

// --- APIクライアント関数 ---

/**
 * ノートのリストを取得します。
 * GET /notes
 */
export async function getNotes(params: GetNotesRequestParams = {}): Promise<GetNotesResponse> {
  // undefinedな値を除外してクエリパラメータを構築
  const cleanParams = Object.fromEntries(Object.entries(params).filter(([, v]) => v != null));
  const query = new URLSearchParams(cleanParams as Record<string, string>).toString();

  const response = await apiFetch(`/notes?${query}`);
  if (!response.ok) throw new ApiError(response);
  return response.json();
}

/**
 * `api.d.ts` で `PostNoteRequest` が定義されていないため、ここで定義します。
 * 新しいノートを作成するために必要な情報です。
 */
export interface CreateNotePayload {
  title: string;
  body: string;
  channel: UUID;
  permission: NotePermission;
}

/**
 * 新しいノートを作成します。
 * POST /notes
 */
export async function createNote(payload: CreateNotePayload): Promise<PostNoteResponse> {
  const response = await apiFetch('/notes', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new ApiError(response);
  return response.json();
}

/**
 * 既存のノートを更新します。
 * 編集競合が発生した場合は `ConflictError` をスローします。
 * PUT /notes/:note-id
 */
export async function updateNote(noteId: UUID, payload: PutNoteRequest): Promise<void> {
  const response = await apiFetch(`/notes/${noteId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

  if (response.status === 409) {
    const conflictData = await response.json();
    throw new ConflictError(response, conflictData);
  }

  if (!response.ok) {
    throw new ApiError(response);
  }
  // 成功時 (204 No Contentなど) はボディがないため何も返さない
}

/**
 * 特定のノート1件を取得します。
 * GET /notes/:note-id
 */
export async function getNote(noteId: UUID): Promise<GetNoteResponse> {
  const response = await apiFetch(`/notes/${noteId}`);
  if (!response.ok) throw new ApiError(response);
  return response.json();
}

/**
 * チャンネルのリストを取得します。
 * GET /channels
 */
export async function getChannels(): Promise<GetChannelsResponse> {
  const response = await apiFetch('/channels');
  if (!response.ok) throw new ApiError(response);
  return response.json();
}

/**
 * ログインユーザーの閲覧履歴を取得します。
 * GET /me/history
 */
export async function getMyHistory(
  params: GetMyHistoryRequestParams = {}
): Promise<GetMyHistoryResponse> {
  const cleanParams = Object.fromEntries(Object.entries(params).filter(([, v]) => v != null));
  const query = new URLSearchParams(cleanParams as Record<string, string>).toString();

  const response = await apiFetch(`/me/history?${query}`);
  if (!response.ok) throw new ApiError(response);
  return response.json();
}

/**
 * 特定のノートの更新履歴を取得します。
 * GET /notes/:note-id/history
 */
export async function getNoteHistory(
  noteId: UUID,
  params: GetNoteHistoryRequestParams = {}
): Promise<GetNoteHistoryResponse> {
  const cleanParams = Object.fromEntries(Object.entries(params).filter(([, v]) => v != null));
  const query = new URLSearchParams(cleanParams as Record<string, string>).toString();

  const response = await apiFetch(`/notes/${noteId}/history?${query}`);
  if (!response.ok) throw new ApiError(response);
  return response.json();
}

/**
 * ログインユーザーの設定を取得します。
 * GET /me/settings
 */
export async function getUserSettings(): Promise<GetUserSettingsResponse> {
  const response = await apiFetch('/me/settings');
  if (!response.ok) throw new ApiError(response);
  return response.json();
}

/**
 * ログインユーザーの設定を更新します。
 * PUT /me/settings
 */
export async function updateUserSettings(payload: PutUserSettingsRequest): Promise<void> {
  const response = await apiFetch('/me/settings', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new ApiError(response);
  }
}
