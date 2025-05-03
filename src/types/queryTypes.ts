import { z } from 'zod';

/**
 * Esquema base para consultas na API Bigboost
 */
export const baseQuerySchema = z.object({
  q: z.string().min(1, 'Query é obrigatória'),
  Datasets: z.string().min(1, 'Datasets é obrigatório'),
  Limit: z.string().optional(), // Limite de resultados
  dateformat: z.string().optional() // Formato de data
});

/**
 * Tipo para consultas base
 */
export type BaseQuery = z.infer<typeof baseQuerySchema>;

/**
 * Esquema para validação de tags
 */
export const queryWithTagsSchema = baseQuerySchema.extend({
  Tags: z.record(z.string(), z.string()).optional()
});

/**
 * Tipo para consultas com tags
 */
export type QueryWithTags = z.infer<typeof queryWithTagsSchema>;
