// Markdown拡張プラグインとレンダラーの設定
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { MarkdownProcessor } from './tocGenerator';
import katex from 'katex';
import hljs from 'highlight.js';
import mermaid from 'mermaid';

// KaTeXとhighlight.jsの初期化
let mermaidInitialized = false;

// より多くのMarkdown拡張をサポートするための設定
export class AdvancedMarkdownRenderer {
  private renderer: InstanceType<typeof marked.Renderer>;
  private markdownProcessor: MarkdownProcessor;

  constructor() {
    this.renderer = new marked.Renderer();
    this.markdownProcessor = new MarkdownProcessor();
    this.setupExtensions();
    this.configureMarked();
  }

  private setupExtensions() {
    // カスタムレンダラーの設定
    this.renderer.image = ({
      href,
      title,
      text,
    }: {
      href: string;
      title: string | null;
      text: string;
    }) => {
      // 画像サイズサポート: ![alt](url =widthxheight)
      const sizeMatch = text.match(/^(.+?)\s*=(\d+)x(\d+)$/);
      if (sizeMatch) {
        const [, altText, width, height] = sizeMatch;
        return `<img src="${href}" alt="${altText.trim()}" width="${width}" height="${height}" title="${title || ''}" style="max-width: ${width}px; max-height: ${height}px;" />`;
      }

      // title属性から画像サイズを取得する方法もサポート
      const titleSizeMatch = (title || '').match(/^(.+?)\s*=(\d+)x(\d+)$/);
      if (titleSizeMatch) {
        const [, titleText, width, height] = titleSizeMatch;
        return `<img src="${href}" alt="${text}" width="${width}" height="${height}" title="${titleText.trim()}" style="max-width: ${width}px; max-height: ${height}px;" />`;
      }

      return `<img src="${href}" alt="${text}" title="${title || ''}" />`;
    };

    // コードブロックの拡張（シンタックスハイライト付き）
    this.renderer.code = ({ text, lang }: { text: string; lang?: string }) => {
      let validLang = lang && this.isValidLanguage(lang) ? lang : '';
      let processedCode = text;
      let langClass = '';
      let startLineNumber = 1;

      // 行番号サポート
      if (lang?.includes('=')) {
        const [language, startLine] = lang.split('=');
        validLang = language && this.isValidLanguage(language) ? language : '';
        startLineNumber = parseInt(startLine) || 1;
      }

      // シンタックスハイライト適用（インデント保持版）
      if (validLang) {
        try {
          // 元のテキストの各行のインデントを保持
          const originalLines = text.split('\n');
          const highlightedLines = originalLines.map(line => {
            if (line.trim() === '') {
              return line; // 空行はそのまま
            }
            
            // 先頭の空白を抽出
            const indentMatch = line.match(/^(\s*)(.*)/);
            const indent = indentMatch?.[1] || '';
            const codeContent = indentMatch?.[2] || line;
            
            // コード部分のみをハイライト
            let highlightedContent = codeContent;
            if (codeContent.trim()) {
              try {
                const highlighted = hljs.highlight(codeContent, { language: validLang });
                highlightedContent = highlighted.value;
              } catch {
                // フォールバック：元のコンテンツを使用
                highlightedContent = codeContent;
              }
            }
            
            return indent + highlightedContent;
          });
          
          processedCode = highlightedLines.join('\n');
          langClass = ` class="hljs language-${validLang}"`;
        } catch (error) {
          console.warn(`Syntax highlighting failed for language: ${validLang}`, error);
          langClass = ` class="language-${validLang}"`;
        }
      } else {
        // 言語が指定されていない場合は自動検出（インデント保持版）
        try {
          const originalLines = text.split('\n');
          const highlightedLines = originalLines.map(line => {
            if (line.trim() === '') {
              return line; // 空行はそのまま
            }
            
            // 先頭の空白を抽出
            const indentMatch = line.match(/^(\s*)(.*)/);
            const indent = indentMatch?.[1] || '';
            const codeContent = indentMatch?.[2] || line;
            
            // コード部分のみを自動検出でハイライト
            let highlightedContent = codeContent;
            if (codeContent.trim()) {
              try {
                const highlighted = hljs.highlightAuto(codeContent);
                highlightedContent = highlighted.value;
                // 最初の検出で言語クラスを設定
                if (!langClass && highlighted.language) {
                  langClass = ` class="hljs language-${highlighted.language}"`;
                }
              } catch {
                // フォールバック：元のコンテンツを使用
                highlightedContent = codeContent;
              }
            }
            
            return indent + highlightedContent;
          });
          
          processedCode = highlightedLines.join('\n');
          if (!langClass) {
            langClass = ` class="hljs"`;
          }
        } catch (error) {
          console.warn('Auto syntax highlighting failed', error);
        }
      }

      // 行番号サポート（修正版）
      if (lang?.includes('=')) {
        // 元のテキストで行数を計算
        const originalLines = text.split('\n');
        const totalLines = originalLines.length;
        
        // 行番号ガターを生成
        const gutterHtml = originalLines
          .map((_, index) => {
            const lineNumber = startLineNumber + index;
            return `<span data-linenumber="${lineNumber}"></span>`;
          })
          .join('');

        // 行ごとにシンタックスハイライトを適用してインデントを保持
        const codeLines = originalLines.map((originalLine) => {
          // 空行の場合は&nbsp;を挿入して高さを確保
          if (originalLine.trim() === '') {
            return `<div class="code-line">&nbsp;</div>`;
          }
          
          // コード部分をハイライト（元の空白を保持）
          let highlightedContent = originalLine;
          if (validLang && originalLine.trim()) {
            try {
              const highlighted = hljs.highlight(originalLine, { language: validLang });
              highlightedContent = highlighted.value;
            } catch {
              try {
                const allHighlighted = hljs.highlightAuto(originalLine);
                highlightedContent = allHighlighted.value;
              } catch {
                // フォールバック：そのまま使用
                highlightedContent = originalLine;
              }
            }
          }
          
          // 行番号付きコードでは空白文字を確実に表示させるため、専用処理を適用
          const preservedContent = this.preserveWhitespaceForLineNumbers(highlightedContent);
          
          return `<div class="code-line">${preservedContent}</div>`;
        }).join('');

        return `<pre data-startline="${startLineNumber}" data-endline="${startLineNumber + totalLines - 1}" class="part"><code${langClass}><div class="wrapper"><div class="gutter linenumber">${gutterHtml}</div><div class="code">${codeLines}</div></div></code></pre>`;
      }

      return `<pre><code${langClass}>${processedCode}</code></pre>`;
    };

    // チェックボックスサポート
    this.renderer.listitem = ({
      text,
      task,
      checked,
    }: {
      text: string;
      task?: boolean;
      checked?: boolean;
    }) => {
      if (task) {
        const checkedAttr = checked ? 'checked' : '';
        const checkedClass = checked ? 'checked' : '';
        return `<li class="task-list-item ${checkedClass}">
          <input type="checkbox" ${checkedAttr} disabled class="task-list-item-checkbox" />
          ${text}
        </li>`;
      }
      return `<li>${text}</li>`;
    };

    // テーブルの拡張
    // Note: Using default table rendering for now due to type compatibility
    // Custom table styling will be handled via CSS
    // this.renderer.table = (token: Table) => {
    //   return `<div class="table-responsive">
    //     <table class="table table-striped">
    //       ${token.header ? `<thead>${token.header}</thead>` : ''}
    //       ${token.rows ? `<tbody>${token.rows}</tbody>` : ''}
    //     </table>
    //   </div>`;
    // };
  }

