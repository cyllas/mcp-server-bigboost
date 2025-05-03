import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

// Validação de configuração
const configSchema = z.object({
  accessToken: z.string().min(1, 'AccessToken é obrigatório'),
  tokenId: z.string().min(1, 'TokenId é obrigatório'),
});

// Carregamento de configuração
export const authConfig = configSchema.parse({
  accessToken: process.env.BIGBOOST_ACCESS_TOKEN,
  tokenId: process.env.BIGBOOST_TOKEN_ID,
});
