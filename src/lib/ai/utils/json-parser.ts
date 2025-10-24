/**
 * Enterprise-grade JSON parser for AI responses
 * Handles markdown code blocks, partial JSON, and malformed responses
 */

export interface ParseResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  raw?: string;
}

/**
 * Extract and parse JSON from AI response that may contain markdown code blocks
 */
export function parseAIJSON<T = any>(text: string): ParseResult<T> {
  if (!text || typeof text !== 'string') {
    return {
      success: false,
      error: 'Invalid input: text must be a non-empty string',
      raw: text
    };
  }

  // Try direct JSON parse first (fastest path)
  try {
    const data = JSON.parse(text);
    return { success: true, data };
  } catch {
    // Continue to extraction methods
  }

  // Method 1: Extract from markdown code blocks
  const codeBlockPatterns = [
    /```json\s*\n([\s\S]*?)\n```/,  // ```json ... ```
    /```\s*\n([\s\S]*?)\n```/,       // ``` ... ```
    /`([^`]+)`/,                      // `...`
  ];

  for (const pattern of codeBlockPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      try {
        const data = JSON.parse(match[1].trim());
        return { success: true, data };
      } catch {
        continue;
      }
    }
  }

  // Method 2: Find JSON object boundaries
  const jsonObjectPattern = /\{[\s\S]*\}/;
  const objectMatch = text.match(jsonObjectPattern);
  if (objectMatch) {
    try {
      const data = JSON.parse(objectMatch[0]);
      return { success: true, data };
    } catch {
      // Continue
    }
  }

  // Method 3: Find JSON array boundaries
  const jsonArrayPattern = /\[[\s\S]*\]/;
  const arrayMatch = text.match(jsonArrayPattern);
  if (arrayMatch) {
    try {
      const data = JSON.parse(arrayMatch[0]);
      return { success: true, data };
    } catch {
      // Continue
    }
  }

  // Method 4: Clean up common AI artifacts
  let cleaned = text
    .replace(/^```json\s*/gm, '')
    .replace(/^```\s*/gm, '')
    .replace(/```$/gm, '')
    .replace(/^\s*["']|["']\s*$/g, '') // Remove leading/trailing quotes
    .trim();

  try {
    const data = JSON.parse(cleaned);
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: `Failed to parse JSON: ${error instanceof Error ? error.message : 'Unknown error'}`,
      raw: text
    };
  }
}

/**
 * Parse AI JSON with fallback default value
 */
export function parseAIJSONOrDefault<T>(text: string, defaultValue: T): T {
  const result = parseAIJSON<T>(text);
  return result.success && result.data !== undefined ? result.data : defaultValue;
}

/**
 * Validate and parse expected JSON structure
 */
export function parseAIJSONWithSchema<T>(
  text: string,
  validator: (data: any) => data is T
): ParseResult<T> {
  const result = parseAIJSON(text);

  if (!result.success || !result.data) {
    return result as ParseResult<T>;
  }

  if (!validator(result.data)) {
    return {
      success: false,
      error: 'Parsed data does not match expected schema',
      raw: text
    };
  }

  return result as ParseResult<T>;
}
