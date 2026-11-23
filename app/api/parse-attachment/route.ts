import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import mammoth from "mammoth";
import * as XLSX from "xlsx";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_TEXT_LENGTH = 12000;

const TEXT_EXTENSIONS = new Set([
  "txt", "md", "markdown", "csv", "tsv",
  "json", "xml", "yaml", "yml", "rtf",
  "log", "ini", "toml", "env.example",
  "js", "jsx", "ts", "tsx", "html", "htm",
  "css", "scss", "sass", "less",
  "py", "java", "c", "cpp", "h", "hpp",
  "cs", "php", "rb", "go", "rs", "swift",
  "kt", "sql", "sh", "bash", "ps1",
  "lua", "dart", "vue", "svelte",
  "graphql", "gql", "ipynb",
]);

function cleanText(value: string) {
  return value
    .replace(/\u0000/g, "")
    .replace(/\r\n/g, "\n")
    .trim()
    .slice(0, MAX_TEXT_LENGTH);
}

export async function POST(request: Request) {
  try {
    const auth = await getAuth();
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Please log in before attaching files." },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Please select a file." },
        { status: 400 }
      );
    }

    if (file.size === 0 || file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Files must be smaller than 5 MB." },
        { status: 400 }
      );
    }

    const extension = file.name.split(".").pop()?.toLowerCase() || "";
    const buffer = Buffer.from(await file.arrayBuffer());

    let extractedText = "";

    if (extension === "pdf") {
      const pdf = await getDocument({
        data: new Uint8Array(buffer),
        useSystemFonts: true,
      }).promise;

      const pagesToRead = Math.min(pdf.numPages, 25);
      const pageTexts: string[] = [];

      for (let pageNumber = 1; pageNumber <= pagesToRead; pageNumber++) {
        const page = await pdf.getPage(pageNumber);
        const content = await page.getTextContent();

        pageTexts.push(
          content.items
            .map((item) => ("str" in item ? item.str : ""))
            .join(" ")
        );
      }

      extractedText = pageTexts.join("\n\n");

      if (pdf.numPages > pagesToRead) {
        extractedText += "\n\n[Only the first 25 pages were extracted.]";
      }
    } else if (extension === "docx") {
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value;
    } else if (extension === "xlsx") {
      const workbook = XLSX.read(buffer, { type: "buffer" });

      extractedText = workbook.SheetNames.slice(0, 5)
        .map((sheetName) => {
          const sheet = workbook.Sheets[sheetName];
          return `Sheet: ${sheetName}\n${XLSX.utils.sheet_to_csv(sheet)}`;
        })
        .join("\n\n");
    } else if (TEXT_EXTENSIONS.has(extension)) {
      extractedText = new TextDecoder("utf-8").decode(buffer);

      if (extension === "rtf") {
        extractedText = extractedText
          .replace(/\\'[0-9a-f]{2}/gi, "")
          .replace(/\\[a-z]+-?\d* ?/gi, "")
          .replace(/[{}]/g, "");
      }
    } else {
      return NextResponse.json(
        {
          error:
            "That file type isn't supported yet. Try PDF, DOCX, XLSX, CSV, TXT, Markdown, or a code file.",
        },
        { status: 400 }
      );
    }

    const text = cleanText(extractedText);

    if (!text) {
      return NextResponse.json(
        {
          error:
            "I couldn't extract readable text from this file. It may be scanned or empty.",
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      fileName: file.name,
      text,
      truncated: extractedText.length > MAX_TEXT_LENGTH,
    });
  } catch (error) {
    console.error("Attachment parsing error:", error);

    return NextResponse.json(
      { error: "Aivanta couldn't read that file. Please try another file." },
      { status: 500 }
    );
  }
}
