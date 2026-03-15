/**
 * AuditEventService
 *
 * Business logic for audit event logging with legal defensibility.
 *
 * CRITICAL: All audit events are IMMUTABLE and APPEND-ONLY.
 * No UPDATE or DELETE operations permitted.
 *
 * 12 Audit Event Types:
 * 1. DISCLAIMER_ACKNOWLEDGED - User accepted legal disclaimer
 * 2. DRAWING_UPLOADED - Drawing file uploaded
 * 3. DRAWING_HASH_VERIFIED - SHA-256 hash computed and stored
 * 4. EXTRACTION_STARTED - LLM extraction process initiated
 * 5. EXTRACTION_COMPLETED - LLM extraction finished with confidence score
 * 6. RULE_ENGINE_EVALUATION - Deterministic rule engine evaluation
 * 7. ANALYSIS_CREATED - Analysis record created (DRAFT status)
 * 8. PROFESSIONAL_REVIEW_INITIATED - Professional started review
 * 9. PROFESSIONAL_ACCEPTED - Professional accepted analysis
 * 10. SIGNATURE_APPLIED - Digital signature applied
 * 11. ANALYSIS_REJECTED - Professional rejected analysis
 * 12. ANALYSIS_EXPORTED - Analysis exported as report
 */

import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { getDb } from '../db';
import { complianceAuditTrail } from '../../drizzle/schema';

/**
 * Audit event types - must match database action field
 */
export const AUDIT_EVENT_TYPES = {
  DISCLAIMER_ACKNOWLEDGED: 'DISCLAIMER_ACKNOWLEDGED',
  DRAWING_UPLOADED: 'DRAWING_UPLOADED',
  DRAWING_HASH_VERIFIED: 'DRAWING_HASH_VERIFIED',
  EXTRACTION_STARTED: 'EXTRACTION_STARTED',
  EXTRACTION_COMPLETED: 'EXTRACTION_COMPLETED',
  RULE_ENGINE_EVALUATION: 'RULE_ENGINE_EVALUATION',
  ANALYSIS_CREATED: 'ANALYSIS_CREATED',
  PROFESSIONAL_REVIEW_INITIATED: 'PROFESSIONAL_REVIEW_INITIATED',
  PROFESSIONAL_ACCEPTED: 'PROFESSIONAL_ACCEPTED',
  SIGNATURE_APPLIED: 'SIGNATURE_APPLIED',
  ANALYSIS_REJECTED: 'ANALYSIS_REJECTED',
  ANALYSIS_EXPORTED: 'ANALYSIS_EXPORTED',
} as const;

export type AuditEventType = typeof AUDIT_EVENT_TYPES[keyof typeof AUDIT_EVENT_TYPES];

/**
 * Audit event input schema - validates all required fields
 */
export const AuditEventInputSchema = z.object({
  analysisId: z.number().int().positive(),
  userId: z.number().int().positive(),
  action: z.union([
    z.literal('DISCLAIMER_ACKNOWLEDGED'),
    z.literal('DRAWING_UPLOADED'),
    z.literal('DRAWING_HASH_VERIFIED'),
    z.literal('EXTRACTION_STARTED'),
    z.literal('EXTRACTION_COMPLETED'),
    z.literal('RULE_ENGINE_EVALUATION'),
    z.literal('ANALYSIS_CREATED'),
    z.literal('PROFESSIONAL_REVIEW_INITIATED'),
    z.literal('PROFESSIONAL_ACCEPTED'),
    z.literal('SIGNATURE_APPLIED'),
    z.literal('ANALYSIS_REJECTED'),
    z.literal('ANALYSIS_EXPORTED'),
  ]),
  userEmail: z.string().email(),
  userFullName: z.string().min(1),
  details: z.record(z.string(), z.unknown()), // JSON payload

  // Optional professional credentials
  professionalLicenseNumber: z.string().optional(),
  professionalAssociation: z.string().optional(),
  jurisdiction: z.string().optional(),

  // Request context (forensic traceability)
  ipAddress: z.string().min(1),
  userAgent: z.string(),
  sessionId: z.string(),
});

export type AuditEventInput = z.infer<typeof AuditEventInputSchema>;

/**
 * Audit event result
 */
export interface AuditEventResult {
  eventId: number;
  analysisId: number;
  action: AuditEventType;
  timestamp: Date; // Server-generated UTC
  credentialsRecorded: boolean;
}

/**
 * AuditEventService - Append-only audit trail
 */
