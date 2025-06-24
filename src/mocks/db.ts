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
  tag: string;
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
    const channel4: Channel = {
      id: '2490c236-b0a2-4482-a8aa-d6d9b5f5f923',
      path: 'event/hackathon/25spring/16/design',
    };
    const channel5: Channel = {
      id: '2490c236-b0a2-4482-a8aa-d6d9b5f5f924',
      path: 'event/hackathon/25spring/16/planning',
    };
    const channel6: Channel = {
      id: '2490c236-b0a2-4482-a8aa-d6d9b5f5f925',
      path: 'project/circuledge',
    };
    const channel7: Channel = {
      id: '2490c236-b0a2-4482-a8aa-d6d9b5f5f926',
      path: 'personal/learning',
    };
    this.channels.set(channel1.id, channel1);
    this.channels.set(channel2.id, channel2);
    this.channels.set(channel3.id, channel3);
    this.channels.set(channel4.id, channel4);
    this.channels.set(channel5.id, channel5);
    this.channels.set(channel6.id, channel6);
    this.channels.set(channel7.id, channel7);

    const note1: DbNote = {
      id: '0197882d-208b-7c5a-bf60-89eafb904106',
      revision: '0197882d-208b-7c5a-bf60-89eafb904106',
      channel: channel1.id,
      permission: 'limited' as NotePermission,
      title: 'ポラーノの広場',
      body: 'あのイーハトーヴォのすきとおった風、夏でも底に冷たさをもつ青いそら、うつくしい森で飾られたモリーオ市、郊外のぎらぎらひかる草の波。',
      summary: 'あのイーハトーヴォの...',
      tag: '宮沢賢治',
      createdAt: 1750486800, // 2025-06-21T09:00:00Z
      updatedAt: 1750486800, // 2025-06-21T09:00:00Z
    };
    const note2: DbNote = {
      id: '0197882d-208b-7c5a-bf60-89eafb904107',
      revision: '0197882d-208b-7c5a-bf60-89eafb904107',
      channel: channel2.id,
      permission: 'public' as NotePermission,
      title: 'ハッカソン開発Tips',
      body: 'APIのモックにはmswを使うと便利です。フロントエンドとバックエンドの並行開発がスムーズに進みます。\n\n## 主な利点\n\n- リアルタイムでAPIレスポンスをテスト可能\n- バックエンド開発を待たずにフロントエンド開発を進められる\n- エラーケースのテストが簡単',
      summary: 'mswを使ったAPIモック',
      tag: 'frontend,hackathon,development',
      createdAt: 1750488600, // 2025-06-21T09:30:00Z
      updatedAt: 1750488600, // 2025-06-21T09:30:00Z
    };
    const note3: DbNote = {
      id: '0197882d-208b-7c5a-bf60-89eafb904108',
      revision: '0197882d-208b-7c5a-bf60-89eafb904108',
      channel: channel3.id,
      permission: 'private' as NotePermission,
      title: 'バックエンド開発のポイント',
      body: 'バックエンドの設計では、APIの設計とデータベースの正規化が重要です。特に、スケーラビリティを考慮した設計が求められます。\n\n## 設計のポイント\n\n1. RESTful APIの設計\n2. データベースの正規化\n3. セキュリティの考慮\n4. パフォーマンスの最適化',
      summary: 'バックエンドの設計ポイント',
      tag: 'backend,hackathon,development',
      createdAt: 1750490400, // 2025-06-21T10:00:00Z
      updatedAt: 1750490400, // 2025-06-21T10:00:00Z
    };
    const note4: DbNote = {
      id: '0197882d-208b-7c5a-bf60-89eafb904109',
      revision: '0197882d-208b-7c5a-bf60-89eafb904109',
      channel: channel2.id,
      permission: 'limited' as NotePermission,
      title: 'Markdownの使い方',
      body: 'Markdown は色々な事が出来ます。例えば、**太字**や*斜体*、[リンク](https://example.com)など。\nまた、コードブロックも使えます。\n```javascript\nconsole.log("Hello, World!");\n```\n',
      summary: 'Markdownの使い方',
      tag: 'markdown,development',
      createdAt: 1750494000, // 2025-06-21T11:00:00Z
      updatedAt: 1750494000, // 2025-06-21T11:00:00Z
    };
    const note5: DbNote = {
      id: '0197882d-208b-7c5a-bf60-89eafb90410a',
      revision: '0197882d-208b-7c5a-bf60-89eafb90410a',
      channel: channel4.id,
      permission: 'public' as NotePermission,
      title: 'UIデザインのベストプラクティス',
      body: '良いUIデザインのための基本原則について説明します。\n\n## デザインの基本原則\n\n1. **一貫性**: 同じ要素は同じ見た目・動作にする\n2. **視認性**: 重要な情報は目立つようにする\n3. **フィードバック**: ユーザーの操作に対して適切な反応を示す\n4. **アクセシビリティ**: 誰もが使いやすいインターフェースにする\n\n## カラーパレット\n\n- Primary: #3B82F6\n- Secondary: #10B981\n- Warning: #F59E0B\n- Error: #EF4444',
      summary: 'UIデザインの基本原則とカラーパレット',
      tag: 'design,ui,accessibility',
      createdAt: 1750497600, // 2025-06-21T12:00:00Z
      updatedAt: 1750497600, // 2025-06-21T12:00:00Z
    };
    const note6: DbNote = {
      id: '0197882d-208b-7c5a-bf60-89eafb90410b',
      revision: '0197882d-208b-7c5a-bf60-89eafb90410b',
      channel: channel5.id,
      permission: 'limited' as NotePermission,
      title: 'プロジェクト計画書',
      body: '# CircleEdge プロジェクト計画\n\n## 概要\n\nCircleEdgeは、サークル活動におけるノート共有とコラボレーションを効率化するWebアプリケーションです。\n\n## 目標\n\n- メンバー間での情報共有を円滑にする\n- リアルタイムコラボレーションを可能にする\n- 過去の履歴を簡単に追跡できる\n\n## スケジュール\n\n- Phase 1: 基本機能実装 (6月)\n- Phase 2: リアルタイム機能 (7月)\n- Phase 3: 高度な検索機能 (8月)',
      summary: 'CircleEdgeプロジェクトの全体計画',
      tag: 'planning,project,circuledge',
      createdAt: 1750501200, // 2025-06-21T13:00:00Z
      updatedAt: 1750501200, // 2025-06-21T13:00:00Z
    };
    const note7: DbNote = {
      id: '0197882d-208b-7c5a-bf60-89eafb90410c',
      revision: '0197882d-208b-7c5a-bf60-89eafb90410c',
      channel: channel6.id,
      permission: 'public' as NotePermission,
      title: 'Vue.js 3とTypeScriptのベストプラクティス',
      body: "Vue.js 3とTypeScriptを組み合わせた開発のベストプラクティスをまとめます。\n\n## Composition APIの活用\n\n```typescript\nimport { ref, computed } from 'vue';\n\nexport default defineComponent({\n  setup() {\n    const count = ref(0);\n    const doubleCount = computed(() => count.value * 2);\n    \n    const increment = () => {\n      count.value++;\n    };\n    \n    return {\n      count,\n      doubleCount,\n      increment\n    };\n  }\n});\n```\n\n## 型安全性の確保\n\n- 適切な型定義を作成する\n- Genericsを活用する\n- strict modeを有効にする",
      summary: 'Vue.js 3とTypeScriptの開発手法',
      tag: 'vue,typescript,frontend,development',
      createdAt: 1750504800, // 2025-06-21T14:00:00Z
      updatedAt: 1750504800, // 2025-06-21T14:00:00Z
    };
    const note8: DbNote = {
      id: '0197882d-208b-7c5a-bf60-89eafb90410d',
      revision: '0197882d-208b-7c5a-bf60-89eafb90410d',
      channel: channel7.id,
      permission: 'private' as NotePermission,
      title: 'JavaScript学習メモ',
      body: "# JavaScript学習の記録\n\n## 今日学んだこと\n\n### 非同期処理\n\n- Promiseの基本的な使い方\n- async/awaitの活用方法\n- エラーハンドリングのベストプラクティス\n\n```javascript\nasync function fetchData() {\n  try {\n    const response = await fetch('/api/data');\n    const data = await response.json();\n    return data;\n  } catch (error) {\n    console.error('Error fetching data:', error);\n    throw error;\n  }\n}\n```\n\n### 配列操作メソッド\n\n- map(), filter(), reduce()の違いと使い分け\n- forEach()との違い\n- チェーンメソッドの活用",
      summary: 'JavaScript非同期処理と配列操作の学習記録',
      tag: 'javascript,learning,async,array',
      createdAt: 1750508400, // 2025-06-21T15:00:00Z
      updatedAt: 1750508400, // 2025-06-21T15:00:00Z
    };
    const note9: DbNote = {
      id: '0197882d-208b-7c5a-bf60-89eafb90410e',
      revision: '0197882d-208b-7c5a-bf60-89eafb90410e',
      channel: channel1.id,
      permission: 'public' as NotePermission,
      title: 'ハッカソン振り返り',
      body: '# 2025年春季ハッカソン振り返り\n\n## 良かった点\n\n- チーム連携がスムーズだった\n- 技術選定が適切だった\n- 時間管理ができていた\n- プレゼンテーションが効果的だった\n\n## 改善点\n\n- 初期要件定義により時間をかけるべきだった\n- テストケースの準備が不十分だった\n- デザインシステムの統一性を高める必要があった\n\n## 次回への活かし方\n\n- 事前準備により多くの時間を割く\n- テスト駆動開発を取り入れる\n- デザインガイドラインを最初に決める',
      summary: 'ハッカソンの成果と反省点、次回への改善案',
      tag: 'hackathon,retrospective,teamwork',
      createdAt: 1750512000, // 2025-06-21T16:00:00Z
      updatedAt: 1750512000, // 2025-06-21T16:00:00Z
    };
    const note10: DbNote = {
      id: '0197882d-208b-7c5a-bf60-89eafb90410f',
      revision: '0197882d-208b-7c5a-bf60-89eafb90410f',
      channel: channel3.id,
      permission: 'limited' as NotePermission,
      title: 'API設計ガイドライン',
      body: '# RESTful API設計ガイドライン\n\n## 基本原則\n\n### URLの設計\n\n- リソース指向の設計\n- 複数形での命名（例: `/users`, `/notes`）\n- 階層構造の適切な表現\n\n### HTTPメソッドの使い分け\n\n- `GET`: データの取得\n- `POST`: 新規作成\n- `PUT`: 全体更新\n- `PATCH`: 部分更新\n- `DELETE`: 削除\n\n### ステータスコード\n\n- 200: 成功\n- 201: 作成成功\n- 400: リクエストエラー\n- 401: 認証エラー\n- 404: リソースが見つからない\n- 500: サーバーエラー\n\n## レスポンス形式\n\n```json\n{\n  "data": {},\n  "meta": {\n    "total": 100,\n    "page": 1,\n    "limit": 10\n  },\n  "errors": []\n}\n```',
      summary: 'RESTful APIの設計指針とベストプラクティス',
      tag: 'api,rest,backend,guidelines',
      createdAt: 1750515600, // 2025-06-21T17:00:00Z
      updatedAt: 1750515600, // 2025-06-21T17:00:00Z
    };
    this.notes.set(note1.id, note1);
    this.notes.set(note2.id, note2);
    this.notes.set(note3.id, note3);
    this.notes.set(note4.id, note4);
    this.notes.set(note5.id, note5);
    this.notes.set(note6.id, note6);
    this.notes.set(note7.id, note7);
    this.notes.set(note8.id, note8);
    this.notes.set(note9.id, note9);
    this.notes.set(note10.id, note10);

    this.history.push(this.toNoteSummary(note1));
    this.history.push(this.toNoteSummary(note2));
    this.history.push(this.toNoteSummary(note3));
    this.history.push(this.toNoteSummary(note4));
    this.history.push(this.toNoteSummary(note5));
    this.history.push(this.toNoteSummary(note6));
    this.history.push(this.toNoteSummary(note7));
    this.history.push(this.toNoteSummary(note8));
    this.history.push(this.toNoteSummary(note9));
    this.history.push(this.toNoteSummary(note10));
  }

  private toNoteSummary(note: DbNote): NoteSummary {
    return {
      id: note.id,
      channel: note.channel,
      permission: note.permission,
      title: note.title,
      summary: note.summary,
      tag: note.tag,
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
        allNotes = allNotes.filter((note) => regexes.some((regex) => regex.test(note.tag)));
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
    const newNote: DbNote = {
      id: newId,
      revision: newRevision,
      channel: this.settings.defaultChannel,
      permission: 'private' as NotePermission,
      title: '新しいノート',
      body: '# 新しいノート\n\nここにコンテンツを入力してください...',
      summary: '新しく作成されたノート',
      tag: 'new',
      createdAt: now,
      updatedAt: now,
    };
    this.notes.set(newId, newNote);
    this.history.unshift(this.toNoteSummary(newNote));
    return newNote;
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
