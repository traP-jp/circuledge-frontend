import type {
  UUID,
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

// 開発環境でのみデバッグログを出力するヘルパー関数
const debugLog = (message: string, ...args: unknown[]) => {
  if (import.meta.env.DEV) {
    console.log(message, ...args);
  }
};

const API_BASE_URL =
  import.meta.env.VITE_ENABLE_MOCKS === 'true'
    ? '/api'
    : 'http://circuledge.ramdos.net:8080/api/v1';

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

  const url = `${API_BASE_URL}${path}`;
  debugLog(`API Request: ${options.method || 'GET'} ${url}`);

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // レスポンスの詳細をログ出力
  debugLog(`API Response: ${response.status} ${response.statusText}`);

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

  if (!response.ok) {
    // レスポンスボディを確認してエラーの詳細を提供
    const contentType = response.headers.get('content-type');
    let errorMessage = `API Error: ${response.status} ${response.statusText}`;

    if (contentType?.includes('text/html')) {
      const htmlText = await response.text();
      console.error('HTML response received:', htmlText.substring(0, 200));
      errorMessage += ' (HTML response received - possibly CORS or server error)';
    } else if (contentType?.includes('application/json')) {
      try {
        const errorData = await response.json();
        errorMessage += ` - ${JSON.stringify(errorData)}`;
      } catch {
        errorMessage += ' (Invalid JSON in error response)';
      }
    }

    throw new ApiError(response, errorMessage);
  }

  try {
    return await response.json();
  } catch (error) {
    const text = await response.text();
    console.error('Failed to parse JSON response:', text.substring(0, 200));
    throw new Error(
      `Invalid JSON response: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * 新しいノートを作成します。
 * POST /notes
 */
export async function createNote(): Promise<PostNoteResponse> {
  const response = await apiFetch('/notes', {
    method: 'POST',
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
