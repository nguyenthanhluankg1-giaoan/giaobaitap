/**
 * Utility functions for cleaning and formatting math, fractions, units, and number notation in Vietnamese educational context.
 * Fixes common issues like:
 * - Unwrapped LaTeX fractions (\frac{7}{10} -> $\frac{7}{10}$)
 * - Broken unit LaTeX delimiters (1 $\text{ha} = 10 000 \text{m}^2$ -> 1 ha = 10 000 m²)
 * - Unwrapped mixed fractions (3\frac{2}{5} -> $3\frac{2}{5}$)
 * - Over-wrapped plain numbers ($45\;678$ -> 45 678)
 */

export function fixUnwrappedFractions(input: string | undefined | null): string {
  if (!input) return '';

  let text = String(input);

  // 1. Clean up \text{ha}, \text{m}^2, \text{cm}^2, etc. and convert units to clean plain text/unicode
  text = text.replace(/\\text\{\s*(ha|m|cm|dm|mm|km|kg|g)\s*\}/gi, '$1');
  text = text.replace(/\\text\{\s*(m|cm|dm|mm|km)\s*\}\s*\^\{?([23])\}?/gi, '$1^$2');

  // Convert unit exponents m^2, cm^2, dm^2, mm^2, km^2, m^3, cm^3 to unicode ² and ³
  text = text.replace(/\b(m|cm|dm|mm|km)\^2\b/gi, '$1²');
  text = text.replace(/\b(m|cm|dm|mm|km)\^3\b/gi, '$1³');

  // 2. Fix unwrapped mixed numbers (hỗn số e.g. 3\frac{2}{5} -> $3\frac{2}{5}$)
  text = text.replace(/(?<!\$)\b([0-9]+\s*\\frac\{[^{}]+\}\{[^{}]+\})(?!\$)/g, '$$1$');

  // 3. Fix unwrapped \frac{A}{B} (e.g. \frac{30}{100} -> $\frac{30}{100}$)
  let prev = '';
  while (prev !== text) {
    prev = text;
    text = text.replace(/(?<!\$)\\frac\{([^{}]+)\}\{([^{}]+)\}(?!\$)/g, '$\\frac{$1}{$2}$');
  }

  // 4. Fix split mixed numbers like 3$\frac{2}{5}$ -> $3\frac{2}{5}$
  text = text.replace(/\b([0-9]+)\s*\$\\frac\{([^{}]+)\}\{([^{}]+)\}\$/g, '$$1\\frac{$2}{$3}$');

  // 5. Fix double dollar signs on fractions like $$\frac{a}{b}$$ when intended for inline
  text = text.replace(/\$\$\s*(\\frac\{[^{}]+\}\{[^{}]+\})\s*\$\$/g, '$$1$');

  // 6. Merge adjacent fraction/number comparison or equation blocks:
  // e.g., "$\frac{7}{10}$ = $\frac{70}{100}$" -> "$\frac{7}{10} = \frac{70}{100}$"
  text = text.replace(
    /\$\s*(\\frac\{[^{}]+\}\{[^{}]+\})\s*\$\s*(=|>|<|\ge|\le|\+|\-|\*|\/|:)\s*\$\s*(\\frac\{[^{}]+\}\{[^{}]+\})\s*\$/g,
    '$$1 $2 $3$'
  );

  return text;
}

export function cleanMathNotation(input: string | undefined | null): string {
  if (!input) return '';

  let text = String(input);

  // First, auto-fix unwrapped LaTeX fractions, exponents, units, and equations
  text = fixUnwrappedFractions(text);

  // 1. Fix escaped backslashes or double-escaped LaTeX spacing commands
  text = text.replace(/\\\\;/g, '\\;').replace(/\\\\,/g, '\\,');

  // 2. Strip $ ... $ wrappers around plain unit statements like "1 $ha = 10 000 m²$" or "$ha$"
  // e.g. "Vì 1 $ha = 10 000 m²$ nên..." -> "Vì 1 ha = 10 000 m² nên..."
  text = text.replace(
    /\$\s*([0-9\s]*\b(?:ha|m²|cm²|dm²|mm²|km²|m³|cm³|m|cm|dm|mm|km|kg|g)\b[0-9\s=\+\-×÷:\*\/\,]*)\s*\$/gi,
    '$1'
  );

  // 3. Strip $ ... $ wrappers around numbers with thousands separators ($45\;678$, $45\,678$, $45 678$)
  text = text.replace(/\$\s*([0-9]{1,3}(?:[\\;\,\:\!\s\.]+[0-9]{3})+)\s*\$/g, (_, numStr) => {
    return numStr.replace(/\\[;,\:\!]/g, ' ').replace(/\s+/g, ' ').trim();
  });

  // 4. Strip $ ... $ wrappers around plain numbers, simple decimals or percentages ($45678$, $100$, $50\%$, $3.14$)
  text = text.replace(/\$\s*([0-9]+(?:\.[0-9]+)?%?)\s*\$/g, '$1');

  // 5. Replace \times with ×, \div with : or ÷ in text
  text = text.replace(/\\times/g, '×').replace(/\\div/g, ':');

  // 6. Strip $ ... $ wrappers around plain text without complex LaTeX symbols
  text = text.replace(/\$\s*([^\$\n]+?)\s*\$/g, (fullMatch, inner) => {
    if (
      /\\(frac|sqrt|mathbb|mathbbm|mathrm|mathbf|in|notin|subset|cap|cup|ge|le|neq|Delta|pm|infty|alpha|beta|gamma|theta|pi|int|sum|lim)|[\^_{}]/i.test(
        inner
      )
    ) {
      return fullMatch;
    }
    return inner.replace(/\\[;,\:\!]/g, ' ').replace(/\s+/g, ' ').trim();
  });

  // 7. Clean up orphan LaTeX spacing commands outside or inside text
  text = text.replace(/([0-9]+)\\[;,\:\!]\s*([0-9]+)/g, '$1 $2');

  // 8. Clean up multiple spaces
  text = text.replace(/ +/g, ' ');

  return text;
}

export function cleanQuestionMath<
  T extends {
    content?: string;
    options?: string[];
    explanation?: string;
    rubric?: string;
    sampleAnswer?: string;
  }
>(q: T): T {
  return {
    ...q,
    content: q.content ? cleanMathNotation(q.content) : q.content,
    options: q.options ? q.options.map((opt) => cleanMathNotation(opt)) : q.options,
    explanation: q.explanation ? cleanMathNotation(q.explanation) : q.explanation,
    rubric: q.rubric ? cleanMathNotation(q.rubric) : q.rubric,
    sampleAnswer: q.sampleAnswer ? cleanMathNotation(q.sampleAnswer) : q.sampleAnswer,
  };
}
