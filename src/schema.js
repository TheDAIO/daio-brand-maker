import { z } from 'zod';

export const LogoRequestSchema = z
  .object({
    requestId: z.string().min(6).max(200).optional(),
    brand: z.string().min(1).max(120),
    industry: z.string().min(1).max(120).optional(),
    vibe: z.array(z.string().min(1).max(40)).max(12).optional(),
    colors: z.array(z.string().min(1).max(40)).max(8).optional(),
    iconIdeas: z.array(z.string().min(1).max(40)).max(10).optional(),
    avoid: z.array(z.string().min(1).max(60)).max(12).optional()
  })
  .strict();
