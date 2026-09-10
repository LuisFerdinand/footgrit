import type { AiReportResult } from "@/lib/db/schema";

export const AI_MODEL = process.env.GEMINI_API_KEY ? "gemini-1.5-flash" : "demo";
export const aiLiveMode = !!process.env.GEMINI_API_KEY;

/**
 * When GEMINI_API_KEY is set, run the prompt through Gemini and parse a
 * structured AiReportResult; otherwise the caller uses the data-driven demo
 * generators in ./demo.ts. This keeps the module fully usable offline.
 */
export async function generateWithGemini(
  system: string,
  prompt: string,
): Promise<AiReportResult | null> {
  if (!aiLiveMode) return null;
  try {
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: system,
      generationConfig: { responseMimeType: "application/json" },
    });
    const res = await model.generateContent(
      `${prompt}\n\nBalas HANYA dalam JSON dengan bentuk: {"headline": string, "summary": string, "sections": [{"title": string, "body": string, "bullets"?: string[]}], "ratings"?: [{"label": string, "value": number}], "recommendations"?: string[], "tags"?: string[]}`,
    );
    const text = res.response.text();
    return JSON.parse(text) as AiReportResult;
  } catch (e) {
    console.error("Gemini generation failed, falling back to demo:", e);
    return null;
  }
}
