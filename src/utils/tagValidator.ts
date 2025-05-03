import { tagsSchema, Tags } from '../types/tagTypes';

/**
 * Valida as tags de chamada de acordo com as regras da API Bigboost
 * @param tags Tags a serem validadas
 * @returns Tags validadas ou erro
 */
export function validateTags(tags: Record<string, string>): Tags {
  return tagsSchema.parse(tags);
}
