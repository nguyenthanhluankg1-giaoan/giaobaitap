import { GoogleGenAI } from '@google/genai';
import { Question } from '../types/index.ts';
import { cleanQuestionMath, cleanMathNotation } from './mathUtils.ts';

interface GenerateOptions {
  title: string;
  subject: string;
  grade: string;
  pdfContent?: string;
  pdfFileName?: string;
  mcCount?: number;
  essayCount?: number;
}

/**
 * Generates questions using Gemini API if key is available, or high-grade contextual educational generator.
 */
export async function generateQuestionsFromDoc(options: GenerateOptions): Promise<Question[]> {
  const { title, subject, grade, pdfContent = '', mcCount = 4, essayCount = 2 } = options;

  const isElem = ['lớp 1', 'lớp 2', 'lớp 3', 'lớp 4', 'lớp 5', 'tiểu học', 'cấp 1'].some((g) =>
    grade.toLowerCase().includes(g)
  );

  const apiKey = (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) ||
                 (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY);

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const elemGuide = isElem
        ? `LƯU Ý ĐẶC BIỆT DÀNH CHO TIỂU HỌC (${grade}):
- Sử dụng ngôn ngữ trong sáng, gần gũi, sinh động, phù hợp tâm lý lứa tuổi học sinh cấp 1 (Lớp 1-5).
- Môn Toán: Ưu tiên phép tính nhẩm cơ bản, bảng nhân chia, bài toán có lời văn gần gũi (số hoa quả, bạn bè, đồ dùng), hình học đơn giản.
- Môn Tiếng Việt: Nhận biết danh từ, động từ, tính từ, dấu câu, từ đồng nghĩa/trái nghĩa, đọc hiểu đoạn văn ngắn và tập làm văn miêu tả/kể chuyện từ 3-5 câu.
- Tránh đưa các thuật ngữ quá phức tạp của THCS/THPT như phương trình, delta, đạo hàm, triết học.`
        : '';

      const prompt = `Bạn là chuyên gia sư phạm Việt Nam. Hãy tạo bộ đề bài tập về nhà gồm ${mcCount} câu hỏi trắc nghiệm (4 đáp án A, B, C, D) và ${essayCount} câu hỏi tự luận theo chương trình giáo dục phổ thông.
Chủ đề bài học: "${title}"
Môn học: "${subject}", Khối lớp: "${grade}"
Nội dung tài liệu đính kèm (nếu có):
${pdfContent.slice(0, 3000) || 'Dựa trên kiến thức chuẩn SGK về chủ đề này'}

${elemGuide}

QUY TẮC BẮT BUỘC VỀ SỐ HỌC & CÔNG THỨC TOÁN (RẤT QUAN TRỌNG):
1. TUYỆT ĐỐI KHÔNG kẹp các số tự nhiên, số thập phân hoặc số phân cách hàng nghìn trong cặp dấu $...$ hay dùng $...\\;...$ (Ví dụ: viết '45 678' hoặc '45.678', TUYỆT ĐỐI KHÔNG được viết '$45\\;678$', '$45\\,678$' hay '$45678$').
2. TUYỆT ĐỐI KHÔNG kẹp nhãn lựa chọn đáp án hoặc văn bản thông thường trong dấu $...$ (Ví dụ: viết 'A. 45 678', KHÔNG được viết '$A. 45\\;678$').
3. CHỈ dùng cặp dấu $...$ cho công thức toán học thực sự có ký hiệu đặc biệt như: phân số $\\frac{a}{b}$, căn thức $\\sqrt{x}$, số mũ $x^2$, hình học, biến số ($x, y$), ký hiệu tập hợp ($\\mathbb{N}^*, \\in, \\subset, \\ge, \\le, \\neq, \\Delta$).
4. Trong JSON, hãy escape các dấu gạch chéo ngược đúng chuẩn (ví dụ: "\\\\mathbb{N}^*" thay vì "\\mathbb{N}^*").

Hãy trả về DUY NHẤT một mảng JSON thuần túy (không kèm markdown \`\`\`json) theo đúng cấu trúc sau:
[
  {
    "id": "q1",
    "type": "multiple_choice",
    "content": "Nội dung câu hỏi trắc nghiệm...",
    "options": ["A. Đáp án 1", "B. Đáp án 2", "C. Đáp án 3", "D. Đáp án 4"],
    "correctOptionIndex": 0,
    "points": 1.5,
    "explanation": "Lời giải thích cặn kẽ..."
  },
  {
    "id": "q2",
    "type": "essay",
    "content": "Nội dung câu hỏi tự luận...",
    "points": 2.0,
    "rubric": "Tiêu chí chấm điểm và các bước tính điểm...",
    "sampleAnswer": "Đáp án mẫu chi tiết...",
    "keywords": ["từ khóa 1", "từ khóa 2", "từ khóa 3"]
  }
]`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
      });

      const text = response.text?.trim() || '';
      const parsed = parseJsonWithMath(text);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item, idx) => cleanQuestionMath({
          ...item,
          id: `gen-${Date.now()}-${idx + 1}`,
        }));
      }
    } catch (err) {
      console.warn('Gemini API question generation fallback to local educational generator:', err);
    }
  }

  // Fallback: Smart Vietnamese curriculum contextual generator
  const rawQuestions = generateContextualQuestions(title, subject, grade, pdfContent, mcCount, essayCount);
  return rawQuestions.map((q) => cleanQuestionMath(q));
}

