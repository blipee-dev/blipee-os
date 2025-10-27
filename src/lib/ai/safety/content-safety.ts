/**
 * Content Safety Module
 *
 * Provides stream transformations for content safety, filtering, and compliance.
 * Features:
 * - Inappropriate content detection and blocking
 * - Sensitive information filtering (PII, credentials, API keys)
 * - Compliance enforcement (professional tone, business appropriate)
 * - Real-time violation logging
 */

import type { TextStreamPart, ToolSet } from 'ai';

/**
 * Content safety configuration
 */
export interface ContentSafetyConfig {
  // Block inappropriate content
  blockInappropriate?: boolean;
  // Filter sensitive information (PII, credentials)
  filterSensitive?: boolean;
  // Enforce professional/business appropriate tone
  enforceProfessional?: boolean;
  // Custom blocked words/phrases
  customBlockedTerms?: string[];
  // Callback for safety violations
  onViolation?: (violation: SafetyViolation) => void;
}

/**
 * Safety violation details
 */
export interface SafetyViolation {
  type: 'inappropriate' | 'sensitive' | 'unprofessional' | 'custom';
  reason: string;
  detectedContent?: string;
  timestamp: Date;
}

/**
 * Patterns for sensitive information detection
 */
const SENSITIVE_PATTERNS = {
  // Email addresses
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,

  // Phone numbers (various formats)
  phone: /\b(\+\d{1,3}[-.]?)?\(?\d{3}\)?[-.]?\d{3}[-.]?\d{4}\b/g,

  // Credit card numbers (basic pattern)
  creditCard: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,

  // Social Security Numbers (US)
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g,

  // API keys and tokens (common patterns)
  apiKey: /\b[A-Za-z0-9_-]{32,}\b/g,

  // AWS access keys
  awsAccessKey: /\b(AKIA|ASIA)[A-Z0-9]{16}\b/g,

  // Generic secrets/passwords in text
  secret: /\b(secret|password|token|key)[\s:=]+[^\s]+/gi,
};

/**
 * Inappropriate content indicators
 */
const INAPPROPRIATE_INDICATORS = [
  // Add patterns for inappropriate content
  // These are examples - customize based on your needs
  'OFFENSIVE_TERM',
  'INAPPROPRIATE_PHRASE',
];

/**
 * Unprofessional language indicators
 */
const UNPROFESSIONAL_INDICATORS = [
  'lol',
  'lmao',
  'wtf',
  'omg',
  // Add more as needed
];

/**
 * Check if text contains sensitive information
 */
function containsSensitiveInfo(text: string): { hasSensitive: boolean; type?: string } {
  for (const [type, pattern] of Object.entries(SENSITIVE_PATTERNS)) {
    if (pattern.test(text)) {
      return { hasSensitive: true, type };
    }
  }
  return { hasSensitive: false };
}

/**
 * Check if text contains inappropriate content
 */
function containsInappropriateContent(text: string): boolean {
  const lowerText = text.toLowerCase();
  return INAPPROPRIATE_INDICATORS.some(term => lowerText.includes(term.toLowerCase()));
}

/**
 * Check if text contains unprofessional language
 */
function containsUnprofessionalLanguage(text: string): boolean {
  const lowerText = text.toLowerCase();
  return UNPROFESSIONAL_INDICATORS.some(term => {
    const regex = new RegExp(`\\b${term}\\b`, 'i');
    return regex.test(lowerText);
  });
}

/**
 * Redact sensitive information from text
 */
function redactSensitiveInfo(text: string): string {
  let redacted = text;

  // Redact emails
  redacted = redacted.replace(SENSITIVE_PATTERNS.email, '[EMAIL_REDACTED]');

  // Redact phone numbers
  redacted = redacted.replace(SENSITIVE_PATTERNS.phone, '[PHONE_REDACTED]');

  // Redact credit cards
  redacted = redacted.replace(SENSITIVE_PATTERNS.creditCard, '[CARD_REDACTED]');

  // Redact SSNs
  redacted = redacted.replace(SENSITIVE_PATTERNS.ssn, '[SSN_REDACTED]');

  // Redact API keys
  redacted = redacted.replace(SENSITIVE_PATTERNS.apiKey, '[API_KEY_REDACTED]');

  // Redact AWS keys
  redacted = redacted.replace(SENSITIVE_PATTERNS.awsAccessKey, '[AWS_KEY_REDACTED]');

  // Redact secrets
  redacted = redacted.replace(SENSITIVE_PATTERNS.secret, '[SECRET_REDACTED]');

  return redacted;
}

/**
 * Create a content safety transform
 */