  private configureMarked() {
    marked.setOptions({
      renderer: this.renderer,
      gfm: true,
      breaks: true,
      pedantic: false,
    });
  }

  private isValidLanguage(lang: string): boolean {
    const supportedLanguages = [
      // Web技術
      'javascript',
      'typescript',
      'html',
      'css',
      'scss',
      'sass',
      'less',
      'json',
      'xml',
      'yaml',
      'yml',
      'markdown',
      'md',
      'vue',
      'jsx',
      'tsx',
      // プログラミング言語
      'python',
      'java',
      'cpp',
      'c',
      'csharp',
      'cs',
      'php',
      'ruby',
      'go',
      'rust',
      'swift',
      'kotlin',
      'scala',
      'haskell',
      'clojure',
      'elixir',
      'erlang',
      'lua',
      'nim',
      'dart',
      'perl',
      'r',
      'matlab',
      'octave',
      // シェル・スクリプト
      'bash',
      'shell',
      'sh',
      'zsh',
      'fish',
      'powershell',
      'cmd',
      'batch',
      // データベース
      'sql',
      'mysql',
      'postgresql',
      'sqlite',
      'mongodb',
      // 設定・マークアップ
      'dockerfile',
      'nginx',
      'apache',
      'ini',
      'toml',
      'properties',
      // その他
      'makefile',
      'cmake',
      'gradle',
      'maven',
      'diff',
      'patch',
      // 図表言語
      'mermaid',
      'plantuml',
      'dot',
      'graphviz',
    ];
    return supportedLanguages.includes(lang.toLowerCase());
  }

