/**
 * Disclaimer Constants
 *
 * Single source of truth for disclaimer versioning and validation.
 * Per Prime Directive 2.0: All disclaimer versions must be validated against this constant.
 */

/**
 * Current disclaimer version
 * Increment when disclaimer text or legal terms change
 * Format: MAJOR.MINOR (e.g., 1.0, 1.1, 2.0)
 */
export const CURRENT_DISCLAIMER_VERSION = '1.0';

/**
 * Supported disclaimer versions
 * Used for backward compatibility and validation
 */
export const SUPPORTED_DISCLAIMER_VERSIONS = ['1.0'] as const;

/**
 * Disclaimer text (for reference and audit trail)
 */
export const DISCLAIMER_TEXT = `
REQUIRED LEGAL ACKNOWLEDGMENT

NOT A PROFESSIONAL ENGINEER SERVICE

This tool is NOT a substitute for professional engineering review, consultation, or licensed professional services. All analyses are informational only. You are solely responsible for:

• Conducting independent verification of all outputs
• Exercising professional judgment and responsibility
• Obtaining professional engineering review
• Compliance with professional standards and codes of ethics
• Taking full responsibility for any professional opinions

BUILDING CODES VARY BY JURISDICTION

Building codes and regulations vary significantly by jurisdiction. This tool may not reflect all local requirements or recent code updates.

I understand that this tool is NOT a substitute for professional engineering review and that professional judgment and responsibility are required.

I accept all terms, conditions, disclaimers, and limitations of liability outlined above and acknowledge the risks of using this tool.
`;

/**
 * Validate disclaimer version
 * @param version Version string to validate
 * @returns true if version is supported, false otherwise
 */
export function isValidDisclaimerVersion(version: string): boolean {
  return SUPPORTED_DISCLAIMER_VERSIONS.includes(version as any);
}

/**
 * Get disclaimer version for audit trail
 * @returns Current disclaimer version
 */
export function getDisclaimerVersion(): string {
  return CURRENT_DISCLAIMER_VERSION;
}
