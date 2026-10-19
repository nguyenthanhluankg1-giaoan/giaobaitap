/**
 * Utility functions for cleaning and formatting math, fractions, and number notation in Vietnamese educational context.
 * Fixes common issues like unwrapped LaTeX fractions (\frac{7}{10} -> $\frac{7}{10}$),
 * unwrapped unit exponents (m^2 -> $\text{m}^2$), and over-wrapped plain numbers ($45\;678$ -> 45 678).
 */

export function fixUnwrappedFractions(input: string | undefined | null): string {
  if (!input) return '';

  let text = String(input);

  // 1. Wrap unwrapped \frac{A}{B} in $ ... $ if not already wrapped in $ ... $
  let prev = '';
  while (prev !== text) {
    prev = text;
    text = text.replace(/(?<!\$)\\frac\{([^{}]+)\}\{([^{}]+)\}(?!\$)/g, '$\\frac{$1}{$2}$');
  }

  // 2. Fix double dollar signs on fractions like $$\frac{a}{b}$$ when intended for inline
  text = text.replace(/\$\$\s*(\\frac\{[^{}]+\}\{[^{}]+\})\s*\$\$/g, '$$1$');

  // 3. Fix unwrapped unit exponents (m^2, cm^2, dm^2, mm^2, km^2, m^3, cm^3) and variable exponents (x^2, y^2, a^2)
  text = text.replace(/(?<!\$)\b(m|cm|dm|mm|km|ha)\^([23])\b(?!\$)/g, '$\\text{$1}^$2$');
  text = text.replace(/(?<!\$)\b([a-zA-Z])\^([0-9a-zA-Z]+)\b(?!\$)/g, '$$1^$2$');

  // 4. Merge adjacent fraction comparison or equation blocks:
  // e.g., "$\frac{7}{10}$ = $\frac{70}{100}$" -> "$\frac{7}{10} = \frac{70}{100}$"
  // "$\frac{70}{100}$ > $\frac{68}{100}$" -> "$\frac{70}{100} > \frac{68}{100}$"
  text = text.replace(
    /\$\s*(\\frac\{[^{}]+\}\{[^{}]+\})\s*\$\s*(=|>|<|\ge|\le|\+|\-|\*|\/|:)\s*\$\s*(\\frac\{[^{}]+\}\{[^{}]+\})\s*\$/g,
    '$$1 $2 $3$'
  );

  return text;
}

export function cleanMathNotation(input: string | undefined | null): string {
  if (!input) return '';

  let text = String(input);

  // First, auto-fix unwrapped LaTeX fractions, exponents, and equations
  text = fixUnwrappedFractions(text);

  // 1. Fix escaped backslashes or double-escaped LaTeX spacing commands
  text = text.replace(/\\\\;/g, '\\;').replace(/\\\\,/g, '\\,');

  // 2. Strip $ ... $ wrappers around numbers with thousands separators ($45\;678$, $45\,678$, $45\:\!678$, $45 678$, $45.678$, $45,678$)
  text = text.replace(/\$\s*([0-9]{1,3}(?:[\\;\,\:\!\s\.]+[0-9]{3})+)\s*\$/g, (_, numStr) => {
    return numStr.replace(/\\[;,\:\!]/g, ' ').replace(/\s+/g, ' ').trim();
  });

  // 3. Strip $ ... $ wrappers around plain numbers, simple decimals or percentages ($45678$, $100$, $50\%$, $3.14$)
  text = text.replace(/\$\s*([0-9]+(?:\.[0-9]+)?%?)\s*\$/g, '$1');

  // 4. Strip $ ... $ wrappers around plain option labels or plain text without complex LaTeX symbols (e.g. $A. 45\;678$ -> A. 45 678)
  text = text.replace(/\$\s*([^\$\n]+?)\s*\$/g, (fullMatch, inner) => {
    // If inner contains true LaTeX math operators, keep dollar signs
    if (
      /\\(frac|sqrt|mathbb|mathbbm|mathrm|mathbf|text|in|notin|subset|cap|cup|ge|le|neq|Delta|times|div|pm|infty|alpha|beta|gamma|theta|pi|int|sum|lim)|[\^_{}]/i.test(
        inner
      )
    ) {
      return fullMatch;
    }
    // Otherwise it's plain text/numbers incorrectly wrapped in $, clean it up
    return inner.replace(/\\[;,\:\!]/g, ' ').replace(/\s+/g, ' ').trim();
  });

  // 5. Clean up orphan LaTeX spacing commands outside or inside text (e.g. "45\;678" -> "45 678")
  text = text.replace(/([0-9]+)\\[;,\:\!]\s*([0-9]+)/g, '$1 $2');

  // 6. Clean up multiple spaces
  text = text.replace(/ +/g, ' ');

  return text;
}

export function cleanQuestionMath<T extends { content?: string; options?: string[]; explanation?: string; rubric?: string; sampleAnswer?: string }>(q: T): T {
  return {
    ...q,
    content: q.content ? cleanMathNotation(q.content) : q.content,
    options: q.options ? q.options.map((opt) => cleanMathNotation(opt)) : q.options,
    explanation: q.explanation ? cleanMathNotation(q.explanation) : q.explanation,
    rubric: q.rubric ? cleanMathNotation(q.rubric) : q.rubric,
    sampleAnswer: q.sampleAnswer ? cleanMathNotation(q.sampleAnswer) : q.sampleAnswer,
  };
}
