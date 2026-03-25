/**
 * AI Chat Router
 * Provides a conversational interface for building code compliance questions.
 * Powered by Claude claude-3-5-sonnet-20241022.
 */

import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import { TRPCError } from '@trpc/server';
import Anthropic from '@anthropic-ai/sdk';
import { logger } from '../logger';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || '' });

const AI_SYSTEM_PROMPT = `You are a helpful building code compliance assistant specializing in the National Building Code of Canada (NBC 2025) and provincial building codes.

Help users understand:
- Occupancy classifications (Group A–F)
- Fire resistance rating requirements
- Egress and exit requirements
- Accessibility (barrier-free design)
- Plumbing fixture counts
- Building height and area limits
- Compliance pathways and code interpretations

Guidelines:
- Be precise and cite specific code sections (e.g., "NBC 3.3.1.7") where applicable.
- Clarify when a question requires a licensed professional to review.
- Do not make up code references — if you are unsure, say so.
- Keep responses clear and actionable.`;

export const aiRouter = router({
  /**
   * Send a message to the AI assistant.
   * Supports multi-turn conversations via conversationHistory.
   */
  chat: protectedProcedure
    .input(
      z.object({
        message: z.string().min(1).max(2000),
        conversationHistory: z
          .array(
            z.object({
              role: z.enum(['user', 'assistant']),
              content: z.string(),
            })
          )
          .optional()
          .default([]),
      })
    )
    .mutation(async ({ input }) => {
      if (!process.env.ANTHROPIC_API_KEY) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'AI chat is not configured. Please set the ANTHROPIC_API_KEY environment variable.',
        });
      }

      try {
        logger.info('🔵 [AI Chat] Processing message');

        const messages = [
          ...input.conversationHistory.map((m) => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          })),
          { role: 'user' as const, content: input.message },
        ];

        const response = await client.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1024,
          system: AI_SYSTEM_PROMPT,
          messages,
        });

        const text = response.content
          .filter((b) => b.type === 'text')
          .map((b) => (b as { type: 'text'; text: string }).text)
          .join('\n');

        logger.info('🟢 [AI Chat] Response sent', {
          inputTokens: response.usage?.input_tokens,
          outputTokens: response.usage?.output_tokens,
        });

        return { success: true, message: text };
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        logger.error('🔴 [AI Chat] Failed', { error: msg });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `AI chat failed: ${msg}`,
        });
      }
    }),
});
