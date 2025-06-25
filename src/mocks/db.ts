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

// チャンネルIDの定数定義
const CHANNEL_IDS = {
  HACKATHON_ROOT: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  HACKATHON_FRONTEND: '2490c236-b0a2-4482-a8aa-d6d9b5f5f921',
  HACKATHON_BACKEND: '2490c236-b0a2-4482-a8aa-d6d9b5f5f922',
  HACKATHON_DESIGN: '2490c236-b0a2-4482-a8aa-d6d9b5f5f923',
  HACKATHON_PLANNING: '2490c236-b0a2-4482-a8aa-d6d9b5f5f924',
  PROJECT_CIRCULEDGE: '2490c236-b0a2-4482-a8aa-d6d9b5f5f925',
  PERSONAL_LEARNING: '2490c236-b0a2-4482-a8aa-d6d9b5f5f926',
  TEST_CONFLICT: '2490c236-b0a2-4482-a8aa-d6d9b5f5f999', // コンフリクトテスト用
} as const;

class MockDB {
  private notes: Map<UUID, DbNote> = new Map();
  private channels: Map<UUID, Channel> = new Map();
  private settings: UserSettings = {
    defaultChannel: CHANNEL_IDS.HACKATHON_FRONTEND,
  };
  private history: NoteSummary[] = [];

  constructor() {
    this.initializeChannels();
    this.initializeNotes();
  }

  /**
   * チャンネルのシードデータを初期化
   */
  private initializeChannels(): void {
    const channels: Channel[] = [
      {
        id: CHANNEL_IDS.HACKATHON_ROOT,
        path: 'event/hackathon/25spring/16',
      },
      {
        id: CHANNEL_IDS.HACKATHON_FRONTEND,
        path: 'event/hackathon/25spring/16/frontend',
      },
      {
        id: CHANNEL_IDS.HACKATHON_BACKEND,
        path: 'event/hackathon/25spring/16/backend',
      },
      {
        id: CHANNEL_IDS.HACKATHON_DESIGN,
        path: 'event/hackathon/25spring/16/design',
      },
      {
        id: CHANNEL_IDS.HACKATHON_PLANNING,
        path: 'event/hackathon/25spring/16/planning',
      },
      {
        id: CHANNEL_IDS.PROJECT_CIRCULEDGE,
        path: 'project/circuledge',
      },
      {
        id: CHANNEL_IDS.PERSONAL_LEARNING,
        path: 'personal/learning',
      },
      {
        id: CHANNEL_IDS.TEST_CONFLICT,
        path: 'test/conflict',
      },
    ];

    channels.forEach((channel) => {
      this.channels.set(channel.id, channel);
    });
  }

