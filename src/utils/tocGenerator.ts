export interface TocItem {
  id: string;
  level: number;
  text: string;
  anchor: string;
}

export class TocGenerator {
  static generateToc(markdown: string): TocItem[] {
    const lines = markdown.split('\n');
    const tocItems: TocItem[] = [];
    const usedAnchors = new Set<string>();

    lines.forEach((line, index) => {
      const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
      if (headerMatch) {
        const level = headerMatch[1].length;
        const text = headerMatch[2].trim();
        const anchor = this.slugify(text);

        // 重複するアンカーを避ける
        let uniqueAnchor = anchor;
        let counter = 1;
        while (usedAnchors.has(uniqueAnchor)) {
          uniqueAnchor = `${anchor}-${counter}`;
          counter++;
        }
        usedAnchors.add(uniqueAnchor);

        tocItems.push({
          id: `toc-${index}`,
          level,
          text,
          anchor: uniqueAnchor,
        });
      }
    });

    return tocItems;
  }

  static slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // 特殊文字を除去
      .replace(/\s+/g, '-') // スペースをハイフンに
      .replace(/--+/g, '-') // 連続するハイフンを1つに
      .replace(/^-|-$/g, ''); // 先頭と末尾のハイフンを除去
  }

  static injectAnchors(html: string, tocItems: TocItem[]): string {
    let processedHtml = html;

    tocItems.forEach((item) => {
      const headerRegex = new RegExp(
        `(<h${item.level}[^>]*>)(${this.escapeRegex(item.text)})(</h${item.level}>)`,
        'gi'
      );

      processedHtml = processedHtml.replace(
        headerRegex,
        `$1<a id="${item.anchor}" class="header-anchor" href="#${item.anchor}"></a>$2$3`
      );
    });

    return processedHtml;
  }

  private static escapeRegex(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  static generateTocMarkup(tocItems: TocItem[], maxLevel: number = 3): string {
    const filteredItems = tocItems.filter((item) => item.level <= maxLevel);

    if (filteredItems.length === 0) {
      return '';
    }

    let tocHtml = '<div class="toc"><h2>目次</h2><ul>';
    let currentLevel = 0;

    filteredItems.forEach((item, index) => {
      const nextItem = filteredItems[index + 1];
      const nextLevel = nextItem ? nextItem.level : 0;

      // レベルに応じてネストを調整
      if (item.level > currentLevel) {
        // レベルが上がった場合
        for (let i = currentLevel; i < item.level - 1; i++) {
          tocHtml += '<ul>';
        }
      } else if (item.level < currentLevel) {
        // レベルが下がった場合
        for (let i = currentLevel; i > item.level; i--) {
          tocHtml += '</ul>';
        }
      }

      tocHtml += `<li><a href="#${item.anchor}">${item.text}</a>`;

      // 次の項目のレベルが低い場合はliを閉じない
      if (nextLevel <= item.level) {
        tocHtml += '</li>';
      }

      currentLevel = item.level;
    });

    // 残りのulタグを閉じる
    for (let i = currentLevel; i > 1; i--) {
      tocHtml += '</ul>';
    }

    tocHtml += '</ul></div>';
    return tocHtml;
  }
}

export class MarkdownProcessor {
  private tocGenerator = TocGenerator;

  processTocSyntax(markdown: string): string {
    // [TOC] 構文を見つけて置換
    const tocRegex = /\[TOC(?:\s+maxLevel=(\d+))?\]/g;

    return markdown.replace(tocRegex, (match, maxLevelStr) => {
      const maxLevel = maxLevelStr ? parseInt(maxLevelStr, 10) : 3;
      const tocItems = this.tocGenerator.generateToc(markdown);
      return this.tocGenerator.generateTocMarkup(tocItems, maxLevel);
    });
  }

  addHeaderAnchors(html: string, markdown: string): string {
    const tocItems = this.tocGenerator.generateToc(markdown);
    return this.tocGenerator.injectAnchors(html, tocItems);
  }

  processMarkdown(markdown: string): { html: string; tocItems: TocItem[] } {
    // ToC構文を処理
    const processedMarkdown = this.processTocSyntax(markdown);

    // ToC項目を生成
    const tocItems = this.tocGenerator.generateToc(markdown);

    return {
      html: processedMarkdown,
      tocItems,
    };
  }
}
