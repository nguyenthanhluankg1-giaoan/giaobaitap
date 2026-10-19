import React from 'react';
import katex from 'katex';
import { cleanMathNotation } from '../../utils/mathUtils.ts';

interface MathTextProps {
  text: string | undefined | null;
  className?: string;
  as?: 'span' | 'div' | 'p';
}

/**
 * Renders text containing LaTeX math formulas ($...$, $$...$$, \(...\), \[...\],
 * or common raw LaTeX commands like \mathbb{N}^*, \frac, \sqrt, \in, etc.)
 * cleanly using KaTeX with fallback to plain text if malformed.
 */
export const MathText: React.FC<MathTextProps> = ({
  text,
  className = '',
  as: Component = 'span',
}) => {
  if (!text) return null;

  // Clean numbers wrapped unnecessarily in LaTeX dollar signs ($45\;678$ -> 45 678)
  const sanitizedText = cleanMathNotation(text);

  // Render a math segment safely with KaTeX
  const renderMath = (mathCode: string, displayMode: boolean = false): string => {
    try {
      // Clean up escaped backslashes if double-escaped
      const cleanMath = mathCode.trim();
      return katex.renderToString(cleanMath, {
        displayMode,
        throwOnError: false,
        output: 'htmlAndMathml',
      });
    } catch {
      return mathCode;
    }
  };

  // Process string to identify math blocks
  // 1. $$...$$ or \[...\] for display math
  // 2. $...$ or \(...\) for inline math
  // 3. Raw LaTeX math keywords if not wrapped in $ (e.g., \mathbb{N}^*, \frac{a}{b}, x \in \mathbb{N})
  const segments: React.ReactNode[] = [];
  let remaining = sanitizedText;
  let keyIndex = 0;

  // Regex matching:
  // - Display math: \$\$(.+?)\$\$ or \\\[(.+?)\\\]
  // - Inline math: \$([^\$\n]+?)\$ or \\\((.+?)\\\)
  // - Unwrapped LaTeX symbols like \mathbb{...}, \frac{...}{...}, \sqrt{...}
  const mathRegex = /(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\$(?:\\\$|[^\$\n])+?\$|\\\([\s\S]+?\\\)|\\[a-zA-Z]+(?:\{[^{}]*\}|\[[^[\]]*\]|\*)*(?:\^\{?[0-9a-zA-Z*+-]+\}?|_\{?[0-9a-zA-Z*+-]+\}?)*)/;

  while (remaining.length > 0) {
    const match = remaining.match(mathRegex);
    if (!match || match.index === undefined) {
      // No more math blocks, add remaining text
      segments.push(
        <span key={`text-${keyIndex++}`} className="whitespace-pre-wrap">
          {remaining}
        </span>
      );
      break;
    }

    // Add plain text before match
    if (match.index > 0) {
      segments.push(
        <span key={`text-${keyIndex++}`} className="whitespace-pre-wrap">
          {remaining.slice(0, match.index)}
        </span>
      );
    }

    const matchedStr = match[0];
    let isDisplay = false;
    let mathExpr = '';

    if (matchedStr.startsWith('$$') && matchedStr.endsWith('$$')) {
      isDisplay = true;
      mathExpr = matchedStr.slice(2, -2);
    } else if (matchedStr.startsWith('\\[') && matchedStr.endsWith('\\]')) {
      isDisplay = true;
      mathExpr = matchedStr.slice(2, -2);
    } else if (matchedStr.startsWith('$') && matchedStr.endsWith('$')) {
      isDisplay = false;
      mathExpr = matchedStr.slice(1, -1);
    } else if (matchedStr.startsWith('\\(') && matchedStr.endsWith('\\)')) {
      isDisplay = false;
      mathExpr = matchedStr.slice(2, -2);
    } else {
      // Raw LaTeX command like \mathbb{N}^*
      isDisplay = false;
      mathExpr = matchedStr;
    }

    const renderedHtml = renderMath(mathExpr, isDisplay);

    segments.push(
      <span
        key={`math-${keyIndex++}`}
        className={`math-rendered ${isDisplay ? 'block my-1 text-center overflow-x-auto py-1' : 'inline-block mx-0.5 align-middle'}`}
        dangerouslySetInnerHTML={{ __html: renderedHtml }}
      />
    );

    remaining = remaining.slice(match.index + matchedStr.length);
  }

  return <Component className={className}>{segments}</Component>;
};
