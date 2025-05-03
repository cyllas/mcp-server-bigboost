import { z } from 'zod';
import { validateTags } from '../../utils/tagValidator';

describe('Validação de Entrada', () => {
  describe('Validação de CPF', () => {
    const cpfSchema = z.string()
      .min(11, 'CPF deve ter pelo menos 11 dígitos')
      .max(14, 'CPF não deve ter mais de 14 caracteres')
      .refine(
        (cpf) => /^\d{3}(\.?\d{3}){2}(\.?|-?)\d{2}$/.test(cpf),
        { message: 'Formato de CPF inválido' }
      );

    it('deve aceitar CPF válido com formatação', () => {
      const cpf = '123.456.789-00';
      const result = cpfSchema.safeParse(cpf);
      expect(result.success).toBe(true);
    });

    it('deve aceitar CPF válido sem formatação', () => {
      const cpf = '12345678900';
      const result = cpfSchema.safeParse(cpf);
      expect(result.success).toBe(true);
    });

    it('deve rejeitar CPF muito curto', () => {
      const cpf = '1234567890';
      const result = cpfSchema.safeParse(cpf);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('CPF deve ter pelo menos 11 dígitos');
      }
    });

    it('deve rejeitar CPF com formato inválido', () => {
      const cpf = '123-456-789.00';
      const result = cpfSchema.safeParse(cpf);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Formato de CPF inválido');
      }
    });
  });

  describe('Validação de CNPJ', () => {
    const cnpjSchema = z.string()
      .min(14, 'CNPJ deve ter pelo menos 14 dígitos')
      .max(18, 'CNPJ não deve ter mais de 18 caracteres')
      .refine(
        (cnpj) => /^\d{2}(\.?\d{3}){2}(\/?)\d{4}(-?)\d{2}$/.test(cnpj),
        { message: 'Formato de CNPJ inválido' }
      );

    it('deve aceitar CNPJ válido com formatação', () => {
      const cnpj = '12.345.678/0001-90';
      const result = cnpjSchema.safeParse(cnpj);
      expect(result.success).toBe(true);
    });

    it('deve aceitar CNPJ válido sem formatação', () => {
      const cnpj = '12345678000190';
      const result = cnpjSchema.safeParse(cnpj);
      expect(result.success).toBe(true);
    });

    it('deve rejeitar CNPJ muito curto', () => {
      const cnpj = '1234567890012';
      const result = cnpjSchema.safeParse(cnpj);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('CNPJ deve ter pelo menos 14 dígitos');
      }
    });

    it('deve rejeitar CNPJ com formato inválido', () => {
      const cnpj = '123-456-78/0001.90';
      const result = cnpjSchema.safeParse(cnpj);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Formato de CNPJ inválido');
      }
    });
  });

  describe('Validação de Email', () => {
    const emailSchema = z.string()
      .min(5, 'Email deve ter pelo menos 5 caracteres')
      .max(254, 'Email não deve ter mais de 254 caracteres')
      .email('Formato de email inválido');

    it('deve aceitar email válido', () => {
      const email = 'usuario@exemplo.com.br';
      const result = emailSchema.safeParse(email);
      expect(result.success).toBe(true);
    });

    it('deve rejeitar email com formato inválido', () => {
      const email = 'usuario@exemplo';
      const result = emailSchema.safeParse(email);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Formato de email inválido');
      }
    });

    it('deve rejeitar email muito curto', () => {
      const email = 'a@b';
      const result = emailSchema.safeParse(email);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Email deve ter pelo menos 5 caracteres');
      }
    });

    it('deve rejeitar email muito longo', () => {
      // Cria um email com mais de 254 caracteres
      const longLocalPart = 'a'.repeat(245);
      const email = `${longLocalPart}@exemplo.com`;
      const result = emailSchema.safeParse(email);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Email não deve ter mais de 254 caracteres');
      }
    });
  });

  describe('Validação de Telefone', () => {
    const telefoneSchema = z.string()
      .min(8, 'Telefone deve ter pelo menos 8 dígitos')
      .max(20, 'Telefone não deve ter mais de 20 caracteres')
      .refine(
        (telefone) => /^(\+\d{1,3})?[\s.-]?\(?\d{1,3}\)?[\s.-]?\d{3,5}[\s.-]?\d{4}$/.test(telefone),
        { message: 'Formato de telefone inválido' }
      );

    it('deve aceitar telefone válido com formatação internacional', () => {
      const telefone = '+55 (11) 98765-4321';
      const result = telefoneSchema.safeParse(telefone);
      expect(result.success).toBe(true);
    });

    it('deve aceitar telefone válido com formatação nacional', () => {
      const telefone = '(11) 98765-4321';
      const result = telefoneSchema.safeParse(telefone);
      expect(result.success).toBe(true);
    });

    it('deve aceitar telefone válido sem formatação', () => {
      const telefone = '11987654321';
      const result = telefoneSchema.safeParse(telefone);
      expect(result.success).toBe(true);
    });

    it('deve rejeitar telefone muito curto', () => {
      const telefone = '1234567';
      const result = telefoneSchema.safeParse(telefone);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Telefone deve ter pelo menos 8 dígitos');
      }
    });
  });

  describe('Validação de Tags', () => {
    it('deve aceitar tags válidas', () => {
      const tags = {
        origem: 'teste',
        usuario: 'admin',
        sistema: 'mcp'
      };

      expect(() => validateTags(tags)).not.toThrow();
      expect(validateTags(tags)).toEqual(tags);
    });

    it('deve rejeitar tags com mais de 10 itens', () => {
      const tags = {
        tag1: 'valor1',
        tag2: 'valor2',
        tag3: 'valor3',
        tag4: 'valor4',
        tag5: 'valor5',
        tag6: 'valor6',
        tag7: 'valor7',
        tag8: 'valor8',
        tag9: 'valor9',
        tag10: 'valor10',
        tag11: 'valor11'
      };

      expect(() => validateTags(tags)).toThrow('Máximo de 10 tags por requisição');
    });

    it('deve rejeitar tags com chaves inválidas', () => {
      const tags = {
        'chave-inválida': 'valor'
      };

      expect(() => validateTags(tags)).toThrow('A chave da tag deve conter apenas letras A-Z ou _ (underline)');
    });

    it('deve rejeitar tags com valores muito longos', () => {
      const tags = {
        chave: 'a'.repeat(256)
      };

      expect(() => validateTags(tags)).toThrow('O valor da tag deve ter no máximo 255 caracteres');
    });
  });
});