export function createContentSafetyTransform<TOOLS extends ToolSet>(
  config: ContentSafetyConfig = {}
) {
  const {
    blockInappropriate = true,
    filterSensitive = true,
    enforceProfessional = true,
    customBlockedTerms = [],
    onViolation
  } = config;

  let textBuffer = '';
  const bufferSize = 100; // Check text in chunks to catch patterns across chunk boundaries

  return ({ stopStream }: { stopStream: () => void }) =>
    new TransformStream<TextStreamPart<TOOLS>, TextStreamPart<TOOLS>>({
      transform(chunk, controller) {
        // Only process text chunks
        if (chunk.type !== 'text') {
          controller.enqueue(chunk);
          return;
        }

        // Add to buffer for pattern matching
        textBuffer += chunk.text;

        // Keep buffer size manageable
        if (textBuffer.length > bufferSize * 2) {
          textBuffer = textBuffer.slice(-bufferSize);
        }

        let processedText = chunk.text;

        // 1. Check for custom blocked terms
        if (customBlockedTerms.length > 0) {
          const lowerText = textBuffer.toLowerCase();
          for (const term of customBlockedTerms) {
            if (lowerText.includes(term.toLowerCase())) {
              const violation: SafetyViolation = {
                type: 'custom',
                reason: `Blocked term detected: ${term}`,
                detectedContent: chunk.text,
                timestamp: new Date()
              };

              if (onViolation) {
                onViolation(violation);
              }

              console.warn('[Content Safety] Custom blocked term detected, stopping stream');
              stopStream();

              // Emit finish events
              controller.enqueue({
                type: 'finish-step',
                finishReason: 'stop',
                logprobs: undefined,
                usage: { completionTokens: 0, promptTokens: 0, totalTokens: 0 },
                request: {},
                response: { id: 'safety-stop', modelId: '', timestamp: new Date() },
                warnings: [],
                isContinued: false,
              });

              controller.enqueue({
                type: 'finish',
                finishReason: 'stop',
                logprobs: undefined,
                usage: { completionTokens: 0, promptTokens: 0, totalTokens: 0 },
                response: { id: 'safety-stop', modelId: '', timestamp: new Date() },
              });

              return;
            }
          }
        }

        // 2. Check for inappropriate content
        if (blockInappropriate && containsInappropriateContent(textBuffer)) {
          const violation: SafetyViolation = {
            type: 'inappropriate',
            reason: 'Inappropriate content detected',
            detectedContent: chunk.text,
            timestamp: new Date()
          };

          if (onViolation) {
            onViolation(violation);
          }

          console.warn('[Content Safety] Inappropriate content detected, stopping stream');
          stopStream();

          // Emit finish events
          controller.enqueue({
            type: 'finish-step',
            finishReason: 'stop',
            logprobs: undefined,
            usage: { completionTokens: 0, promptTokens: 0, totalTokens: 0 },
            request: {},
            response: { id: 'safety-stop', modelId: '', timestamp: new Date() },
            warnings: [],
            isContinued: false,
          });

          controller.enqueue({
            type: 'finish',
            finishReason: 'stop',
            logprobs: undefined,
            usage: { completionTokens: 0, promptTokens: 0, totalTokens: 0 },
            response: { id: 'safety-stop', modelId: '', timestamp: new Date() },
          });

          return;
        }

        // 3. Filter sensitive information
        if (filterSensitive) {
          const { hasSensitive, type } = containsSensitiveInfo(processedText);

          if (hasSensitive) {
            const violation: SafetyViolation = {
              type: 'sensitive',
              reason: `Sensitive information detected: ${type}`,
              detectedContent: chunk.text,
              timestamp: new Date()
            };

            if (onViolation) {
              onViolation(violation);
            }

            console.warn(`[Content Safety] Sensitive info detected (${type}), redacting`);
            processedText = redactSensitiveInfo(processedText);
          }
        }

        // 4. Check for unprofessional language
        if (enforceProfessional && containsUnprofessionalLanguage(textBuffer)) {
          const violation: SafetyViolation = {
            type: 'unprofessional',
            reason: 'Unprofessional language detected',
            detectedContent: chunk.text,
            timestamp: new Date()
          };

          if (onViolation) {
            onViolation(violation);
          }

          console.warn('[Content Safety] Unprofessional language detected');
          // Don't stop stream, but log the violation
        }

        // Enqueue the processed chunk
        controller.enqueue({
          ...chunk,
          text: processedText
        });
      },

      flush() {
        // Clean up
        textBuffer = '';
      }
    });
}

/**
 * Default content safety configuration for sustainability domain
 */
export const defaultSustainabilityContentSafety: ContentSafetyConfig = {
  blockInappropriate: true,
  filterSensitive: true,
  enforceProfessional: true,
  customBlockedTerms: [
    // Add domain-specific blocked terms if needed
  ],
  onViolation: (violation) => {
    // Default logging
    console.warn('[Content Safety Violation]', {
      type: violation.type,
      reason: violation.reason,
      timestamp: violation.timestamp,
      // Don't log actual content for privacy
    });
  }
};
