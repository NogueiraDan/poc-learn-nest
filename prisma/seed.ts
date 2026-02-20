/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/**
 * Prisma Seed Script
 *
 * Popula o banco de dados com dados iniciais para desenvolvimento
 *
 * Como executar:
 * npx prisma db seed
 *
 * Este script será executado automaticamente após:
 * - prisma migrate dev
 * - prisma migrate reset
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Limpar dados existentes (ordem importa por causa das foreign keys)
  console.log('🗑️  Limpando dados existentes...');
  await prisma.fine.deleteMany();
  await prisma.loan.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.bookAuthor.deleteMany();
  await prisma.book.deleteMany();
  await prisma.author.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  // ========================================
  // 1. Criar Categorias
  // ========================================
  console.log('📚 Criando categorias...');
  const categoryProgramming = await prisma.category.create({
    data: {
      name: 'Programação',
      description: 'Livros sobre desenvolvimento de software e programação',
    },
  });

  const categoryArchitecture = await prisma.category.create({
    data: {
      name: 'Arquitetura de Software',
      description: 'Livros sobre design e arquitetura de sistemas',
    },
  });

  const categoryDevOps = await prisma.category.create({
    data: {
      name: 'DevOps',
      description: 'Livros sobre DevOps, CI/CD e infraestrutura',
    },
  });

  const categoryDatabase = await prisma.category.create({
    data: {
      name: 'Banco de Dados',
      description: 'Livros sobre bancos de dados relacionais e NoSQL',
    },
  });

  const categoryAI = await prisma.category.create({
    data: {
      name: 'Inteligência Artificial',
      description: 'Livros sobre IA, Machine Learning e Deep Learning',
    },
  });

  console.log(`✅ ${5} categorias criadas`);

  // ========================================
  // 2. Criar Autores
  // ========================================
  console.log('✍️  Criando autores...');
  const authorRobertMartin = await prisma.author.create({
    data: {
      name: 'Robert C. Martin',
      biography:
        'Conhecido como Uncle Bob, é um dos pioneiros do movimento Agile e autor de vários livros influentes sobre desenvolvimento de software.',
    },
  });

  const authorMartinFowler = await prisma.author.create({
    data: {
      name: 'Martin Fowler',
      biography:
        'Autor, palestrante e consultor de software. Chief Scientist na ThoughtWorks e conhecido por seus trabalhos em refatoração e arquitetura de software.',
    },
  });

  const authorEricEvans = await prisma.author.create({
    data: {
      name: 'Eric Evans',
      biography:
        'Criador do Domain-Driven Design (DDD), uma abordagem para desenvolvimento de software complexo.',
    },
  });

  const authorGangOfFour = await prisma.author.create({
    data: {
      name: 'Gang of Four',
      biography:
        'Erich Gamma, Richard Helm, Ralph Johnson e John Vlissides, autores do clássico Design Patterns.',
    },
  });

  const authorAndrewHunt = await prisma.author.create({
    data: {
      name: 'Andrew Hunt',
      biography:
        'Co-autor de The Pragmatic Programmer e um dos autores do Manifesto Ágil.',
    },
  });

  const authorDavidThomas = await prisma.author.create({
    data: {
      name: 'David Thomas',
      biography: 'Co-autor de The Pragmatic Programmer.',
    },
  });

  console.log(`✅ ${6} autores criados`);

  // ========================================
  // 3. Criar Livros
  // ========================================
  console.log('📖 Criando livros...');

  const bookCleanCode = await prisma.book.create({
    data: {
      title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
      isbn: '978-0132350884',
      description:
        'Um guia essencial para escrever código limpo, legível e manutenível. Uncle Bob apresenta princípios e práticas que todo desenvolvedor deveria conhecer.',
      publicationYear: 2008,
      totalCopies: 5,
      availableCopies: 5,
      categoryId: categoryProgramming.id,
    },
  });

  const bookDesignPatterns = await prisma.book.create({
    data: {
      title: 'Design Patterns: Elements of Reusable Object-Oriented Software',
      isbn: '978-0201633610',
      description:
        'O livro clássico que documenta 23 padrões de design fundamentais para desenvolvimento orientado a objetos.',
      publicationYear: 1994,
      totalCopies: 3,
      availableCopies: 3,
      categoryId: categoryArchitecture.id,
    },
  });

  const bookPragmaticProgrammer = await prisma.book.create({
    data: {
      title: 'The Pragmatic Programmer: Your Journey to Mastery',
      isbn: '978-0135957059',
      description:
        'Um guia prático para se tornar um desenvolvedor melhor, com dicas e técnicas atemporais.',
      publicationYear: 2019,
      totalCopies: 4,
      availableCopies: 4,
      categoryId: categoryProgramming.id,
    },
  });

  const bookDDD = await prisma.book.create({
    data: {
      title:
        'Domain-Driven Design: Tackling Complexity in the Heart of Software',
      isbn: '978-0321125217',
      description:
        'Introduz o conceito de Domain-Driven Design, uma abordagem para lidar com a complexidade no desenvolvimento de software.',
      publicationYear: 2003,
      totalCopies: 2,
      availableCopies: 2,
      categoryId: categoryArchitecture.id,
    },
  });

  const bookRefactoring = await prisma.book.create({
    data: {
      title: 'Refactoring: Improving the Design of Existing Code',
      isbn: '978-0134757599',
      description:
        'Um catálogo de refatorações para melhorar o design de código existente sem alterar seu comportamento externo.',
      publicationYear: 2018,
      totalCopies: 3,
      availableCopies: 3,
      categoryId: categoryProgramming.id,
    },
  });

  const bookCleanArchitecture = await prisma.book.create({
    data: {
      title: "Clean Architecture: A Craftsman's Guide to Software Structure",
      isbn: '978-0134494166',
      description:
        'Uncle Bob apresenta princípios universais de arquitetura de software que transcendem frameworks e tecnologias.',
      publicationYear: 2017,
      totalCopies: 4,
      availableCopies: 4,
      categoryId: categoryArchitecture.id,
    },
  });

  console.log(`✅ ${6} livros criados`);

  // ========================================
  // 4. Relacionar Livros com Autores (N:N)
  // ========================================
  console.log('🔗 Criando relacionamentos livros-autores...');

  await prisma.bookAuthor.createMany({
    data: [
      { bookId: bookCleanCode.id, authorId: authorRobertMartin.id },
      { bookId: bookDesignPatterns.id, authorId: authorGangOfFour.id },
      {
        bookId: bookPragmaticProgrammer.id,
        authorId: authorAndrewHunt.id,
      },
      {
        bookId: bookPragmaticProgrammer.id,
        authorId: authorDavidThomas.id,
      },
      { bookId: bookDDD.id, authorId: authorEricEvans.id },
      { bookId: bookRefactoring.id, authorId: authorMartinFowler.id },
      {
        bookId: bookCleanArchitecture.id,
        authorId: authorRobertMartin.id,
      },
    ],
  });

  console.log(`✅ Relacionamentos criados`);

  // ========================================
  // 5. Criar Usuários
  // ========================================
  console.log('👥 Criando usuários...');

  // Nota: Na Fase 4 vamos adicionar hash de senha com bcrypt
  // Por enquanto, usando senha em texto plano (apenas para desenvolvimento!)
  const userAdmin = await prisma.user.create({
    data: {
      email: 'admin@library.com',
      password: 'admin123', // 🚨 SERÁ HASHADO NA FASE 4
      name: 'Administrador',
      role: 'ADMIN',
    },
  });

  const userLibrarian = await prisma.user.create({
    data: {
      email: 'librarian@library.com',
      password: 'librarian123', // 🚨 SERÁ HASHADO NA FASE 4
      name: 'Bibliotecário',
      role: 'LIBRARIAN',
    },
  });

  const userMember1 = await prisma.user.create({
    data: {
      email: 'joao@example.com',
      password: 'joao123', // 🚨 SERÁ HASHADO NA FASE 4
      name: 'João Silva',
      role: 'MEMBER',
    },
  });

  const userMember2 = await prisma.user.create({
    data: {
      email: 'maria@example.com',
      password: 'maria123', // 🚨 SERÁ HASHADO NA FASE 4
      name: 'Maria Santos',
      role: 'MEMBER',
    },
  });

  console.log(`✅ ${4} usuários criados`);

  // ========================================
  // Resumo
  // ========================================
  console.log('\n🎉 Seed concluído com sucesso!\n');
  console.log('📊 Resumo:');
  console.log(`   - ${5} categorias`);
  console.log(`   - ${6} autores`);
  console.log(`   - ${6} livros`);
  console.log(`   - ${4} usuários`);
  console.log(`   - ${7} relacionamentos livros-autores`);
  console.log('\n✨ Banco de dados pronto para uso!\n');
}

main()
  .catch((e) => {
    console.error('❌ Erro ao executar seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