  public render(markdown: string): string {
    try {
      const rawHtml = marked(markdown);
      if (typeof rawHtml === 'string') {
        return DOMPurify.sanitize(rawHtml, {
          ADD_TAGS: ['iframe', 'embed', 'object'],
          ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling', 'width', 'height'],
          ALLOW_DATA_ATTR: true,
        });
      }
      return '<p>Markdown rendering error</p>';
    } catch (error) {
      console.error('Markdown rendering error:', error);
      return '<p>Markdown rendering error</p>';
    }
  }

  // 数式処理（プレプロセシング用）
  private processMathExpressions(markdown: string): string {
    let processed = markdown;

    try {
      // ブロック数式: $$...$$（複数行対応）
      processed = processed.replace(/\$\$\s*\n?([\s\S]*?)\n?\s*\$\$/g, (match, formula) => {
        try {
          const cleanFormula = formula.trim();
          if (!cleanFormula) {
            return match;
          }

          const rendered = katex.renderToString(cleanFormula, {
            throwOnError: false,
            displayMode: true,
            strict: false,
          });
          return `<div class="katex-block">${rendered}</div>`;
        } catch (error) {
          console.warn('KaTeX block rendering error:', error, 'Formula:', formula);
          return `<div class="katex-error">Math Error: $$${formula}$$</div>`;
        }
      });

      // インライン数式: $...$ (より単純な正規表現)
      processed = processed.replace(/\$([^$\n]+?)\$/g, (match, formula) => {
        try {
          const cleanFormula = formula.trim();
          if (!cleanFormula) {
            return match;
          }

          const rendered = katex.renderToString(cleanFormula, {
            throwOnError: false,
            displayMode: false,
            strict: false,
          });
          return `<span class="katex-inline">${rendered}</span>`;
        } catch (error) {
          console.warn('KaTeX inline rendering error:', error, 'Formula:', formula);
          return `<span class="katex-error">Math Error: $${formula}$</span>`;
        }
      });
    } catch (error) {
      console.error('Math rendering initialization error:', error);
    }

    return processed;
  }

  // 数式サポート (KaTeX)
  public renderWithMath(markdown: string): string {
    return this.render(this.processMathExpressions(markdown));
  }

