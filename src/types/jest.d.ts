// Declaração de tipos personalizada para o Jest
import 'jest';

declare global {
  namespace jest {
    interface Mock<T = any, Y extends any[] = any[]> {
      (...args: Y): T;
      mockImplementation: (fn: (...args: Y) => T) => Mock<T, Y>;
      mockReturnValue: (value: T) => Mock<T, Y>;
      mockReturnThis: () => Mock<T, Y>;
      mockResolvedValue: <U>(value: U) => Mock<Promise<U>, Y>;
    }
  }
}
