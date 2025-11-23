import { GoogleGenAI, Type, Schema } from "@google/genai";
import { WordItem, VocabularyLevel } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const wordSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    word: { type: Type.STRING, description: "The English vocabulary word." },
    phonetic: { type: Type.STRING, description: "IPA phonetic transcription." },
    meanings: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING }, 
      description: "A list of correct Chinese meanings/synonyms for the word. Include at least 3 variations." 
    },
    example: { type: Type.STRING, description: "An example sentence using the word." },
    exampleTranslation: { type: Type.STRING, description: "Chinese translation of the example sentence." }
  },
  required: ["word", "phonetic", "meanings", "example", "exampleTranslation"]
};

const batchSchema: Schema = {
  type: Type.ARRAY,
  items: wordSchema
};

export const fetchWordBatch = async (level: VocabularyLevel, count: number = 5): Promise<WordItem[]> => {
  const prompt = `Generate a list of ${count} challenging English vocabulary words specifically for the ${level} level. 
  Focus on words that are frequently tested or easily confused. 
  Provide accurate Chinese meanings (including synonyms), phonetic symbols, and a clear example sentence for each.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: batchSchema,
        temperature: 1.0, // Higher temperature for variety
      }
    });

    const text = response.text;
    if (!text) return [];
    
    return JSON.parse(text) as WordItem[];
  } catch (error) {
    console.error("Failed to fetch words:", error);
    throw error;
  }
};

/**
 * Uses Gemini to fuzzy match the user's answer against the correct meanings.
 * This is useful because Chinese has many ways to say the same thing.
 */
export const smartCheckAnswer = async (
  word: string, 
  correctMeanings: string[], 
  userAnswer: string
): Promise<{ isCorrect: boolean; explanation: string }> => {
  const prompt = `
    Word: "${word}"
    Standard Meanings: ${correctMeanings.join(', ')}
    User Answer: "${userAnswer}"
    
    Task: Determine if the User Answer is a correct Chinese translation for the Word. 
    It doesn't need to match the Standard Meanings exactly, but must be semantically accurate.
    Return JSON: { "isCorrect": boolean, "explanation": string (short reason in Chinese) }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isCorrect: { type: Type.BOOLEAN },
            explanation: { type: Type.STRING }
          }
        }
      }
    });

    const text = response.text;
    if (!text) return { isCorrect: false, explanation: "无法验证" };
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Verification failed, falling back to strict match", error);
    // Fallback logic
    const isStrictMatch = correctMeanings.some(m => userAnswer.includes(m) || m.includes(userAnswer));
    return { isCorrect: isStrictMatch, explanation: isStrictMatch ? "Local match" : "API Error" };
  }
};