  // 図表サポート (Mermaid)
  public renderWithDiagrams(markdown: string): string {
    let processed = markdown;

    // Mermaidの初期化
    if (!mermaidInitialized) {
      try {
        mermaid.initialize({
          startOnLoad: false,
          theme: 'default',
          securityLevel: 'loose',
          fontFamily: 'inherit',
        });
        mermaidInitialized = true;
      } catch (error) {
        console.warn('Mermaid initialization failed:', error);
      }
    }

    // Mermaid図表の処理: ```mermaid ... ```
    processed = processed.replace(/```mermaid\n([\s\S]*?)```/g, (match, diagram) => {
      const diagramId = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const trimmedDiagram = diagram.trim();

      if (!trimmedDiagram) {
        return match;
      }

      return `<div class="mermaid-diagram" data-diagram="${encodeURIComponent(trimmedDiagram)}" id="${diagramId}">
        <div class="mermaid-loading">Loading diagram...</div>
      </div>`;
    });

    // PlantUMLサポート（基本的なサポート）
    processed = processed.replace(/```plantuml\n([\s\S]*?)```/g, (match, diagram) => {
      const trimmedDiagram = diagram.trim();
      if (!trimmedDiagram) {
        return match;
      }

      // PlantUML Online Serverを使用する例（実際の実装では適切なサーバーを設定）
      return `<div class="plantuml-diagram">
        <div class="diagram-warning">PlantUML diagram detected. Consider converting to Mermaid format.</div>
        <pre><code class="language-plantuml">${trimmedDiagram}</code></pre>
      </div>`;
    });

    return processed;
  }

  // Mermaid図表のクライアントサイドレンダリング
  public async renderMermaidDiagrams(container: HTMLElement): Promise<void> {
    const mermaidElements = container.querySelectorAll('.mermaid-diagram');

    for (const element of Array.from(mermaidElements)) {
      const diagram = element.getAttribute('data-diagram');
      const elementId = element.getAttribute('id');

      if (!diagram || !elementId) continue;

      try {
        const decodedDiagram = decodeURIComponent(diagram);

        // Mermaidでレンダリング
        const { svg } = await mermaid.render(`mermaid-svg-${elementId}`, decodedDiagram);
        element.innerHTML = svg;
        element.classList.add('mermaid-rendered');
      } catch (error) {
        console.error('Mermaid rendering error:', error);
        element.innerHTML = `<div class="mermaid-error">
          <p>Failed to render diagram</p>
          <pre><code>${decodeURIComponent(diagram)}</code></pre>
        </div>`;
      }
    }
  }
  // 絵文字処理
  public renderWithEmoji(markdown: string): string {
    const emojiMap = {
      ':smile:': '😊',
      ':heart:': '❤️',
      ':thumbsup:': '👍',
      ':fire:': '🔥',
      ':star:': '⭐',
      ':warning:': '⚠️',
      ':info:': 'ℹ️',
      ':success:': '✅',
      ':error:': '❌',
    };

    let processed = markdown;
    Object.entries(emojiMap).forEach(([code, emoji]) => {
      processed = processed.replace(new RegExp(code, 'g'), emoji);
    });

    return processed;
  }

  // フルレンダリング（全機能込み）
  public renderFull(markdown: string): string {
    let processed = markdown;

    // 数式を一時的に保護（プレースホルダーに置換）
    const { markdown: protectedMarkdown, mathPlaceholders } =
      this.protectMathExpressions(processed);
    processed = protectedMarkdown;

    // 拡張Markdownの機能をプレプロセシング
    processed = this.preprocessExtendedFeatures(processed);

    // ToC処理
    const tocResult = this.markdownProcessor.processMarkdown(processed);
    processed = tocResult.html;

    // Markdownレンダリング
    processed = this.render(processed);

    // 数式プレースホルダーを実際の数式レンダリングに置換
    processed = this.restoreMathExpressions(processed, mathPlaceholders);

    // ヘッダーアンカー追加
    return this.markdownProcessor.addHeaderAnchors(processed, markdown);
  }

  // 非同期レンダリング（Mermaid図表のレンダリングを含む）
  public async renderFullAsync(markdown: string, container?: HTMLElement): Promise<string> {
    const html = this.renderFull(markdown);

    // Mermaid図表のレンダリング
    if (container) {
      // DOMに一時的に挿入してMermaidレンダリング
      container.innerHTML = html;
      await this.renderMermaidDiagrams(container);
      return container.innerHTML;
    }

    return html;
  }

