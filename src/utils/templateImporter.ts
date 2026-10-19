/**
 * Utility functions for downloading sample question template files (CSV, TXT, JSON)
 * and parsing uploaded question files directly into assignment questions.
 */

import { Question } from '../types/index.ts';
import { cleanQuestionMath } from './mathUtils.ts';

// 1. CSV Template Content
export const SAMPLE_CSV_CONTENT = `Loai_Cau_Hoi,Noi_Dung_Cau_Hoi,Dap_An_A,Dap_An_B,Dap_An_C,Dap_An_D,Dap_An_Dung,Diem,Giai_Thich
trac_nghiem,"Hỗn số $3\\frac{2}{5}$ được chuyển thành phân số nào dưới đây?","A. $\\frac{17}{5}$","B. $\\frac{15}{5}$","C. $\\frac{13}{5}$","D. $\\frac{11}{5}$",A,2.0,"Chuyển hỗn số: $3\\frac{2}{5} = \\frac{3 \\times 5 + 2}{5} = \\frac{17}{5}$."
trac_nghiem,"Diện tích của một khu đất hình chữ nhật có chiều dài 200m và chiều rộng 150m là bao nhiêu ha?","A. 3 ha","B. 30 ha","C. 300 ha","D. 0.3 ha",A,2.0,"Diện tích = 200 × 150 = 30 000 m². Vì 1 ha = 10 000 m² nên 30 000 m² = 3 ha."
trac_nghiem,"Kết quả của phép tính nhẩm: 7 × 8 + 6 bằng bao nhiêu?","A. 56","B. 62","C. 58","D. 64",B,2.0,"Thực hiện phép nhân trước: 7 × 8 = 56, sau đó cộng 6: 56 + 6 = 62."
tu_luan,"Một vòi nước chảy vào bể chưa có nước. Giờ thứ nhất chảy được $\\frac{2}{5}$ bể, giờ thứ hai chảy được $\\frac{1}{3}$ bể. Hỏi sau hai giờ vòi nước đó chảy được bao nhiêu phần bể?","","","","",,2.0,"Sau 2 giờ vòi nước chảy được: $\\frac{2}{5} + \\frac{1}{3} = \\frac{11}{15}$ (bể)."
tu_luan,"Viết đoạn văn từ 3 đến 5 câu miêu tả loài cây hoặc loài hoa mà em yêu thích nhất.","","","","",,2.0,"Học sinh diễn đạt lưu khoát, tả đúng đặc điểm nổi bật và tình cảm cá nhân dành cho loài cây/hoa."
`;

// 2. TXT Template Content
export const SAMPLE_TXT_CONTENT = `=== MẪU SOẠN ĐỀ THI VÀ BÀI TẬP EDUHOMEWORK ===
Ghi chú: Thầy cô có thể copy mẫu này, điền câu hỏi tương tự rồi lưu file .txt hoặc .csv tải lên hệ thống.

[TRAC_NGHIEM]
Câu 1: Hỗn số $3\\frac{2}{5}$ được chuyển thành phân số nào dưới đây?
A. $\\frac{17}{5}$
B. $\\frac{15}{5}$
C. $\\frac{13}{5}$
D. $\\frac{11}{5}$
Đáp án: A
Điểm: 2.0
Giải thích: Chuyển hỗn số: $3\\frac{2}{5} = \\frac{3 \\times 5 + 2}{5} = \\frac{17}{5}$.

[TRAC_NGHIEM]
Câu 2: Diện tích của một khu đất hình chữ nhật có chiều dài 200m và chiều rộng 150m là bao nhiêu ha?
A. 3 ha
B. 30 ha
C. 300 ha
D. 0.3 ha
Đáp án: A
Điểm: 2.0
Giải thích: Diện tích = 200 × 150 = 30 000 m². Vì 1 ha = 10 000 m² nên 30 000 m² = 3 ha.

[TU_LUAN]
Câu 3: Một vòi nước chảy vào bể chưa có nước. Giờ thứ nhất chảy được $\\frac{2}{5}$ bể, giờ thứ hai chảy được $\\frac{1}{3}$ bể. Hỏi sau hai giờ vòi nước đó chảy được bao nhiêu phần bể?
Điểm: 3.0
Giải thích: Tóm tắt và lời giải: Sau 2 giờ vòi nước chảy được: $\\frac{2}{5} + \\frac{1}{3} = \\frac{11}{15}$ (bể).
`;

