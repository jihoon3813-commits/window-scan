
import { GoogleGenAI, Type } from "@google/genai";
import { GeminiMeasurementResponse } from "../types";

export const analyzeWindowImage = async (base64Image: string): Promise<GeminiMeasurementResponse> => {
  // Always create a new instance to ensure we use the most up-to-date environment variables
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = "gemini-3-flash-preview";
  
  try {
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
    if (!text) throw new Error("Empty response from AI");
    
    return JSON.parse(text) as GeminiMeasurementResponse;
  } catch (e: any) {
    console.error("Gemini analysis error:", e);
    // Specifically handle potential API key issues often encountered in new deployments
    if (e.message?.includes("Requested entity was not found") || e.message?.includes("API key")) {
        throw new Error("API Key가 유효하지 않거나 설정되지 않았습니다. Vercel 환경 변수를 확인해주세요.");
    }
    throw new Error("이미지 분석 중 오류가 발생했습니다.");
  }
};