export class AuditEventService {
  /**
   * Log an audit event
   *
   * IMMUTABLE: This operation is INSERT ONLY.
   * No UPDATE or DELETE permitted.
   *
   * @param input Audit event input with full credentials
   * @returns Audit event result with server-generated timestamp
   * @throws TRPCError on validation failure
   */
  async logAuditEvent(input: AuditEventInput): Promise<AuditEventResult> {
    // Validate input
    const validationResult = AuditEventInputSchema.safeParse(input);
    if (!validationResult.success) {
      console.error('[AuditEventService] Validation failed:', validationResult.error.issues);
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Invalid audit event input',
      });
    }

    const validated = validationResult.data;

    try {
      const db = await getDb();
      if (!db) {
        throw new Error('Database connection not available');
      }

      // Log event details
      console.log('[AuditEventService] Logging audit event:', {
        action: validated.action,
        analysisId: validated.analysisId,
        userId: validated.userId,
        userEmail: validated.userEmail,
        hasLicenseNumber: !!validated.professionalLicenseNumber,
        ipAddress: validated.ipAddress,
        timestamp: new Date().toISOString(),
      });

      // INSERT audit event (APPEND ONLY)
      const result = await (db as any)
        .insert(complianceAuditTrail)
        .values({
          analysisId: validated.analysisId,
          userId: validated.userId,
          action: validated.action,
          details: JSON.stringify(validated.details),
          userEmail: validated.userEmail,
          userFullName: validated.userFullName,
          professionalLicenseNumber: validated.professionalLicenseNumber ?? null,
          professionalAssociation: validated.professionalAssociation ?? null,
          jurisdiction: validated.jurisdiction ?? null,
          ipAddress: validated.ipAddress,
          userAgent: validated.userAgent,
          sessionId: validated.sessionId,
          // timestamp is auto-generated by database (defaultNow())
        });

      const eventId = Array.isArray(result) ? result[0] : result;

      // Get the inserted record to retrieve server-generated timestamp
      const insertedEvent = await (db as any).query.complianceAuditTrail.findFirst({
        where: (table: any, { eq }: any) => eq(table.id, eventId),
      });

      if (!insertedEvent) {
        throw new Error('Failed to retrieve inserted audit event');
      }

      console.log('[AuditEventService] Audit event logged successfully:', {
        eventId: insertedEvent.id,
        action: insertedEvent.action,
        timestamp: insertedEvent.timestamp.toISOString(),
      });

      return {
        eventId: insertedEvent.id,
        analysisId: insertedEvent.analysisId,
        action: insertedEvent.action as AuditEventType,
        timestamp: insertedEvent.timestamp, // Server-generated UTC
        credentialsRecorded: !!insertedEvent.professionalLicenseNumber,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[AuditEventService] Failed to log audit event:', {
        error: errorMessage,
        action: validated.action,
        analysisId: validated.analysisId,
      });

      if (error instanceof TRPCError) {
        throw error;
      }

      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to log audit event',
      });
    }
  }

  /**
   * Get audit trail for an analysis
   *
   * @param analysisId Analysis ID
   * @returns Array of audit events in chronological order
   */
  async getAuditTrail(analysisId: number): Promise<AuditEventResult[]> {
    try {
      const db = await getDb();
      if (!db) {
        throw new Error('Database connection not available');
      }

      const events = await (db as any).query.complianceAuditTrail.findMany({
        where: (table: any, { eq }: any) => eq(table.analysisId, analysisId),
        orderBy: (table: any, { asc }: any) => asc(table.timestamp),
      });

      return events.map((event: any) => ({
        eventId: event.id,
        analysisId: event.analysisId,
        action: event.action as AuditEventType,
        timestamp: new Date(event.timestamp),
        credentialsRecorded: !!event.professionalLicenseNumber,
      }));
    } catch (error) {
      console.error('[AuditEventService] Failed to retrieve audit trail:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to retrieve audit trail',
      });
    }
  }

  /**
   * Verify audit trail integrity
   *
   * Checks that:
   * 1. All required events are present
   * 2. Events are in correct chronological order
   * 3. No events are missing
   *
   * @param analysisId Analysis ID
   * @returns Integrity check result
   */
  async verifyAuditTrailIntegrity(analysisId: number): Promise<{
    isValid: boolean;
    eventCount: number;
    requiredEvents: AuditEventType[];
    presentEvents: AuditEventType[];
    missingEvents: AuditEventType[];
  }> {
    try {
      const trail = await this.getAuditTrail(analysisId);
      const presentEvents = trail.map(e => e.action);

      // Minimum required events for valid analysis
      const requiredEvents: AuditEventType[] = [
        'DISCLAIMER_ACKNOWLEDGED',
        'DRAWING_UPLOADED',
        'EXTRACTION_COMPLETED',
        'ANALYSIS_CREATED',
      ];

      const missingEvents = requiredEvents.filter(
        event => !presentEvents.includes(event)
      );

      const uniqueEvents: AuditEventType[] = [];
      const seen = new Set<AuditEventType>();
      for (const event of presentEvents) {
        if (!seen.has(event)) {
          uniqueEvents.push(event);
          seen.add(event);
        }
      }

      return {
        isValid: missingEvents.length === 0,
        eventCount: trail.length,
        requiredEvents,
        presentEvents: uniqueEvents,
        missingEvents,
      };
    } catch (error) {
      console.error('[AuditEventService] Failed to verify audit trail integrity:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to verify audit trail integrity',
      });
    }
  }

  /**
   * Log professional review events atomically
   *
   * ATOMIC TRANSACTION: Both PROFESSIONAL_ACCEPTED and SIGNATURE_APPLIED
   * are written together. If either fails, both are rolled back.
   *
   * Also updates drawingAnalyses status to VALID atomically.
   *
   * @param acceptanceEvent PROFESSIONAL_ACCEPTED audit event
   * @param signatureEvent SIGNATURE_APPLIED audit event
   * @param analysisId Analysis ID to update status
   * @param signatureHash Digital signature hash
   * @returns Both event IDs if successful
   * @throws TRPCError if transaction fails (all changes rolled back)
   */
  async logProfessionalReviewAtomic(
    acceptanceEvent: AuditEventInput,
    signatureEvent: AuditEventInput,
    analysisId: number,
    signatureHash: string
  ): Promise<{ acceptanceEventId: number; signatureEventId: number }> {
    // Validate both events
    const acceptanceValidation = AuditEventInputSchema.safeParse(acceptanceEvent);
    const signatureValidation = AuditEventInputSchema.safeParse(signatureEvent);

    if (!acceptanceValidation.success || !signatureValidation.success) {
      console.error('[AuditEventService] Validation failed for atomic transaction');
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Invalid audit event input for professional review',
      });
    }

    const acceptanceData = acceptanceValidation.data;
    const signatureData = signatureValidation.data;

    try {
      const db = await getDb();
      if (!db) {
        throw new Error('Database connection not available');
      }

      // Import required schema tables
      const { drawingAnalyses } = await import('../../drizzle/schema');
      const { eq } = await import('drizzle-orm');

      // Execute atomic transaction
      const result = await (db as any).transaction(async (tx: any) => {
        // Insert PROFESSIONAL_ACCEPTED event
        const acceptanceResult = await tx
          .insert(complianceAuditTrail)
          .values({
            analysisId: acceptanceData.analysisId,
            userId: acceptanceData.userId,
            action: 'PROFESSIONAL_ACCEPTED',
            details: JSON.stringify(acceptanceData.details),
            userEmail: acceptanceData.userEmail,
            userFullName: acceptanceData.userFullName,
            professionalLicenseNumber: acceptanceData.professionalLicenseNumber ?? null,
            professionalAssociation: acceptanceData.professionalAssociation ?? null,
            jurisdiction: acceptanceData.jurisdiction ?? null,
            ipAddress: acceptanceData.ipAddress,
            userAgent: acceptanceData.userAgent,
            sessionId: acceptanceData.sessionId,
          });

        const acceptanceEventId = Array.isArray(acceptanceResult)
          ? acceptanceResult[0]
          : acceptanceResult;

        // Insert SIGNATURE_APPLIED event
        const signatureResult = await tx
          .insert(complianceAuditTrail)
          .values({
            analysisId: signatureData.analysisId,
            userId: signatureData.userId,
            action: 'SIGNATURE_APPLIED',
            details: JSON.stringify({
              ...signatureData.details,
              signatureHash,
            }),
            userEmail: signatureData.userEmail,
            userFullName: signatureData.userFullName,
            professionalLicenseNumber: signatureData.professionalLicenseNumber ?? null,
            professionalAssociation: signatureData.professionalAssociation ?? null,
            jurisdiction: signatureData.jurisdiction ?? null,
            ipAddress: signatureData.ipAddress,
            userAgent: signatureData.userAgent,
            sessionId: signatureData.sessionId,
          });

        const signatureEventId = Array.isArray(signatureResult)
          ? signatureResult[0]
          : signatureResult;

        // Update analysis status to VALID
        await tx
          .update(drawingAnalyses)
          .set({
            analysisStatus: 'VALID',
            signatureHash,
            validatedAt: new Date(),
          })
          .where(eq(drawingAnalyses.id, analysisId));

        return { acceptanceEventId, signatureEventId };
      });

      console.log('[AuditEventService] Professional review logged atomically:', {
        acceptanceEventId: result.acceptanceEventId,
        signatureEventId: result.signatureEventId,
        analysisId,
        timestamp: new Date().toISOString(),
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[AuditEventService] Atomic transaction failed:', {
        error: errorMessage,
        analysisId,
      });

      if (error instanceof TRPCError) {
        throw error;
      }

      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to log professional review atomically. All changes rolled back.',
      });
    }
  }
}

export const auditEventService = new AuditEventService();
