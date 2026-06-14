import { z } from "zod";

export interface AIProvider {
  generateObject<T>(prompt: string, schema: z.ZodType<T>): Promise<T>;
  generateText(prompt: string): Promise<string>;
}