  /**
   * ノートのシードデータを初期化
   */
  private initializeNotes(): void {
    const notes: DbNote[] = [
      {
        id: '0197882d-208b-7c5a-bf60-89eafb904106',
        revision: '0197882d-208b-7c5a-bf60-89eafb904106',
        channel: CHANNEL_IDS.HACKATHON_ROOT,
        permission: 'limited' as NotePermission,
        title: 'ポラーノの広場',
        body: 'あのイーハトーヴォのすきとおった風、夏でも底に冷たさをもつ青いそら、うつくしい森で飾られたモリーオ市、郊外のぎらぎらひかる草の波。',
        summary: 'あのイーハトーヴォの...',
        tag: '宮沢賢治',
        createdAt: 1750486800000, // 2025-06-21T09:00:00Z
        updatedAt: 1750486800000, // 2025-06-21T09:00:00Z
      },
      {
        id: '0197882d-208b-7c5a-bf60-89eafb904107',
        revision: '0197882d-208b-7c5a-bf60-89eafb904107',
        channel: CHANNEL_IDS.HACKATHON_FRONTEND,
        permission: 'public' as NotePermission,
        title: 'ハッカソン開発Tips',
        body: 'APIのモックにはmswを使うと便利です。フロントエンドとバックエンドの並行開発がスムーズに進みます。\n\n## 主な利点\n\n- リアルタイムでAPIレスポンスをテスト可能\n- バックエンド開発を待たずにフロントエンド開発を進められる\n- エラーケースのテストが簡単',
        summary: 'mswを使ったAPIモック',
        tag: 'frontend,hackathon,development',
        createdAt: 1750488600000, // 2025-06-21T09:30:00Z
        updatedAt: 1750488600000, // 2025-06-21T09:30:00Z
      },
      {
        id: '0197882d-208b-7c5a-bf60-89eafb904108',
        revision: '0197882d-208b-7c5a-bf60-89eafb904108',
        channel: CHANNEL_IDS.HACKATHON_BACKEND,
        permission: 'private' as NotePermission,
        title: 'バックエンド開発のポイント',
        body: 'バックエンドの設計では、APIの設計とデータベースの正規化が重要です。特に、スケーラビリティを考慮した設計が求められます。\n\n## 設計のポイント\n\n1. RESTful APIの設計\n2. データベースの正規化\n3. セキュリティの考慮\n4. パフォーマンスの最適化',
        summary: 'バックエンドの設計ポイント',
        tag: 'backend,hackathon,development',
        createdAt: 1750490400000, // 2025-06-21T10:00:00Z
        updatedAt: 1750490400000, // 2025-06-21T10:00:00Z
      },
      {
        id: '0197882d-208b-7c5a-bf60-89eafb904109',
        revision: '0197882d-208b-7c5a-bf60-89eafb904109',
        channel: CHANNEL_IDS.HACKATHON_FRONTEND,
        permission: 'limited' as NotePermission,
        title: 'Markdownの使い方',
        body: 'Markdown は色々な事が出来ます。例えば、**太字**や*斜体*、[リンク](https://example.com)など。\nまた、コードブロックも使えます。\n```javascript\nconsole.log("Hello, World!");\n```\n',
        summary: 'Markdownの使い方',
        tag: 'markdown,development',
        createdAt: 1750494000000, // 2025-06-21T11:00:00Z
        updatedAt: 1750494000000, // 2025-06-21T11:00:00Z
      },
      {
        id: '0197882d-208b-7c5a-bf60-89eafb90410a',
        revision: '0197882d-208b-7c5a-bf60-89eafb90410a',
        channel: CHANNEL_IDS.HACKATHON_DESIGN,
        permission: 'public' as NotePermission,
        title: 'UIデザインのベストプラクティス',
        body: '良いUIデザインのための基本原則について説明します。\n\n## デザインの基本原則\n\n1. **一貫性**: 同じ要素は同じ見た目・動作にする\n2. **視認性**: 重要な情報は目立つようにする\n3. **フィードバック**: ユーザーの操作に対して適切な反応を示す\n4. **アクセシビリティ**: 誰もが使いやすいインターフェースにする\n\n## カラーパレット\n\n- Primary: #3B82F6\n- Secondary: #10B981\n- Warning: #F59E0B\n- Error: #EF4444',
        summary: 'UIデザインの基本原則とカラーパレット',
        tag: 'design,ui,accessibility',
        createdAt: 1750497600000, // 2025-06-21T12:00:00Z
        updatedAt: 1750497600000, // 2025-06-21T12:00:00Z
      },
      {
        id: '0197882d-208b-7c5a-bf60-89eafb90410b',
        revision: '0197882d-208b-7c5a-bf60-89eafb90410b',
        channel: CHANNEL_IDS.HACKATHON_PLANNING,
        permission: 'limited' as NotePermission,
        title: 'プロジェクト計画書',
        body: '# CircleEdge プロジェクト計画\n\n## 概要\n\nCircleEdgeは、サークル活動におけるノート共有とコラボレーションを効率化するWebアプリケーションです。\n\n## 目標\n\n- メンバー間での情報共有を円滑にする\n- リアルタイムコラボレーションを可能にする\n- 過去の履歴を簡単に追跡できる\n\n## スケジュール\n\n- Phase 1: 基本機能実装 (6月)\n- Phase 2: リアルタイム機能 (7月)\n- Phase 3: 高度な検索機能 (8月)',
        summary: 'CircleEdgeプロジェクトの全体計画',
        tag: 'planning,project,circuledge',
        createdAt: 1750501200000, // 2025-06-21T13:00:00Z
        updatedAt: 1750501200000, // 2025-06-21T13:00:00Z
      },
      {
        id: '0197882d-208b-7c5a-bf60-89eafb90410c',
        revision: '0197882d-208b-7c5a-bf60-89eafb90410c',
        channel: CHANNEL_IDS.PROJECT_CIRCULEDGE,
        permission: 'public' as NotePermission,
        title: 'Vue.js 3とTypeScriptのベストプラクティス',
        body: "Vue.js 3とTypeScriptを組み合わせた開発のベストプラクティスをまとめます。\n\n## Composition APIの活用\n\n```typescript\nimport { ref, computed } from 'vue';\n\nexport default defineComponent({\n  setup() {\n    const count = ref(0);\n    const doubleCount = computed(() => count.value * 2);\n    \n    const increment = () => {\n      count.value++;\n    };\n    \n    return {\n      count,\n      doubleCount,\n      increment\n    };\n  }\n});\n```\n\n## 型安全性の確保\n\n- 適切な型定義を作成する\n- Genericsを活用する\n- strict modeを有効にする",
        summary: 'Vue.js 3とTypeScriptの開発手法',
        tag: 'vue,typescript,frontend,development',
        createdAt: 1750504800000, // 2025-06-21T14:00:00Z
        updatedAt: 1750504800000, // 2025-06-21T14:00:00Z
      },
      {
        id: '0197882d-208b-7c5a-bf60-89eafb90410d',
        revision: '0197882d-208b-7c5a-bf60-89eafb90410d',
        channel: CHANNEL_IDS.PERSONAL_LEARNING,
        permission: 'private' as NotePermission,
        title: 'JavaScript学習メモ',
        body: "# JavaScript学習の記録\n\n## 今日学んだこと\n\n### 非同期処理\n\n- Promiseの基本的な使い方\n- async/awaitの活用方法\n- エラーハンドリングのベストプラクティス\n\n```javascript\nasync function fetchData() {\n  try {\n    const response = await fetch('/api/data');\n    const data = await response.json();\n    return data;\n  } catch (error) {\n    console.error('Error fetching data:', error);\n    throw error;\n  }\n}\n```\n\n### 配列操作メソッド\n\n- map(), filter(), reduce()の違いと使い分け\n- forEach()との違い\n- チェーンメソッドの活用",
        summary: 'JavaScript非同期処理と配列操作の学習記録',
        tag: 'javascript,learning,async,array',
        createdAt: 1750508400000, // 2025-06-21T15:00:00Z
        updatedAt: 1750508400000, // 2025-06-21T15:00:00Z
      },
      {
        id: '0197882d-208b-7c5a-bf60-89eafb90410e',
        revision: '0197882d-208b-7c5a-bf60-89eafb90410e',
        channel: CHANNEL_IDS.HACKATHON_ROOT,
        permission: 'public' as NotePermission,
        title: 'ハッカソン振り返り',
        body: '# 2025年春季ハッカソン振り返り\n\n## 良かった点\n\n- チーム連携がスムーズだった\n- 技術選定が適切だった\n- 時間管理ができていた\n- プレゼンテーションが効果的だった\n\n## 改善点\n\n- 初期要件定義により時間をかけるべきだった\n- テストケースの準備が不十分だった\n- デザインシステムの統一性を高める必要があった\n\n## 次回への活かし方\n\n- 事前準備により多くの時間を割く\n- テスト駆動開発を取り入れる\n- デザインガイドラインを最初に決める',
        summary: 'ハッカソンの成果と反省点、次回への改善案',
        tag: 'hackathon,retrospective,teamwork',
        createdAt: 1750512000000, // 2025-06-21T16:00:00Z
        updatedAt: 1750512000000, // 2025-06-21T16:00:00Z
      },
      {
        id: '0197882d-208b-7c5a-bf60-89eafb90410f',
        revision: '0197882d-208b-7c5a-bf60-89eafb90410f',
        channel: CHANNEL_IDS.HACKATHON_BACKEND,
        permission: 'limited' as NotePermission,
        title: 'API設計ガイドライン',
        body: '# RESTful API設計ガイドライン\n\n## 基本原則\n\n### URLの設計\n\n- リソース指向の設計\n- 複数形での命名（例: `/users`, `/notes`）\n- 階層構造の適切な表現\n\n### HTTPメソッドの使い分け\n\n- `GET`: データの取得\n- `POST`: 新規作成\n- `PUT`: 全体更新\n- `PATCH`: 部分更新\n- `DELETE`: 削除\n\n### ステータスコード\n\n- 200: 成功\n- 201: 作成成功\n- 400: リクエストエラー\n- 401: 認証エラー\n- 404: リソースが見つからない\n- 500: サーバーエラー\n\n## レスポンス形式\n\n```json\n{\n  "data": {},\n  "meta": {\n    "total": 100,\n    "page": 1,\n    "limit": 10\n  },\n  "errors": []\n}\n```',
        summary: 'RESTful APIの設計指針とベストプラクティス',
        tag: 'api,rest,backend,guidelines',
        createdAt: 1750515600000, // 2025-06-21T17:00:00Z
        updatedAt: 1750515600000, // 2025-06-21T17:00:00Z
      },
      {
        id: '0197882d-208b-7c5a-bf60-89eafb904110',
        revision: '0197882d-208b-7c5a-bf60-89eafb904110',
        channel: CHANNEL_IDS.TEST_CONFLICT,
        permission: 'public' as NotePermission,
        title: 'コンフリクトテスト用ノート',
        body: '# コンフリクトテスト用ノート\n\nこのノートは編集コンフリクトのテスト用です。\n\n## 使い方\n\n1. このノートを編集してください\n2. PUTリクエストを送信すると、必ずコンフリクトが発生します\n3. コンフリクト解決機能をテストできます',
        summary: '編集コンフリクトのテスト用ノート',
        tag: 'test,conflict,debug',
        createdAt: 1750520000000, // 2025-06-21T18:13:20Z
        updatedAt: 1750520000000, // 2025-06-21T18:13:20Z
      },
    ];

    notes.forEach((note) => {
      this.notes.set(note.id, note);
      this.history.push(this.toNoteSummary(note));
    });
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

  isConflictTestChannel(channelId: UUID): boolean {
    const channel = this.channels.get(channelId);
    return channel?.path === 'test/conflict';
  }

  /**
   * LCS（Longest Common Subsequence）を DP で計算
   * @param a - 比較対象の文字列配列1（サーバー側の行）
   * @param b - 比較対象の文字列配列2（ユーザー側の行）
   * @returns LCSテーブル（dp[i][j] = a[0..i-1]とb[0..j-1]のLCSの長さ）
   */
  private computeLCS(a: string[], b: string[]): number[][] {
    const m = a.length;
    const n = b.length;
    // dp[i][j]はa[0..i-1]とb[0..j-1]の最長共通部分列の長さを表す
    const dp = Array(m + 1)
      .fill(null)
      .map(() => Array(n + 1).fill(0));

    // DP でLCSテーブルを構築
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (a[i - 1] === b[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }

    return dp;
  }

  /**
   * SES（Shortest Edit Script）を生成してコンフリクト用の差分テキストを作成
   * LCSアルゴリズムを利用してより精密な差分を生成
   * @param serverBody - サーバー側のテキスト
   * @param userBody - ユーザー側のテキスト
   * @returns unified diff形式の差分文字列（+ 追加行、- 削除行）
   */
  generateConflictDiff(serverBody: string, userBody: string): string {
    const serverLines = serverBody.split('\n');
    const userLines = userBody.split('\n');

    // LCSテーブルを計算
    const lcsTable = this.computeLCS(serverLines, userLines);

    // SES（最短編集スクリプト）を生成
    const diff: string[] = [];
    let i = serverLines.length;
    let j = userLines.length;

    // LCSテーブルをバックトラックして編集操作を特定
    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && serverLines[i - 1] === userLines[j - 1]) {
        // 共通行：何もしない（差分に含めない）
        i--;
        j--;
      } else if (j > 0 && (i === 0 || lcsTable[i][j - 1] >= lcsTable[i - 1][j])) {
        // ユーザー側の追加行：+ プレフィックスを付ける
        diff.unshift('+ ' + userLines[j - 1]);
        j--;
      } else if (i > 0) {
        // サーバー側の削除行：- プレフィックスを付ける
        diff.unshift('- ' + serverLines[i - 1]);
        i--;
      }
    }

    // 差分が空の場合でも最低限の差分を生成
    if (diff.length === 0) {
      const serverFirstLine = serverLines[0] || '';
      const userFirstLine = userLines[0] || '';
      if (serverFirstLine !== userFirstLine) {
        diff.push('- ' + serverFirstLine);
        diff.push('+ ' + userFirstLine);
      }
    }

    return diff.join('\n');
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
