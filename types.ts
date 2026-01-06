
export interface WindowMeasurement {
  id: string;
  widthCm: number;
  heightCm: number;
  locationName: string;
  imageUrl: string;
  timestamp: number;
  notes?: string;
  confidence: number;
}

export enum AppState {
  HOME = 'HOME',
  CAPTURE = 'CAPTURE',
  PROCESSING = 'PROCESSING',
  RESULT = 'RESULT',
  HISTORY = 'HISTORY'
}

export interface GeminiMeasurementResponse {
  width: number;
  height: number;
  confidence: number;
  reasoning: string;
}
