/**
 * Entidade Book (In-Memory)
 *
 * Conceitos NestJS:
 * - Esta é uma classe simples que representa nossa entidade de negócio
 * - Por enquanto é apenas um modelo de dados (POJO - Plain Old JavaScript Object)
 * - Na Fase 2 isso será substituído por uma entidade Prisma
 */

export class Book {
  id: number;
  title: string;
  isbn: string;
  description: string;
  availableCopies: number;
  totalCopies: number;
  publicationYear: number;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<Book>) {
    Object.assign(this, partial);
  }
}
