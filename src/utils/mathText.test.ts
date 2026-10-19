import test from 'node:test';
import assert from 'node:assert';
import katex from 'katex';

test('KaTeX renders standard math notations properly', () => {
  // Test math formulas from the user issue (natural numbers N*, sets, inequalities)
  const renderedNStar = katex.renderToString('\\mathbb{N}^*', { throwOnError: false });
  assert.ok(renderedNStar.includes('katex'), 'Should contain KaTeX HTML');
  assert.ok(renderedNStar.includes('class="mord mathbb"'), 'Should format blackboard bold N');

  const renderedInequality = katex.renderToString('x \\ge 0', { throwOnError: false });
  assert.ok(renderedInequality.includes('katex'), 'Should render inequality');
});

test('JSON with unescaped LaTeX backslashes can be repaired and parsed', () => {
  // Simulates LLM returning JSON with unescaped LaTeX backslashes
  const rawWithBackslashes = `[
    {
      "id": "q1",
      "content": "Cho tập hợp $A = \\{x \\in \\mathbb{N}^* | x < 5\\}$",
      "options": ["A. $x \\ge 0$", "B. $x \\in \\mathbb{N}$", "C. $x < 0$", "D. $x \\notin \\mathbb{N}$"]
    }
  ]`;

  // Without repair, if single backslashes exist:
  // Function repair logic
  const repaired = rawWithBackslashes.replace(/(?<!\\)\\(?!["\\/bfnrt]|u[0-9a-fA-F]{4})/g, '\\\\');
  const parsed = JSON.parse(repaired);
  assert.strictEqual(parsed.length, 1);
  assert.ok(parsed[0].content.includes('\\mathbb{N}^*'));
  assert.strictEqual(parsed[0].options.length, 4);
});