// Download sample file
export function downloadSampleFile(format: 'csv' | 'txt' | 'json' = 'csv') {
  let content = SAMPLE_CSV_CONTENT;
  let filename = 'Mau_Nhap_Cau_Hoi_EduHomework.csv';
  let mimeType = 'text/csv;charset=utf-8;';

  if (format === 'txt') {
    content = SAMPLE_TXT_CONTENT;
    filename = 'Mau_Nhap_Cau_Hoi_EduHomework.txt';
    mimeType = 'text/plain;charset=utf-8;';
  } else if (format === 'json') {
    const jsonSample = [
      {
        type: 'multiple_choice',
        content: 'Hỗn số $3\\frac{2}{5}$ được chuyển thành phân số nào dưới đây?',
        options: ['A. $\\frac{17}{5}$', 'B. $\\frac{15}{5}$', 'C. $\\frac{13}{5}$', 'D. $\\frac{11}{5}$'],
        correctOptionIndex: 0,
        points: 2.0,
        explanation: 'Chuyển hỗn số: $3\\frac{2}{5} = \\frac{3 \\times 5 + 2}{5} = \\frac{17}{5}$.',
      },
      {
        type: 'essay',
        content: 'Một vòi nước chảy vào bể chưa có nước. Giờ thứ nhất chảy được $\\frac{2}{5}$ bể, giờ thứ hai chảy được $\\frac{1}{3}$ bể. Hỏi sau hai giờ vòi nước đó chảy được bao nhiêu phần bể?',
        points: 3.0,
        sampleAnswer: 'Tóm tắt và lời giải: Sau 2 giờ vòi nước chảy được: $\\frac{2}{5} + \\frac{1}{3} = \\frac{11}{15}$ (bể).',
      },
    ];
    content = JSON.stringify(jsonSample, null, 2);
    filename = 'Mau_Nhap_Cau_Hoi_EduHomework.json';
    mimeType = 'application/json;charset=utf-8;';
  }

  // UTF-8 BOM for Excel compatibility with CSV
  const blob = new Blob(['\ufeff' + content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Parse simple CSV line with quotes support
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

// Parse questions file (.csv, .txt, .json)
export async function parseQuestionsFile(file: File): Promise<Question[]> {
  const text = await file.text();
  const ext = file.name.split('.').pop()?.toLowerCase();

  const questions: Question[] = [];

  if (ext === 'json') {
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        parsed.forEach((q, idx) => {
          questions.push(
            cleanQuestionMath({
              id: `q-import-${Date.now()}-${idx}`,
              type: q.type === 'essay' ? 'essay' : 'multiple_choice',
              content: q.content || 'Nội dung câu hỏi',
              options: Array.isArray(q.options) ? q.options : ['A.', 'B.', 'C.', 'D.'],
              correctOptionIndex: typeof q.correctOptionIndex === 'number' ? q.correctOptionIndex : 0,
              points: typeof q.points === 'number' ? q.points : 2.0,
              explanation: q.explanation || q.sampleAnswer || '',
              rubric: q.rubric || '',
              sampleAnswer: q.sampleAnswer || '',
            })
          );
        });
      }
    } catch (e) {
      console.error('Failed to parse JSON file', e);
    }
  } else if (ext === 'csv') {
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    // Skip header line if present
    const startIdx = lines[0]?.toLowerCase().includes('loai_cau_hoi') ? 1 : 0;

    for (let i = startIdx; i < lines.length; i++) {
      const row = parseCSVLine(lines[i]);
      if (row.length < 2) continue;

      const typeRaw = row[0]?.toLowerCase() || '';
      const isEssay = typeRaw.includes('tu_luan') || typeRaw.includes('essay');
      const content = row[1] || '';
      if (!content) continue;

      if (isEssay) {
        const points = parseFloat(row[7] || row[3] || '2.0') || 2.0;
        const explanation = row[8] || row[4] || '';
        questions.push(
          cleanQuestionMath({
            id: `q-import-${Date.now()}-${i}`,
            type: 'essay',
            content,
            points,
            sampleAnswer: explanation,
            rubric: 'Chấm theo sự chính xác và độ hoàn thiện của câu trả lời.',
          })
        );
      } else {
        const optA = row[2] || 'A. Đáp án A';
        const optB = row[3] || 'B. Đáp án B';
        const optC = row[4] || 'C. Đáp án C';
        const optD = row[5] || 'D. Đáp án D';
        const correctChar = (row[6] || 'A').trim().toUpperCase();
        let correctIdx = 0;
        if (correctChar === 'B' || correctChar === '1') correctIdx = 1;
        if (correctChar === 'C' || correctChar === '2') correctIdx = 2;
        if (correctChar === 'D' || correctChar === '3') correctIdx = 3;

        const points = parseFloat(row[7] || '2.0') || 2.0;
        const explanation = row[8] || '';

        questions.push(
          cleanQuestionMath({
            id: `q-import-${Date.now()}-${i}`,
            type: 'multiple_choice',
            content,
            options: [optA, optB, optC, optD],
            correctOptionIndex: correctIdx,
            points,
            explanation,
          })
        );
      }
    }
  } else {
    // Parse .txt format
    const blocks = text.split(/\[(TRAC_NGHIEM|TU_LUAN)\]/i);
    for (let i = 1; i < blocks.length; i += 2) {
      const typeTag = blocks[i].toUpperCase();
      const blockText = blocks[i + 1] || '';

      const lines = blockText.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
      let content = '';
      const options: string[] = [];
      let correctIdx = 0;
      let points = 2.0;
      let explanation = '';

      lines.forEach((line) => {
        if (line.match(/^Câu\s+\d+:/i)) {
          content = line.replace(/^Câu\s+\d+:\s*/i, '');
        } else if (line.match(/^[A-D]\./i)) {
          options.push(line);
        } else if (line.match(/^Đáp án:/i)) {
          const ansChar = line.replace(/^Đáp án:\s*/i, '').trim().toUpperCase();
          if (ansChar === 'B') correctIdx = 1;
          if (ansChar === 'C') correctIdx = 2;
          if (ansChar === 'D') correctIdx = 3;
        } else if (line.match(/^Điểm:/i)) {
          points = parseFloat(line.replace(/^Điểm:\s*/i, '')) || 2.0;
        } else if (line.match(/^Giải thích:/i)) {
          explanation = line.replace(/^Giải thích:\s*/i, '');
        } else if (!content) {
          content = line;
        }
      });

      if (content) {
        if (typeTag === 'TU_LUAN') {
          questions.push(
            cleanQuestionMath({
              id: `q-import-txt-${Date.now()}-${i}`,
              type: 'essay',
              content,
              points,
              sampleAnswer: explanation,
            })
          );
        } else {
          while (options.length < 4) {
            options.push(`${String.fromCharCode(65 + options.length)}. Lựa chọn ${options.length + 1}`);
          }
          questions.push(
            cleanQuestionMath({
              id: `q-import-txt-${Date.now()}-${i}`,
              type: 'multiple_choice',
              content,
              options,
              correctOptionIndex: correctIdx,
              points,
              explanation,
            })
          );
        }
      }
    }
  }

  return questions;
}