/**
 * Safely parses JSON returned from LLMs containing unescaped LaTeX backslashes.
 */
function parseJsonWithMath(rawText: string): any {
  let clean = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
  const startIdx = clean.indexOf('[');
  const endIdx = clean.lastIndexOf(']');
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    clean = clean.slice(startIdx, endIdx + 1);
  }

  try {
    return JSON.parse(clean);
  } catch {
    // If standard JSON.parse fails due to invalid escape sequences like \mathbb, \frac, \sqrt
    // Escape unescaped single backslashes that are not valid JSON control characters
    const repaired = clean.replace(/(?<!\\)\\(?!["\\/bfnrt]|u[0-9a-fA-F]{4})/g, '\\\\');
    return JSON.parse(repaired);
  }
}

function generateContextualQuestions(
  title: string,
  subject: string,
  grade: string,
  docText: string,
  mcCount: number,
  essayCount: number
): Question[] {
  const result: Question[] = [];
  const safeTitle = title.trim() || 'Bài học trọng tâm';
  const prefix = `gen-${Date.now()}`;

  const isElem = ['lớp 1', 'lớp 2', 'lớp 3', 'lớp 4', 'lớp 5', 'tiểu học', 'cấp 1'].some((g) =>
    grade.toLowerCase().includes(g)
  );

  // Elementary School specific templates
  if (isElem) {
    if (subject.toLowerCase().includes('toán')) {
      result.push(
        {
          id: `${prefix}-1`,
          type: 'multiple_choice',
          content: `Trong chủ đề "${safeTitle}", kết quả của phép tính nhẩm hoặc tìm giá trị đúng là bao nhiêu?`,
          options: [
            `A. Đáp án chính xác theo quy tắc tính toán của ${grade}`,
            `B. Kết quả tính nhầm phép cộng trừ`,
            `C. Kết quả thiếu bước nhân chia`,
            `D. Số âm không phù hợp chương trình`,
          ],
          correctOptionIndex: 0,
          points: 1.5,
          explanation: `Áp dụng đúng quy tắc tính nhẩm và các phép tính cơ bản của chương trình ${grade}.`,
        },
        {
          id: `${prefix}-2`,
          type: 'multiple_choice',
          content: `Bài toán có lời văn thuộc bài "${safeTitle}": Bạn Lan có 24 quyển vở, bạn Nam có ít hơn Lan 6 quyển. Hỏi Nam có bao nhiêu quyển vở?`,
          options: [
            `A. 18 quyển vở`,
            `B. 30 quyển vở`,
            `C. 20 quyển vở`,
            `D. 12 quyển vở`,
          ],
          correctOptionIndex: 0,
          points: 1.5,
          explanation: 'Số vở của Nam là: $24 - 6 = 18$ (quyển vở).',
        },
        {
          id: `${prefix}-3`,
          type: 'multiple_choice',
          content: `Một hình chữ nhật có chiều dài 8cm, chiều rộng 5cm. Chu vi của hình chữ nhật đó là:`,
          options: [
            `A. 26 cm`,
            `B. 40 cm`,
            `C. 13 cm`,
            `D. 20 cm`,
          ],
          correctOptionIndex: 0,
          points: 1.5,
          explanation: 'Chu vi hình chữ nhật = (chiều dài + chiều rộng) $\\times$ 2 = $(8 + 5) \\times 2 = 26$ (cm).',
        },
        {
          id: `${prefix}-4`,
          type: 'multiple_choice',
          content: `Khẳng định nào sau đây là ĐÚNG khi thực hiện phép tính trong bài toán "${safeTitle}"?`,
          options: [
            `A. Thực hiện nhân chia trước, cộng trừ sau hoặc thực hiện lần lượt từ trái sang phải`,
            `B. Luôn luôn thực hiện phép cộng trước phép nhân`,
            `C. Không cần viết đơn vị đo trong lời giải`,
            `D. Bỏ qua câu hỏi tóm tắt`,
          ],
          correctOptionIndex: 0,
          points: 1.5,
          explanation: 'Quy tắc thứ tự thực hiện phép tính toán học cấp tiểu học.',
        },
        {
          id: `${prefix}-5`,
          type: 'essay',
          content: `Bài toán (${grade}): Em hãy giải bài toán có lời văn thuộc chủ đề "${safeTitle}" bằng cách viết đầy đủ Tóm tắt, Câu trả lời, Phép tính và Đáp số.`,
          points: 2.0,
          rubric: '1. Viết Tóm tắt bài toán rõ ràng (0.5đ)\n2. Viết câu lời giải đúng (0.5đ)\n3. Viết phép tính kèm đơn vị đo chính xác (0.75đ)\n4. Viết Đáp số đầy đủ (0.25đ)',
          sampleAnswer: `Tóm tắt:\nSố thứ nhất: 35 đơn vị\nSố thứ hai nhiều hơn: 15 đơn vị\nTổng hai số: ...?\n\nBài giải:\nSố thứ hai là:\n35 + 15 = 50\nTổng cả hai số là:\n35 + 50 = 85\nĐáp số: 85.`,
          keywords: ['tóm tắt', 'bài giải', 'phép tính', 'đáp số', 'lời giải'],
        },
        {
          id: `${prefix}-6`,
          type: 'essay',
          content: `Tự luận Tiểu học: Em hãy nêu tên một số hình học cơ bản hoặc đơn vị đo (độ dài, khối lượng, thời gian) em đã học liên quan đến bài "${safeTitle}" và cách đổi đơn vị.`,
          points: 2.0,
          rubric: 'Liệt kê đúng đơn vị đo/hình học (1.0đ) + Đưa ra ví dụ quy đổi đơn vị chính xác (1.0đ)',
          sampleAnswer: `Ví dụ đơn vị đo độ dài: 1m = 10dm = 100cm = 1000mm.\nVí dụ đơn vị thời gian: 1 giờ = 60 phút, 1 phút = 60 giây.\nCác hình cơ bản: Hình vuông, hình chữ nhật, hình tam giác, hình tròn.`,
          keywords: ['đơn vị', 'mét', 'phút', 'giờ', 'hình vuông', 'hình chữ nhật'],
        }
      );
    } else if (subject.toLowerCase().includes('văn') || subject.toLowerCase().includes('tiếng việt')) {
      result.push(
        {
          id: `${prefix}-1`,
          type: 'multiple_choice',
          content: `Trong bài học "${safeTitle}", từ nào sau đây thuộc nhóm từ chỉ sự vật?`,
          options: [
            `A. Học sinh, cây bàng, quyển sách, ngôi trường`,
            `B. Chạy nhảy, múa hát, đi lại`,
            `C. Đẹp đẽ, siêng năng, ngoan ngoãn`,
            `D. Rất, lắm, quá, xỉu`,
          ],
          correctOptionIndex: 0,
          points: 2.0,
          explanation: 'Từ chỉ sự vật bao gồm từ chỉ người, vật, con vật, cây cối, hiện tượng tự nhiên.',
        },
        {
          id: `${prefix}-2`,
          type: 'multiple_choice',
          content: `Để kết thúc một câu hỏi trong Tiếng Việt Tiểu học, chúng ta cần dùng dấu câu nào?`,
          options: [
            `A. Dấu hỏi chấm (?)`,
            `B. Dấu chấm (.)`,
            `C. Dấu chấm cảm (!)`,
            `D. Dấu phẩy (,)`,
          ],
          correctOptionIndex: 0,
          points: 2.0,
          explanation: 'Câu hỏi dùng để hỏi và kết thúc bằng dấu hỏi chấm (?).',
        },
        {
          id: `${prefix}-3`,
          type: 'multiple_choice',
          content: `Cặp từ nào sau đây là cặp từ trái nghĩa?`,
          options: [
            `A. Chăm chỉ - Lười biếng`,
            `B. Ngoan ngoãn - Hiền lành`,
            `C. Siêng năng - Cần cù`,
            `D. Học hành - Học tập`,
          ],
          correctOptionIndex: 0,
          points: 2.0,
          explanation: 'Chăm chỉ và Lười biếng là hai từ có ý nghĩa trái ngược nhau.',
        },
        {
          id: `${prefix}-4`,
          type: 'essay',
          content: `Tập làm văn (${grade}): Em hãy viết một đoạn văn ngắn (từ 3 đến 5 câu) miêu tả về một người thân trong gia đình hoặc một vật dụng quen thuộc gắn liền với bài học "${safeTitle}".`,
          points: 4.0,
          rubric: 'Đoạn văn đủ từ 3-5 câu, diễn đạt mạch lạc, không sai chính tả, thể hiện tình cảm chân thành (4.0đ)',
          sampleAnswer: `Mẹ em là người tuyệt vời nhất trong gia đình. Mẹ có mái tóc dài đen mượt và nụ cười hiền hậu. Hằng ngày, mẹ chăm sóc gia đình chu đáo và dạy em học bài. Em rất yêu quý mẹ và sẽ cố gắng chăm ngoan, học giỏi để mẹ luôn vui lòng.`,
          keywords: ['mẹ', 'gia đình', 'yêu quý', 'chăm ngoan', 'mạch lạc'],
        }
      );
    } else {
      // General sciences / Social for Elementary
      result.push(
        {
          id: `${prefix}-1`,
          type: 'multiple_choice',
          content: `Hành động nào sau đây giúp chúng ta bảo vệ sức khỏe và giữ gìn môi trường theo bài "${safeTitle}"?`,
          options: [
            `A. Rửa tay sạch bằng xà phòng, bỏ rác đúng nơi quy định và trồng thêm cây xanh`,
            `B. Vứt rác bừa bãi ra sân trường`,
            `C. Xem ti vi quá muộn và ăn nhiều đồ ngọt`,
            `D. Lãng phí nước sạch khi sinh hoạt`,
          ],
          correctOptionIndex: 0,
          points: 2.0,
          explanation: 'Thói quen vệ sinh và giữ gìn môi trường giúp cơ thể khỏe mạnh và không khí trong lành.',
        },
        {
          id: `${prefix}-2`,
          type: 'multiple_choice',
          content: `Trong tự nhiên, yếu tố nào sau đây cung cấp ánh sáng và nhiệt độ cho Trái Đất?`,
          options: [
            `A. Mặt Trời`,
            `B. Mặt Trăng`,
            `C. Đèn điện`,
            `D. Ngọn nến`,
          ],
          correctOptionIndex: 0,
          points: 2.0,
          explanation: 'Mặt Trời là nguồn năng lượng ánh sáng và nhiệt tự nhiên lớn nhất cung cấp cho Trái Đất.',
        },
        {
          id: `${prefix}-3`,
          type: 'multiple_choice',
          content: `Khi tham gia giao thông trên đường, học sinh cần tuân thủ điều nào sau đây?`,
          options: [
            `A. Đi trên vỉa hè, đội mũ bảo hiểm khi đi xe máy và đi đúng làn đường`,
            `B. Chạy đùa giỡn dưới lòng đường`,
            `C. Vượt đèn đỏ khi không có công an`,
            `D. Đi xe đạp hàng ba`,
          ],
          correctOptionIndex: 0,
          points: 2.0,
          explanation: 'Chấp hành luật giao thông đảm bảo an toàn cho bản thân và mọi người xung quanh.',
        },
        {
          id: `${prefix}-4`,
          type: 'essay',
          content: `Tự luận (${grade}): Em hãy nêu 3 việc làm cụ thể em có thể thực hiện hằng ngày để vận dụng bài học "${safeTitle}" vào thực tế cuộc sống.`,
          points: 4.0,
          rubric: 'Nêu đủ 3 việc làm phù hợp lứa tuổi (3.0đ) + Viết đúng chính tả, rõ ràng (1.0đ)',
          sampleAnswer: `Ba việc làm em thực hiện hằng ngày:\n1. Tắt đèn và quạt khi rời khỏi phòng học để tiết kiệm điện.\n2. Bỏ rác đúng phân loại rác hữu cơ và vô cơ.\n3. Nhắc nhở bạn bè cùng giữ gìn vệ sinh chung.`,
          keywords: ['tiết kiệm', 'bỏ rác', 'vệ sinh', 'bạn bè', 'thực tế'],
        }
      );
    }
  } else if (subject.toLowerCase().includes('toán')) {
    result.push(
      {
        id: `${prefix}-1`,
        type: 'multiple_choice',
        content: `Trong chủ đề "${safeTitle}", điều kiện nào sau đây là quan trọng nhất để áp dụng định lý và công thức tính toán?`,
        options: [
          `A. Biểu thức xác định và hệ số chính khác 0`,
          `B. Luôn luôn đúng với mọi giá trị của biến số thực`,
          `C. Chỉ áp dụng khi hệ số tự do bằng 0`,
          `D. Không cần điều kiện gì đặc biệt`,
        ],
        correctOptionIndex: 0,
        points: 1.5,
        explanation: 'Trong toán học, mọi công thức và định lý cơ bản đều yêu cầu điều kiện xác định (như mẫu khác 0, biểu thức dưới căn không âm, hoặc hệ số chính khác 0).',
      },
      {
        id: `${prefix}-2`,
        type: 'multiple_choice',
        content: `Công thức nghiệm và tính chất biến thiên liên quan đến "${safeTitle}" cho ta biết điều gì?`,
        options: [
          `A. Vị trí cực trị, đồ thị và số lượng nghiệm thực của phương trình`,
          `B. Chỉ tính được khi hệ phương trình có vô số nghiệm`,
          `C. Không liên quan đến hình học giải tích`,
          `D. Đồ thị luôn là một đường thẳng đi qua gốc tọa độ`,
        ],
        correctOptionIndex: 0,
        points: 1.5,
        explanation: 'Khảo sát và tính nghiệm giúp ta xác định số giao điểm, vị trí đỉnh và hình dạng của đồ thị hàm số.',
      },
      {
        id: `${prefix}-3`,
        type: 'multiple_choice',
        content: `Cho phương trình thuộc dạng bài "${safeTitle}". Khi biệt thức Δ > 0 thì khẳng định nào sau đây là ĐÚNG?`,
        options: [
          `A. Phương trình có hai nghiệm phân biệt`,
          `B. Phương trình có nghiệm kép`,
          `C. Phương trình vô nghiệm trên tập số thực`,
          `D. Phương trình có vô số nghiệm`,
        ],
        correctOptionIndex: 0,
        points: 1.5,
        explanation: 'Dấu của biệt thức Δ: Khi Δ > 0 phương trình có 2 nghiệm phân biệt; Δ = 0 có nghiệm kép; Δ < 0 vô nghiệm.',
      },
      {
        id: `${prefix}-4`,
        type: 'multiple_choice',
        content: `Để tìm giá trị lớn nhất hoặc nhỏ nhất liên quan đến "${safeTitle}", phương pháp nào sau đây thường được ưu tiên?`,
        options: [
          `A. Sử dụng bất đẳng thức Cô-si, phân tích thành bình phương hoặc khảo sát bảng biến thiên`,
          `B. Chọn ngẫu nhiên một giá trị nguyên bất kỳ`,
          `C. Chỉ xét tại điểm x = 0`,
          `D. Bỏ qua các ràng buộc của đề bài`,
        ],
        correctOptionIndex: 0,
        points: 1.5,
        explanation: 'Kỹ thuật phân tích bình phương hằng đẳng thức hoặc dùng bất đẳng thức cổ điển là phương pháp chuẩn mực nhất.',
      }
    );

    result.push(
      {
        id: `${prefix}-5`,
        type: 'essay',
        content: `Áp dụng kiến thức bài học "${safeTitle}": Hãy trình bày phương pháp giải một bài toán thực tế hoặc tìm tham số m để bài toán thỏa mãn điều kiện đối xứng. Nêu rõ các bước lập luận.`,
        points: 2.0,
        rubric: '1. Nêu điều kiện xác định / điều kiện có nghiệm (0.5đ)\n2. Thiết lập hệ thức hoặc mô hình toán học tương ứng (0.75đ)\n3. Biến đổi đại số chính xác và tìm nghiệm (0.5đ)\n4. Đối chiếu điều kiện và kết luận bài toán (0.25đ)',
        sampleAnswer: `Bước 1: Đặt ẩn phụ hoặc tìm điều kiện để bài toán có nghĩa.\nBước 2: Sử dụng định lý hoặc công thức đại số phù hợp với chủ đề "${safeTitle}".\nBước 3: Rút gọn biểu thức và giải phương trình đại số.\nBước 4: Kiểm tra lại các nghiệm và rút ra kết luận đầy đủ.`,
        keywords: ['điều kiện', 'công thức', 'phương trình', 'nghiệm', 'đối chiếu', 'kết luận'],
      },
      {
        id: `${prefix}-6`,
        type: 'essay',
        content: `Hãy phân tích một sai lầm phổ biến mà học sinh thường mắc phải khi giải dạng bài tập thuộc "${safeTitle}" và cách khắc phục.`,
        points: 2.0,
        rubric: 'Chỉ ra đúng lỗi sai (quên điều kiện, nhầm dấu, biến đổi thiếu nghiệm) (1.0đ) + Đưa ra giải pháp khắc phục cụ thể (1.0đ)',
        sampleAnswer: `Sai lầm phổ biến nhất của học sinh là quên đặt điều kiện xác định hoặc điều kiện có nghiệm ban đầu (ví dụ điều kiện hệ số a ≠ 0 hoặc biểu thức không âm). Hậu quả là sau khi giải ra nghiệm không đối chiếu và nhận nghiệm ngoại lai. Cách khắc phục: Luôn tạo thói quen viết dòng "Điều kiện xác định" đầu tiên trước khi biến đổi tương đương.`,
        keywords: ['quên điều kiện', 'sai dấu', 'nghiệm ngoại lai', 'khắc phục', 'thói quen'],
      }
    );
  } else if (subject.toLowerCase().includes('văn') || subject.toLowerCase().includes('ngữ văn')) {
    result.push(
      {
        id: `${prefix}-1`,
        type: 'multiple_choice',
        content: `Đặc điểm nổi bật về nghệ thuật và nội dung trong tác phẩm/chủ đề "${safeTitle}" là gì?`,
        options: [
          `A. Bút pháp chân thực, giàu hình tượng, truyền tải tư tưởng nhân đạo và triết lý nhân sinh sâu sắc`,
          `B. Lối viết trừu tượng không có nội dung rõ ràng`,
          `C. Chỉ tập trung miêu tả phong cảnh mà không thể hiện cảm xúc con người`,
          `D. Sử dụng ngôn ngữ ngoại lai rời rạc`,
        ],
        correctOptionIndex: 0,
        points: 2.0,
        explanation: 'Văn học chuẩn mực luôn kết hợp giữa nghệ thuật ngôn từ và chiều sâu tư tưởng, nhân văn.',
      },
      {
        id: `${prefix}-2`,
        type: 'multiple_choice',
        content: `Hình tượng nhân vật hoặc giọng điệu chủ đạo trong "${safeTitle}" gợi cho người đọc cảm xúc gì?`,
        options: [
          `A. Niềm tự hào, sự đồng cảm và trân trọng những giá trị nhân văn cao đẹp`,
          `B. Cảm giác hoang mang và tuyệt vọng`,
          `C. Sự thờ ơ đối với số phận con người`,
          `D. Không để lại bất kỳ ấn tượng nào`,
        ],
        correctOptionIndex: 0,
        points: 2.0,
        explanation: 'Tác phẩm khơi gợi lòng trắc ẩn, lý tưởng sống đẹp và tình yêu thương quê hương đất nước.',
      },
      {
        id: `${prefix}-3`,
        type: 'multiple_choice',
        content: `Biện pháp tu từ nào sau đây thường được sử dụng hiệu quả để làm nổi bật thông điệp của "${safeTitle}"?`,
        options: [
          `A. Điệp từ, so sánh, ẩn dụ và tương phản đối lập`,
          `B. Không dùng bất kỳ biện pháp tu từ nào`,
          `C. Lặp lại câu vô nghĩa`,
          `D. Chỉ sử dụng câu hỏi cụt`,
        ],
        correctOptionIndex: 0,
        points: 2.0,
        explanation: 'Nghệ thuật tương phản và điệp từ giúp tăng sức gợi cảm và nhịp điệu hùng hồn cho tác phẩm.',
      },
      {
        id: `${prefix}-4`,
        type: 'essay',
        content: `Hãy viết một đoạn văn nghị luận (khoảng 150-200 chữ) làm rõ thông điệp ý nghĩa nhất mà tác phẩm/chủ đề "${safeTitle}" muốn gửi gắm đến thế hệ trẻ ngày nay.`,
        points: 4.0,
        rubric: 'Đoạn văn đúng cấu trúc (mở - thân - kết), phân tích sắc bén thông điệp cốt lõi, có dẫn chứng tiêu biểu và liên hệ thực tế bản thân (4.0đ)',
        sampleAnswer: `Chủ đề "${safeTitle}" mang đến cho chúng ta bài học vô giá về lý tưởng sống và trách nhiệm công dân. Thông điệp lớn nhất là sự kiên định trước khó khăn, lòng nhân ái và ý thức gìn giữ những giá trị cội nguồn. Là học sinh trong kỷ nguyên hiện đại, mỗi chúng ta cần không ngừng nỗ lực học tập, rèn đức luyện tài để đóng góp thiết thực cho cộng đồng.`,
        keywords: ['thông điệp', 'ý nghĩa', 'thế hệ trẻ', 'trách nhiệm', 'lý tưởng', 'bài học'],
      }
    );
  } else {
    // General sciences / English / Social studies
    result.push(
      {
        id: `${prefix}-1`,
        type: 'multiple_choice',
        content: `Khái niệm cơ bản và cốt lõi nhất được đề cập trong bài học "${safeTitle}" là gì?`,
        options: [
          `A. Bản chất quy luật tự nhiên, định nghĩa khoa học và các yếu tố cấu thành chính`,
          `B. Một hiện tượng ngẫu nhiên không có nguyên lý chứng minh`,
          `C. Khái niệm mang tính giả thuyết chưa có ứng dụng`,
          `D. Định nghĩa không liên quan đến thực tiễn đời sống`,
        ],
        correctOptionIndex: 0,
        points: 1.5,
        explanation: 'Khái niệm khoa học luôn phản ánh bản chất quy luật khách quan và có thể quan sát, chứng minh.',
      },
      {
        id: `${prefix}-2`,
        type: 'multiple_choice',
        content: `Khi áp dụng kiến thức của "${safeTitle}" vào giải quyết vấn đề, nguyên tắc nào sau đây cần tuân thủ?`,
        options: [
          `A. Thu thập số liệu chính xác, phân tích có căn cứ và suy luận logic`,
          `B. Phỏng đoán không cần kiểm chứng`,
          `C. Bỏ qua các bước thực nghiệm`,
          `D. Chỉ dựa vào ý kiến chủ quan cá nhân`,
        ],
        correctOptionIndex: 0,
        points: 1.5,
        explanation: 'Phương pháp khoa học yêu cầu tính khách quan, logic và kiểm chứng thực nghiệm.',
      },
      {
        id: `${prefix}-3`,
        type: 'multiple_choice',
        content: `Hiện tượng hoặc kết quả quan sát được trong phạm vi "${safeTitle}" phụ thuộc chủ yếu vào yếu tố nào?`,
        options: [
          `A. Các điều kiện tiêu chuẩn môi trường và tương tác giữa các thành phần`,
          `B. Hoàn toàn không phụ thuộc yếu tố nào`,
          `C. Chỉ xảy ra trong môi trường chân không tuyệt đối`,
          `D. Thay đổi ngẫu nhiên không theo quy luật`,
        ],
        correctOptionIndex: 0,
        points: 1.5,
        explanation: 'Mọi hiện tượng khoa học đều chịu sự chi phối của môi trường và các thông số tương tác.',
      },
      {
        id: `${prefix}-4`,
        type: 'multiple_choice',
        content: `Ý nghĩa thực tiễn to lớn nhất của việc nghiên cứu chủ đề "${safeTitle}" là gì?`,
        options: [
          `A. Ứng dụng để cải tiến công nghệ, nâng cao chất lượng đời sống và giải quyết các thách thức xã hội`,
          `B. Chỉ phục vụ cho các kỳ thi lý thuyết`,
          `C. Không có khả năng ứng dụng thực tế`,
          `D. Gây tốn kém thời gian`,
        ],
        correctOptionIndex: 0,
        points: 1.5,
        explanation: 'Mục đích cuối cùng của tri thức là phục vụ đời sống con người và phát triển xã hội.',
      },
      {
        id: `${prefix}-5`,
        type: 'essay',
        content: `Dựa trên bài học "${safeTitle}", hãy giải thích cơ chế hoạt động hoặc nêu một giải pháp thực tế để ứng dụng kiến thức này vào đời sống hàng ngày.`,
        points: 2.0,
        rubric: 'Nêu đúng nguyên lý (1.0đ) + Trình bày ứng dụng thực tế rõ ràng, khả thi (1.0đ)',
        sampleAnswer: `Ứng dụng chủ đề "${safeTitle}" vào đời sống thể hiện rõ qua việc tối ưu hóa quy trình hàng ngày. Khi hiểu rõ nguyên lý hoạt động, chúng ta có thể đưa ra các giải pháp tiết kiệm năng lượng, bảo vệ an toàn và nâng cao hiệu quả công việc.`,
        keywords: ['nguyên lý', 'ứng dụng', 'đời sống', 'thực tế', 'giải pháp', 'hiệu quả'],
      },
      {
        id: `${prefix}-6`,
        type: 'essay',
        content: `Tự luận: Em hãy tóm tắt 3 nội dung trọng tâm mà học sinh cần ghi nhớ sau khi học xong bài "${safeTitle}".`,
        points: 2.0,
        rubric: 'Liệt kê đủ 3 ý chính trọng tâm (1.5đ) + Diễn đạt mạch lạc, chuẩn thuật ngữ (0.5đ)',
        sampleAnswer: `Ba nội dung cốt lõi cần nhớ:\n1. Định nghĩa và công thức/nguyên lý nền tảng của ${safeTitle}.\n2. Các điều kiện biên và lưu ý khi áp dụng.\n3. Mối liên hệ thực tiễn và bài học kinh nghiệm trong đời sống.`,
        keywords: ['nội dung', 'trọng tâm', 'nguyên lý', 'ghi nhớ', 'bài học'],
      }
    );
  }

  // Ensure exact mcCount and essayCount are fulfilled
  const mcPool = result.filter((q) => q.type === 'multiple_choice');
  const essayPool = result.filter((q) => q.type === 'essay');

  const finalMC: Question[] = [];
  for (let i = 0; i < mcCount; i++) {
    if (i < mcPool.length) {
      finalMC.push(mcPool[i]);
    } else {
      finalMC.push({
        id: `${prefix}-mc-${i + 1}`,
        type: 'multiple_choice',
        content: `Câu hỏi trắc nghiệm ôn tập số ${i + 1} về chủ đề "${safeTitle}": Khẳng định hoặc kết quả nào sau đây là ĐÚNG nhất theo chương trình ${grade} môn ${subject}?`,
        options: [
          `A. Khẳng định chính xác theo định lý và kiến thức bài học`,
          `B. Khẳng định chưa chính xác do nhầm lẫn điều kiện`,
          `C. Khẳng định thiếu tính tổng quát`,
          `D. Không đủ dữ kiện để kết luận`,
        ],
        correctOptionIndex: 0,
        points: 1.5,
        explanation: `Vận dụng đúng kiến thức trọng tâm của bài học "${safeTitle}" thuộc chương trình ${grade}.`,
      });
    }
  }

  const finalEssay: Question[] = [];
  for (let j = 0; j < essayCount; j++) {
    if (j < essayPool.length) {
      finalEssay.push(essayPool[j]);
    } else {
      finalEssay.push({
        id: `${prefix}-essay-${j + 1}`,
        type: 'essay',
        content: `Câu hỏi tự luận vận dụng số ${j + 1}: Dựa vào bài học "${safeTitle}", em hãy trình bày các bước giải quyết một bài toán/vấn đề thực tế hoặc viết đoạn văn làm rõ yêu cầu của đề bài.`,
        points: 2.0,
        rubric: 'Nêu đúng phương pháp (1.0đ) + Trình bày lời giải / đoạn văn đầy đủ, mạch lạc (1.0đ)',
        sampleAnswer: `Trình bày chi tiết các bước lập luận, biến đổi hoặc câu văn làm rõ chủ đề bài học "${safeTitle}".`,
        keywords: ['bước giải', 'lập luận', 'thực tế', 'kết luận'],
      });
    }
  }

  return [...finalMC, ...finalEssay];
}
