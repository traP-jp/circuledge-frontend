// KaTeX type definitions
declare module 'katex' {
  export interface KatexOptions {
    throwOnError?: boolean;
    displayMode?: boolean;
    output?: 'html' | 'mathml' | 'htmlAndMathml';
    leqno?: boolean;
    fleqn?: boolean;
    macros?: Record<string, string>;
    minRuleThickness?: number;
    colorIsTextColor?: boolean;
    maxSize?: number;
    maxExpand?: number;
    strict?: boolean | string | ((errorCode: string, errorMsg: string, token: string) => void);
    trust?: boolean | ((context: { command: string; url?: string; protocol?: string }) => boolean);
    globalGroup?: boolean;
  }

  export function render(tex: string, options?: KatexOptions): string;
  export function renderToString(tex: string, options?: KatexOptions): string;
}

// Mermaid type definitions
declare module 'mermaid' {
  interface MermaidConfig {
    startOnLoad?: boolean;
    theme?: string;
    securityLevel?: 'strict' | 'loose' | 'antiscript' | 'sandbox';
    fontFamily?: string;
    logLevel?: number;
    htmlLabels?: boolean;
  }

  interface RenderResult {
    svg: string;
    bindFunctions?: () => void;
  }

  function initialize(config?: MermaidConfig): void;
  function render(id: string, graphDefinition: string): Promise<RenderResult>;
  function parse(text: string): boolean;

  export default {
    initialize,
    render,
    parse,
  };
}

// Highlight.js type definitions
declare module 'highlight.js' {
  interface HighlightResult {
    value: string;
    language?: string;
    relevance: number;
    illegal: boolean;
    errorRaised?: Error;
    second_best?: HighlightResult;
  }

  interface HighlightOptions {
    language?: string;
    ignoreIllegals?: boolean;
  }

  interface LanguageDefinition {
    aliases?: string[];
    case_insensitive?: boolean;
    keywords?: string | Record<string, string>;
    contains?: unknown[];
  }

  function highlight(code: string, options: HighlightOptions): HighlightResult;
  function highlightAuto(code: string, languageSubset?: string[]): HighlightResult;
  function registerLanguage(name: string, language: () => LanguageDefinition): void;
  function getLanguage(name: string): LanguageDefinition | undefined;
  function listLanguages(): string[];

  export default {
    highlight,
    highlightAuto,
    registerLanguage,
    getLanguage,
    listLanguages,
  };
}
