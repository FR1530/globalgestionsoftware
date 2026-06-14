import { generateObject, generateText } from "ai";
import { createGroq } from "@ai-sdk/groq";
import { AIProvider } from "./provider";
import { z } from "zod";

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

const MODEL = "llama-3.3-70b-versatile";

export class GroqProvider implements AIProvider {
  async generateObject<T>(prompt: string, schema: z.ZodType<T>): Promise<T> {
    const result = await generateObject({
      model: groq(MODEL),
      schema,
      prompt,
    });
    return result.object;
  }

  async generateText(prompt: string): Promise<string> {
    const result = await generateText({
      model: groq(MODEL),
      prompt,
    });
    return result.text;
  }
}

export const ai = new GroqProvider();