  // プレプロセシング: 拡張Markdownの機能を処理
  private preprocessExtendedFeatures(markdown: string): string {
    let processed = markdown;

    // 0. 絵文字処理（最初に実行）
    processed = this.processEmojis(processed);

    // 1. Mermaid図表の処理（Markdownレンダリング前に実行）
    processed = this.processMermaidDiagrams(processed);

    // 2. 画像サイズ指定の処理（他の処理の前に実行）
    processed = this.processImageSizes(processed);

    // 3. 詳細・要約（details/summary）記法
    processed = this.processDetailsBlocks(processed);

    // 4. 注記・コメント記法
    processed = this.processNotesBlocks(processed);

    // 5. 警告ボックス記法
    processed = this.processAlertBlocks(processed);

    // 6. ファイル名付きコードブロック
    processed = this.processFileNamedCodeBlocks(processed);

    // 7. 引用ツイート記法
    processed = this.processTwitterEmbeds(processed);

    // 8. YouTubeやその他の埋め込み
    processed = this.processEmbeds(processed);

    // 9. チェックボックス（タスクリスト）の拡張
    processed = this.processExtendedCheckboxes(processed);

    return processed;
  }

  // 絵文字処理（プレプロセシング用）
  private processEmojis(markdown: string): string {
    const emojiMap = {
      ':smile:': '😊',
      ':heart:': '❤️',
      ':thumbsup:': '👍',
      ':fire:': '🔥',
      ':star:': '⭐',
      ':warning:': '⚠️',
      ':info:': 'ℹ️',
      ':success:': '✅',
      ':error:': '❌',
    };

    let processed = markdown;
    Object.entries(emojiMap).forEach(([code, emoji]) => {
      processed = processed.replace(new RegExp(code, 'g'), emoji);
    });

    return processed;
  }

