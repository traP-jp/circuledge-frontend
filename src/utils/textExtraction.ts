// Markdownテキストからタイトルと要約を抽出するユーティリティ関数

/**
 * Markdownテキストからタイトルを抽出する
 * @param markdown - Markdownテキスト
 * @returns 抽出されたタイトル
 */
export function extractTitle(markdown: string): string {
  if (!markdown || typeof markdown !== 'string') {
    return '無題';
  }

  const lines = markdown.trim().split(/\r?\n/);

  // 最初の行をチェック
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    // H1見出し (#) を探す
    const h1Match = trimmedLine.match(/^#+\s*(.+)$/);
    if (h1Match) {
      return h1Match[1].trim();
    }

    // 見出し記号がない場合は、最初の非空行をタイトルとする
    if (trimmedLine) {
      return trimmedLine;
    }
  }

  return '無題';
}

/**
 * Markdownテキストから要約を抽出する
 * @param markdown - Markdownテキスト
 * @param maxLength - 最大文字数（デフォルト: 100）
 * @returns 抽出された要約
 */
export function extractSummary(markdown: string, maxLength: number = 100): string {
  if (!markdown || typeof markdown !== 'string') {
    return '概要なし';
  }

  let processed = markdown.trim();

  // Markdownの構文を削除
  processed = processed
    // 見出し記号を削除
    .replace(/^#{1,6}\s+/gm, '')
    // 太字・斜体記号を削除
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    // リンク記法を削除 [text](url) -> text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // 画像記法を削除
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '')
    // インラインコードを削除
    .replace(/`([^`]+)`/g, '$1')
    // コードブロックを削除
    .replace(/```[\s\S]*?```/g, '')
    .replace(/~~~[\s\S]*?~~~/g, '')
    // 水平線を削除
    .replace(/^[\s]*[-=]{3,}[\s]*$/gm, '')
    // リスト記号を削除
    .replace(/^[\s]*[-*+]\s+/gm, '')
    .replace(/^[\s]*\d+\.\s+/gm, '')
    // 引用記号を削除
    .replace(/^[\s]*>\s*/gm, '')
    // 警告ボックスを削除
    .replace(/^[\s]*:::[a-z]+[\s\S]*?:::[\s]*$/gm, '')
    // 数式を削除
    .replace(/\$\$[\s\S]*?\$\$/g, '')
    .replace(/\$[^$\n]+\$/g, '')
    // 複数の空白・改行を統一
    .replace(/\s+/g, ' ')
    .trim();

  // 最初の文または最大文字数まで抽出
  const sentences = processed.split(/[.。!！?？]/);
  let summary = sentences[0]?.trim() || processed;

  if (summary.length > maxLength) {
    summary = summary.substring(0, maxLength) + '...';
  }

  return summary || '概要なし';
}

/**
 * 日付をフォーマットする
 * @param dateString - 日付文字列
 * @returns フォーマットされた日付文字列
 */
export function formatDate(dateString: string): string {
  if (!dateString) return '';

  try {
    const date = new Date(dateString);
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch (error) {
    console.warn('Date formatting error:', error);
    return dateString;
  }
}
