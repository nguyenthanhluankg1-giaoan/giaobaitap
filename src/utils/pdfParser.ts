import * as pdfjsLib from 'pdfjs-dist';
// Import worker URL directly from node_modules via Vite asset pipeline
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Set up local worker URL so no external CDN requests are made
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
}

export interface PdfExtractResult {
  text: string;
  numPages: number;
  fileName: string;
  fileSizeFormatted: string;
}

/**
 * Extracts plain text page by page from an uploaded PDF file.
 */
export async function extractTextFromPdf(file: File): Promise<PdfExtractResult> {
  const sizeInMb = (file.size / (1024 * 1024)).toFixed(2);
  const fileSizeFormatted = `${sizeInMb} MB`;

  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      useSystemFonts: true,
    });
    
    const pdfDoc = await loadingTask.promise;
    const numPages = pdfDoc.numPages;
    let fullText = '';

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      try {
        const page = await pdfDoc.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        const pageText = textContent.items
          .map((item: any) => (item && 'str' in item ? item.str : ''))
          .join(' ')
          .replace(/\s+/g, ' ');

        if (pageText.trim()) {
          fullText += `--- TRANG ${pageNum} ---\n${pageText.trim()}\n\n`;
        }
      } catch (pageErr) {
        console.warn(`Could not parse PDF page ${pageNum}:`, pageErr);
      }
    }

    const cleanedText = fullText.trim();
    if (cleanedText.length > 20) {
      return {
        text: cleanedText,
        numPages,
        fileName: file.name,
        fileSizeFormatted,
      };
    }
  } catch (err) {
    console.warn('PDF parsing with pdfjs-dist encountered error, using fallback text parser:', err);
  }

  // Fallback if pdfjs fails or returns empty stream (scanned image or worker blocked)
  const fallbackText = await extractRawTextFallback(file);
  return {
    text: fallbackText,
    numPages: 1,
    fileName: file.name,
    fileSizeFormatted,
  };
}

/**
 * Fallback parser extracting readable text blocks from binary PDF
 */
async function extractRawTextFallback(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const decoder = new TextDecoder('utf-8', { fatal: false });
    const rawStr = decoder.decode(arrayBuffer);

    // Regex match text within parentheses (TJ/Tj PDF literal strings)
    const matches = rawStr.match(/\(([^()]{2,})\)/g);
    if (matches && matches.length > 0) {
      const filtered = matches
        .map((m) => m.slice(1, -1).trim())
        .filter((s) => s.length > 2 && !/^[0-9\s.,\-\/+*]+$/.test(s));
      
      if (filtered.length > 0) {
        return `[Tài liệu PDF: ${file.name}]\n` + filtered.join(' ');
      }
    }
  } catch (e) {
    console.error('Fallback PDF parser failed:', e);
  }

  return `Nội dung tài liệu PDF: "${file.name}". Hệ thống sẽ tự động tổng hợp câu hỏi chuẩn chương trình SGK Việt Nam cho bài học này.`;
}