  // 画像サイズ指定の処理
  private processImageSizes(markdown: string): string {
    // ![alt](url =200x100) 形式の画像サイズ指定を処理
    return markdown.replace(
      /!\[([^\]]*)\]\(([^)]+)\s+=(\d+)x(\d+)\)/g,
      (match, alt, url, width, height) => {
        return `<img src="${url.trim()}" alt="${alt}" width="${width}" height="${height}" style="max-width: ${width}px; max-height: ${height}px;" />`;
      }
    );
  }

  // 詳細・要約ブロックの処理
  private processDetailsBlocks(markdown: string): string {
    return markdown.replace(/:::details\s+(.*?)\n([\s\S]*?):::/g, (match, summary, content) => {
      return `<details class="markdown-details">
<summary class="markdown-summary">${summary.trim()}</summary>
<div class="markdown-details-content">

${content.trim()}

</div>
</details>`;
    });
  }

  // 注記ブロックの処理
  private processNotesBlocks(markdown: string): string {
    return markdown.replace(/:::note\s+(.*?)\n([\s\S]*?):::/g, (match, type, content) => {
      const noteType = type.trim() || 'info';
      return `<div class="markdown-note markdown-note-${noteType}">
<div class="markdown-note-title">${this.getNoteIcon(noteType)} ${this.getNoteTitle(noteType)}</div>
<div class="markdown-note-content">

${content.trim()}

</div>
</div>`;
    });
  }

  private getNoteIcon(type: string): string {
    const icons: Record<string, string> = {
      info: 'ℹ️',
      warn: '⚠️',
      alert: '🚨',
      success: '✅',
      error: '❌',
      tip: '💡',
    };
    return icons[type] || 'ℹ️';
  }

  private getNoteTitle(type: string): string {
    const titles: Record<string, string> = {
      info: '情報',
      warn: '警告',
      alert: '注意',
      success: '成功',
      error: 'エラー',
      tip: 'ヒント',
    };
    return titles[type] || '情報';
  }

  // ファイル名付きコードブロックの処理
  private processFileNamedCodeBlocks(markdown: string): string {
    return markdown.replace(
      /```([^:\n]+):([^:\n]+)\n([\s\S]*?)```/g,
      (match, lang, filename, code) => {
        // シンタックスハイライト処理
        const validLang = lang && this.isValidLanguage(lang.trim()) ? lang.trim() : '';
        let highlightedCode = code.trim();

        if (validLang && hljs.getLanguage(validLang)) {
          try {
            highlightedCode = hljs.highlight(highlightedCode, { language: validLang }).value;
          } catch (error) {
            console.warn('Syntax highlighting failed:', error);
          }
        }

        return `<div class="markdown-code-block">
<div class="markdown-code-filename">${filename.trim()}</div>
<pre><code class="hljs language-${validLang}">${highlightedCode}</code></pre>
</div>`;
      }
    );
  }

  // Twitter埋め込みの処理
  private processTwitterEmbeds(markdown: string): string {
    return markdown.replace(/https:\/\/twitter\.com\/\w+\/status\/(\d+)/g, (match) => {
      return `<div class="markdown-twitter-embed">
<blockquote class="twitter-tweet">
<a href="${match}">Tweet</a>
</blockquote>
</div>`;
    });
  }

  // その他の埋め込みの処理
  private processEmbeds(markdown: string): string {
    // YouTube埋め込み
    let processed = markdown.replace(
      /https:\/\/(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/g,
      (match, videoId) => {
        return `<div class="markdown-youtube-embed">
<iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}"
        frameborder="0" allowfullscreen></iframe>
</div>`;
      }
    );

    // CodePen埋め込み
    processed = processed.replace(
      /https:\/\/codepen\.io\/([^/]+)\/pen\/([a-zA-Z0-9]+)/g,
      (match, user, penId) => {
        return `<div class="markdown-codepen-embed">
<iframe height="300" style="width: 100%;" scrolling="no"
        src="https://codepen.io/${user}/embed/${penId}?default-tab=html,result"
        frameborder="no" allowtransparency="true" allowfullscreen="true">
</iframe>
</div>`;
      }
    );

    return processed;
  }

  // 警告ボックスの処理 (:::success, :::info, :::warning, :::danger)
  private processAlertBlocks(markdown: string): string {
    const alertTypes = ['success', 'info', 'warning', 'danger'];
    let processed = markdown;

    // 新しい形式: :::success ... :::
    alertTypes.forEach((type) => {
      const regex = new RegExp(`:::${type}\\s*\\n([\\s\\S]*?)\\n:::`, 'g');
      processed = processed.replace(regex, (match, content) => {
        return `<div class="alert alert-${type}">
<div class="alert-icon">${this.getAlertIcon(type)}</div>
<div class="alert-content">

${content.trim()}

</div>
</div>`;
      });
    });

    return processed;
  }

  private getAlertIcon(type: string): string {
    const icons: Record<string, string> = {
      success: '✅',
      info: 'ℹ️',
      warning: '⚠️',
      danger: '🚨',
    };
    return icons[type] || 'ℹ️';
  }

  // 拡張チェックボックスの処理
  private processExtendedCheckboxes(markdown: string): string {
    return markdown.replace(/^(\s*)- \[([x ])\] (.+)$/gm, (match, indent, checked, text) => {
      const isChecked = checked === 'x';
      return `${indent}- <input type="checkbox" ${isChecked ? 'checked' : ''} disabled> ${text}`;
    });
  }

  // Mermaid図表の処理（プレプロセシング用）
  private processMermaidDiagrams(markdown: string): string {
    // Mermaidの初期化
    if (!mermaidInitialized) {
      try {
        mermaid.initialize({
          startOnLoad: false,
          theme: 'default',
          securityLevel: 'loose',
          fontFamily: 'inherit',
        });
        mermaidInitialized = true;
      } catch (error) {
        console.warn('Mermaid initialization failed:', error);
      }
    }

    // Mermaid図表の処理: ```mermaid ... ```
    return markdown.replace(/```mermaid\n([\s\S]*?)```/g, (match, diagram) => {
      const diagramId = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const trimmedDiagram = diagram.trim();

      if (!trimmedDiagram) {
        return match;
      }

      return `<div class="mermaid-diagram" data-diagram="${encodeURIComponent(trimmedDiagram)}" id="${diagramId}">
        <div class="mermaid-loading">Loading diagram...</div>
      </div>`;
    });
  }

  // 数式を保護（Markdownレンダリング前に一時的にプレースホルダーに置換）
  private protectMathExpressions(markdown: string): {
    markdown: string;
    mathPlaceholders: Map<string, string>;
  } {
    const mathPlaceholders = new Map<string, string>();
    let processed = markdown;
    let counter = 0;

    // ブロック数式を保護
    processed = processed.replace(/\$\$\s*\n?([\s\S]*?)\n?\s*\$\$/g, (match, formula) => {
      const placeholder = `MATHBLOCK_PLACEHOLDER_${counter++}`;
      mathPlaceholders.set(placeholder, this.renderSingleMath(formula.trim(), true));
      return placeholder;
    });

    // インライン数式を保護
    processed = processed.replace(/\$([^$\n]+?)\$/g, (match, formula) => {
      const placeholder = `MATHINLINE_PLACEHOLDER_${counter++}`;
      mathPlaceholders.set(placeholder, this.renderSingleMath(formula.trim(), false));
      return placeholder;
    });

    return { markdown: processed, mathPlaceholders };
  }

  // 単一の数式をレンダリング
  private renderSingleMath(formula: string, displayMode: boolean): string {
    try {
      if (!formula) {
        return displayMode ? '$$$$' : '$$';
      }

      // KaTeX利用可能性をチェック
      if (typeof katex?.renderToString !== 'function') {
        console.error('KaTeX renderToString function is not available');
        const errorDisplay = displayMode ? `$$${formula}$$` : `$${formula}$`;
        return displayMode
          ? `<div class="katex-error">KaTeX not available: ${errorDisplay}</div>`
          : `<span class="katex-error">KaTeX not available: ${errorDisplay}</span>`;
      }

      const rendered = katex.renderToString(formula, {
        throwOnError: false,
        displayMode,
        strict: false,
      });

      if (displayMode) {
        return `<div class="katex-block">${rendered}</div>`;
      } else {
        return `<span class="katex-inline">${rendered}</span>`;
      }
    } catch (error) {
      console.error('KaTeX rendering error:', error);
      console.error('Formula:', formula);
      console.error('Display mode:', displayMode);

      const errorDisplay = displayMode ? `$$${formula}$$` : `$${formula}$`;
      const errorClass = displayMode ? 'katex-error' : 'katex-error';
      return displayMode
        ? `<div class="${errorClass}">Math Error: ${errorDisplay}</div>`
        : `<span class="${errorClass}">Math Error: ${errorDisplay}</span>`;
    }
  }

  // 数式プレースホルダーを実際のレンダリング結果に復元
  private restoreMathExpressions(html: string, mathPlaceholders: Map<string, string>): string {
    let processed = html;

    for (const [placeholder, renderedMath] of mathPlaceholders) {
      processed = processed.replace(new RegExp(placeholder, 'g'), renderedMath);
    }

    return processed;
  }

  private preserveWhitespaceForLineNumbers(content: string): string {
    // HTMLタグを一時的に保護
    const tagRegex = /<[^>]*>/g;
    const tags: string[] = [];
    let tagIndex = 0;
    
    // HTMLタグを一時的な文字列に置換
    const protectedContent = content.replace(tagRegex, (match) => {
      tags.push(match);
      return `__TAG_${tagIndex++}__`;
    });
    
    // 空白文字を&nbsp;に置換
    const spacedContent = protectedContent.replace(/ /g, '&nbsp;');
    
    // HTMLタグを復元
    const restoredContent = spacedContent.replace(/__TAG_(\d+)__/g, (match, index) => {
      return tags[parseInt(index)];
    });
    
    return restoredContent;
  }
}
