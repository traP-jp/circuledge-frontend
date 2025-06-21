import type {
  UUID,
  NoteSummary,
  NoteRevision,
  Channel,
  UserSettings,
  NotePermission,
} from '../types/api.d.ts';

// DB内で管理するノートの型。IDやタイトルなど、サマリー情報も含む
interface DbNote extends Omit<NoteRevision, 'createdAt' | 'updatedAt'> {
  id: UUID;
  title: string;
  summary: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

const generateUUID = () => crypto.randomUUID();

class MockDB {
  private notes: Map<UUID, DbNote> = new Map();
  private channels: Map<UUID, Channel> = new Map();
  private settings: UserSettings = {
    defaultChannel: '2490c236-b0a2-4482-a8aa-d6d9b5f5f921',
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
    const channel3: Channel = {
      id: '2490c236-b0a2-4482-a8aa-d6d9b5f5f922',
      path: 'event/hackathon/25spring/16/backend',
    };
    this.channels.set(channel1.id, channel1);
    this.channels.set(channel2.id, channel2);
    this.channels.set(channel3.id, channel3);

    const note1: DbNote = {
      id: '0197882d-208b-7c5a-bf60-89eafb904106',
      revision: '0197882d-208b-7c5a-bf60-89eafb904106',
      channel: channel1.id,
      permission: 'limited' as NotePermission,
      title: 'ポラーノの広場',
      body: 'あのイーハトーヴォのすきとおった風、夏でも底に冷たさをもつ青いそら、うつくしい森で飾られたモリーオ市、郊外のぎらぎらひかる草の波。',
      summary: 'あのイーハトーヴォの...',
      tags: ['宮沢賢治'],
      createdAt: 1750486800000, // 2025-06-21T09:00:00Z
      updatedAt: 1750486800000, // 2025-06-21T09:00:00Z
    };
    const note2: DbNote = {
      id: '0197882d-208b-7c5a-bf60-89eafb904107',
      revision: '0197882d-208b-7c5a-bf60-89eafb904107',
      channel: channel2.id,
      permission: 'public' as NotePermission,
      title: 'ハッカソン開発Tips',
      body: 'APIのモックにはmswを使うと便利です。フロントエンドとバックエンドの並行開発がスムーズに進みます。',
      summary: 'mswを使ったAPIモック',
      tags: ['frontend', 'hackathon', 'development'],
      createdAt: 1750488600000, // 2025-06-21T09:30:00Z
      updatedAt: 1750488600000, // 2025-06-21T09:30:00Z
    };
    const note3: DbNote = {
      id: '0197882d-208b-7c5a-bf60-89eafb904108',
      revision: '0197882d-208b-7c5a-bf60-89eafb904108',
      channel: channel3.id,
      permission: 'private' as NotePermission,
      title: 'バックエンド開発のポイント',
      body: 'バックエンドの設計では、APIの設計とデータベースの正規化が重要です。特に、スケーラビリティを考慮した設計が求められます。',
      summary: 'バックエンドの設計ポイント',
      tags: ['backend', 'hackathon', 'development'],
      createdAt: 1750490400000, // 2025-06-21T10:00:00Z
      updatedAt: 1750490400000, // 2025-06-21T10:00:00Z
    };
    const note4: DbNote = {
      id: '0197882d-208b-7c5a-bf60-89eafb904109', // IDを修正
      revision: '0197882d-208b-7c5a-bf60-89eafb904109', // revisionを修正
      channel: channel2.id, // channelを修正
      permission: 'limited' as NotePermission,
      title: 'Markdownの使い方',
      body: 'Markdown は色々な事が出来ます。例えば、**太字**や*斜体*、[リンク](https://example.com)など。\nまた、コードブロックも使えます。\n```javascript\nconsole.log("Hello, World!");\n```\n',
      summary: 'Markdownの使い方',
      tags: ['markdown', 'development'],
      createdAt: 1750494000000, // 2025-06-21T11:00:00Z
      updatedAt: 1750494000000, // 2025-06-21T11:00:00Z
    };
    this.notes.set(note1.id, note1);
    this.notes.set(note2.id, note2);
    this.notes.set(note3.id, note3);
    this.notes.set(note4.id, note4);
    this.history.push(this.toNoteSummary(note1));
    this.history.push(this.toNoteSummary(note2));
    this.history.push(this.toNoteSummary(note3));
    this.history.push(this.toNoteSummary(note4));
  }

  private toNoteSummary(note: DbNote): NoteSummary {
    return {
      id: note.id,
      channel: note.channel,
      permission: note.permission,
      title: note.title,
      summary: note.summary,
      tag: note.tags.join(','),
      updatedAt: note.updatedAt,
      createdAt: note.createdAt,
    };
  }

  // Notes
  getNotes(params: {
    channel?: UUID;
    includeChild?: boolean; // このモックでは未実装
    tag?: string[];
    title?: string;
    body?: string;
    sortkey?: 'dateAsc' | 'dateDesc' | 'titleAsc' | 'titleDesc';
  }): NoteSummary[] {
    let allNotes = Array.from(this.notes.values());

    if (params.channel) {
      allNotes = allNotes.filter((note) => note.channel === params.channel);
    }
    if (params.tag && params.tag.length > 0) {
      try {
        const regexes = params.tag.map((t) => new RegExp(t, 'i'));
        allNotes = allNotes.filter((note) =>
          note.tags.some((noteTag) => regexes.some((regex) => regex.test(noteTag)))
        );
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

    switch (params.sortkey) {
      case 'dateAsc':
        allNotes.sort((a, b) => a.updatedAt - b.updatedAt);
        break;
      case 'titleAsc':
        allNotes.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'titleDesc':
        allNotes.sort((a, b) => b.title.localeCompare(a.title));
        break;
      case 'dateDesc':
      default:
        allNotes.sort((a, b) => b.updatedAt - a.updatedAt);
        break;
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
    const now = Math.floor(Date.now() / 1000);
    return {
      id: newId,
      revision: newRevision,
      channel: this.settings.defaultChannel,
      permission: 'private' as NotePermission,
      title: '新しいノート',
      body: '',
      summary: '',
      tags: [],
      createdAt: now,
      updatedAt: now,
    };
  }

  updateNote(id: UUID, update: Partial<Omit<DbNote, 'id' | 'revision'>>): DbNote | undefined {
    const note = this.notes.get(id);
    if (!note) return undefined;

    const newRevision = generateUUID();
    const now = Math.floor(Date.now() / 1000);
    const updatedNote: DbNote = { ...note, ...update, revision: newRevision, updatedAt: now };
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
