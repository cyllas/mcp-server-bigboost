import { z } from 'zod';

/**
 * Esquema de validação para tags de chamada
 * Regras:
 * 1. Máximo de 10 tags por requisição
 * 2. Chaves e valores devem ter entre 1 e 255 caracteres
 * 3. Chaves devem conter apenas letras A-Z (sem acentuação) ou _ (underline)
 * 4. Valores podem conter letras, números, espaços ou caracteres especiais: _*-+,.:!@#&/
 */
export const tagKeySchema = z
  .string()
  .min(1, 'A chave da tag deve ter pelo menos 1 caractere')
  .max(255, 'A chave da tag deve ter no máximo 255 caracteres')
  .regex(/^[A-Za-z_]+$/, 'A chave da tag deve conter apenas letras A-Z ou _ (underline)');

export const tagValueSchema = z
  .string()
  .min(1, 'O valor da tag deve ter pelo menos 1 caractere')
  .max(255, 'O valor da tag deve ter no máximo 255 caracteres')
  .regex(
    /^[A-Za-z0-9\s_*\-+,.:!@#&/]+$/,
    'O valor da tag deve conter apenas letras, números, espaços ou caracteres especiais permitidos'
  );

export const tagsSchema = z
  .record(tagKeySchema, tagValueSchema)
  .refine((tags) => Object.keys(tags).length <= 10, {
    message: 'Máximo de 10 tags por requisição'
  });

export type Tags = z.infer<typeof tagsSchema>;
