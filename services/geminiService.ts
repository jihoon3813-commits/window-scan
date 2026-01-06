
import { GoogleGenAI, Type } from "@google/genai";
import { GeminiMeasurementResponse } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeWindowImage = async (base64Image: string): Promise<GeminiMeasurementResponse> => {
  const model = "gemini-3-flash-preview";
  
  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        parts: [
          {
            text: `Analyze this image of a window. Detect the main window in the frame. 
            Estimate its width and height in centimeters (cm). 
            If there is no physical reference object (like a credit card or person) in the frame, 
            provide the most likely standard dimensions based on architectural patterns. 
            Return the result in JSON format.`
          },
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image.split(',')[1] || base64Image
            }
          }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          width: { 
            type: Type.NUMBER, 
            description: "Estimated width of the window in cm" 
          },
          height: { 
            type: Type.NUMBER, 
            description: "Estimated height of the window in cm" 
          },
          confidence: { 
            type: Type.NUMBER, 
            description: "Confidence score from 0 to 1" 
          },
          reasoning: { 
            type: Type.STRING, 
            description: "Short explanation of how the size was determined" 
          }
        },
        required: ["width", "height", "confidence", "reasoning"]
      }
    }
  });

  const text = response.text;
  try {
    return JSON.parse(text) as GeminiMeasurementResponse;
  } catch (e) {
    console.error("Failed to parse Gemini response", text);
    throw new Error("Failed to analyze image");
  }
};
