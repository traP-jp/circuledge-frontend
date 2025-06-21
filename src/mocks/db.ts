import type { UUID, NoteSummary, NoteRevision, Channel, UserSettings } from '../types/api.d.ts';

// DB内で管理するノートの型。IDやタイトルなど、サマリー情報も含む
interface DbNote extends NoteRevision {
  id: UUID;
  title: string;
  summary: string;
  tags: string[];
}

const generateUUID = () => crypto.randomUUID();

class MockDB {
  private notes: Map<UUID, DbNote> = new Map();
  private channels: Map<UUID, Channel> = new Map();
  private settings: UserSettings = {
    defaultchannel: '2490c236-b0a2-4482-a8aa-d6d9b5f5f921',
  };
  private history: NoteSummary[] = [];

  constructor() {
    // シードデータ（初期データ）
    const channel1: Channel = {
      id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
      path: 'event/hackathon/25spring/16',
    };
    const channel2: Channel = {
      id: '2490c236-b0a2-4482-a8aa-d6d9b5f5f921',
      path: 'event/hackathon/25spring/16/frontend',
    };
    this.channels.set(channel1.id, channel1);
    this.channels.set(channel2.id, channel2);

    const note1: DbNote = {
      id: '0197882d-208b-7c5a-bf60-89eafb904106',
      revision: '0197882d-208b-7c5a-bf60-89eafb904106',
      channel: channel1.id,
      permission: 'limited',
      title: 'ポラーノの広場',
      body: 'あのイーハトーヴォのすきとおった風、夏でも底に冷たさをもつ青いそら、うつくしい森で飾られたモリーオ市、郊外のぎらぎらひかる草の波。',
      summary: 'あのイーハトーヴォの...',
      tags: ['宮沢賢治'],
    };
    const note2: DbNote = {
      id: '0197882d-208b-7c5a-bf60-89eafb904107',
      revision: '0197882d-208b-7c5a-bf60-89eafb904107',
      channel: channel2.id,
      permission: 'public',
      title: 'ハッカソン開発Tips',
      body: 'APIのモックにはmswを使うと便利です。フロントエンドとバックエンドの並行開発がスムーズに進みます。',
      summary: 'mswを使ったAPIモック',
      tags: ['frontend', 'hackathon', 'development'],
    };
    this.notes.set(note1.id, note1);
    this.notes.set(note2.id, note2);
    this.history.push(this.toNoteSummary(note1));
    this.history.push(this.toNoteSummary(note2));
  }

  private toNoteSummary(note: DbNote): NoteSummary {
    return {
      id: note.id,
      channel: note.channel,
      permission: note.permission,
      title: note.title,
      summary: note.summary,
      tag: note.tags.join(','), // `tag`はstring型なのでjoin
    };
  }

  // Notes
  getNotes(params: {
    channel?: UUID;
    'include-child'?: boolean; // このモックでは未実装
    tag?: string;
    title?: string;
    body?: string;
    sortkey?: 'date' | 'title';
  }): NoteSummary[] {
    let allNotes = Array.from(this.notes.values());

    if (params.channel) {
      allNotes = allNotes.filter((note) => note.channel === params.channel);
    }
    if (params.tag) {
      try {
        const regex = new RegExp(params.tag, 'i');
        allNotes = allNotes.filter((note) => note.tags.some((t) => regex.test(t)));
      } catch {
        /* Invalid regex, ignore */
      }
    }
    if (params.title) {
      try {
        const regex = new RegExp(params.title, 'i');
        allNotes = allNotes.filter((note) => regex.test(note.title));
      } catch {
        /* Invalid regex, ignore */
      }
    }
    if (params.body) {
      try {
        const regex = new RegExp(params.body, 'i');
        allNotes = allNotes.filter((note) => regex.test(note.body));
      } catch {
        /* Invalid regex, ignore */
      }
    }

    if (params.sortkey === 'title') {
      allNotes.sort((a, b) => a.title.localeCompare(b.title));
    } else {
      // date sort (作成日順)
      allNotes.reverse();
    }

    return allNotes.map(this.toNoteSummary);
  }

  getNote(id: UUID): DbNote | undefined {
    const note = this.notes.get(id);
    if (note) {
      this.history.unshift(this.toNoteSummary(note));
      this.history = [...new Map(this.history.map((item) => [item['id'], item])).values()];
    }
    return note;
  }

  createNote(): DbNote {
    const newId = generateUUID();
    const newRevision = generateUUID();
    const newNote: DbNote = {
      id: newId,
      revision: newRevision,
      channel: this.settings.defaultchannel,
      permission: 'private',
      title: '新しいノート',
      body: '',
      summary: '',
      tags: [],
    };
    this.notes.set(newId, newNote);
    return newNote;
  }

  updateNote(id: UUID, update: Partial<Omit<DbNote, 'id' | 'revision'>>): DbNote | undefined {
    const note = this.notes.get(id);
    if (!note) return undefined;

    const newRevision = generateUUID();
    const updatedNote = { ...note, ...update, revision: newRevision };
    this.notes.set(id, updatedNote);
    return updatedNote;
  }

  deleteNote(id: UUID): boolean {
    return this.notes.delete(id);
  }

  getHistory(): NoteSummary[] {
    return this.history;
  }

  // Channels
  getChannels(): Channel[] {
    return Array.from(this.channels.values());
  }

  // Settings
  getSettings(): UserSettings {
    return this.settings;
  }

  updateSettings(newSettings: UserSettings): UserSettings {
    this.settings = { ...this.settings, ...newSettings };
    return this.settings;
  }
}

export const db = new MockDB();
