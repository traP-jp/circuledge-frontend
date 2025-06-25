import { http, HttpResponse } from 'msw';
import { db } from './db';
import type {
  UUID,
  GetNotesResponse,
  PostNoteResponse,
  PutNoteRequest,
  PutNoteConflictResponse,
  GetNoteResponse,
  GetChannelsResponse,
  GetMyHistoryResponse,
  GetNoteHistoryResponse,
  GetUserSettingsResponse,
  PutUserSettingsRequest,
  NotePermission,
} from '../types/api.d.ts';

const API_BASE_URL = '/api';

export const handlers = [
  // GET /notes
  http.get(`${API_BASE_URL}/notes`, ({ request }) => {
    const url = new URL(request.url);
    const params = Object.fromEntries(url.searchParams.entries());
    const notes = db.getNotes(params);
    const response: GetNotesResponse = {
      total: notes.length,
      notes,
    };
    return HttpResponse.json(response);
  }),

  // POST /notes
  http.post(`${API_BASE_URL}/notes`, () => {
    const newNote = db.createNote();
    const response: PostNoteResponse = {
      id: newNote.id,
      channel: newNote.channel,
      permission: newNote.permission as NotePermission,
      revision: newNote.revision,
    };
    return HttpResponse.json(response, { status: 201 });
  }),

  // GET /notes/:noteId
  http.get(`${API_BASE_URL}/notes/:noteId`, ({ params }) => {
    const noteId = params.noteId as UUID;
    const note = db.getNote(noteId);

    if (!note) {
      return new HttpResponse(null, { status: 404 });
    }

    const response: GetNoteResponse = {
      revision: note.revision,
      channel: note.channel,
      permission: note.permission,
      body: note.body,
      createdAt: new Date(note.createdAt * 1000).getTime(),
      updatedAt: new Date(note.updatedAt * 1000).getTime(),
    };
    return HttpResponse.json(response);
  }),

  // PUT /notes/:noteId
  http.put(`${API_BASE_URL}/notes/:noteId`, async ({ request, params }) => {
    const noteId = params.noteId as UUID;
    const requestBody = (await request.json()) as PutNoteRequest;
    const currentNote = db.getNote(noteId);

    if (!currentNote) {
      return new HttpResponse(null, { status: 404 });
    }

    // コンフリクトテスト用チャンネルの場合、常にコンフリクトを発生させる
    if (db.isConflictTestChannel(currentNote.channel)) {
      // サーバー上の内容を少し変更してコンフリクトを再現
      const simulatedServerContent =
        currentNote.body +
        '\n\n## サーバー上で他のユーザーによって追加された内容\n\n同時編集により、この内容が追加されました。';

      // 新しいリビジョンIDを生成（サーバー上で変更されたことを示す）
      const latestRevision = crypto.randomUUID();

      // サーバー上のノートを更新（他のユーザーの編集をシミュレート）
      db.updateNote(noteId, {
        body: simulatedServerContent,
      });

      // 更新後のノートを取得して最新リビジョンを取得
      const updatedNote = db.getNote(noteId);

      const response: PutNoteConflictResponse = {
        'latest-revision': updatedNote?.revision || latestRevision,
        channel: currentNote.channel,
        permission: currentNote.permission as NotePermission,
        diff: db.generateConflictDiff(simulatedServerContent, requestBody.body),
      };
      return HttpResponse.json(response, { status: 409 });
    }

    // 通常のリビジョンチェック
    if (currentNote.revision !== requestBody.revision) {
      const response: PutNoteConflictResponse = {
        'latest-revision': currentNote.revision,
        channel: currentNote.channel,
        permission: currentNote.permission as NotePermission,
        diff: db.generateConflictDiff(currentNote.body, requestBody.body),
      };
      return HttpResponse.json(response, { status: 409 });
    }

    // 正常な更新処理
    db.updateNote(noteId, {
      channel: requestBody.channel,
      permission: requestBody.permission,
      body: requestBody.body,
      // titleやtagsの更新もここに追加できます
    });

    return new HttpResponse(null, { status: 204 });
  }),

  // DELETE /notes/:noteId
  http.delete(`${API_BASE_URL}/notes/:noteId`, ({ params }) => {
    const success = db.deleteNote(params.noteId as UUID);
    return new HttpResponse(null, { status: success ? 204 : 404 });
  }),

  // GET /channels
  http.get(`${API_BASE_URL}/channels`, () => {
    const response: GetChannelsResponse = db.getChannels();
    return HttpResponse.json(response);
  }),

  // GET /me/history
  http.get(`${API_BASE_URL}/me/history`, () => {
    const history = db.getHistory();
    const response: GetMyHistoryResponse = {
      total: history.length,
      notes: history,
    };
    return HttpResponse.json(response);
  }),

  // GET /channels
  http.get(`${API_BASE_URL}/channels`, () => {
    const response: GetChannelsResponse = db.getChannels();
    return HttpResponse.json(response);
  }),

  // GET /me/history
  http.get(`${API_BASE_URL}/me/history`, ({ request }) => {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // ユーザーの履歴として、全ノートを時系列順に返す（簡易実装）
    const allNotes = db.getNotes({});
    const paginatedNotes = allNotes.slice(offset, offset + limit);

    const response: GetMyHistoryResponse = {
      total: allNotes.length,
      notes: paginatedNotes,
    };
    return HttpResponse.json(response);
  }),

  // GET /notes/:noteId/history
  http.get(`${API_BASE_URL}/notes/:noteId/history`, ({ params }) => {
    const note = db.getNote(params.noteId as UUID);
    if (!note) {
      return new HttpResponse(null, { status: 404 });
    }
    // 複数の履歴リビジョンをモック
    const response: GetNoteHistoryResponse = {
      total: 3,
      notes: [
        {
          revision: note.revision,
          channel: note.channel,
          permission: note.permission,
          body: note.body,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          revision: crypto.randomUUID(),
          channel: note.channel,
          permission: note.permission,
          body: note.body + '\n\n（前回の編集内容）',
          createdAt: Date.now() - 3600000, // 1時間前
          updatedAt: Date.now() - 3600000,
        },
        {
          revision: crypto.randomUUID(),
          channel: note.channel,
          permission: note.permission,
          body: '（初期版の内容）',
          createdAt: Date.now() - 7200000, // 2時間前
          updatedAt: Date.now() - 7200000,
        },
      ],
    };
    return HttpResponse.json(response);
  }),

  // GET /me/settings
  http.get(`${API_BASE_URL}/me/settings`, () => {
    const response: GetUserSettingsResponse = db.getSettings();
    return HttpResponse.json(response);
  }),

  // PUT /me/settings
  http.put(`${API_BASE_URL}/me/settings`, async ({ request }) => {
    const body = (await request.json()) as PutUserSettingsRequest;
    db.updateSettings(body);
    return new HttpResponse(null, { status: 204 });
  }),
];
