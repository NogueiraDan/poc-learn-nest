/**
 * Books Module
 *
 * Conceitos NestJS Fundamentais:
 *
 * 1. @Module() - Decorator que define um módulo
 *    - Módulos organizam a aplicação em blocos funcionais
 *    - Cada feature/domínio deve ter seu próprio módulo
 *
 * 2. controllers: [] - Define os controllers deste módulo
 *    - Controllers gerenciam as rotas HTTP
 *    - São automaticamente instanciados pelo NestJS
 *
 * 3. providers: [] - Define os services e outros injetáveis
 *    - Services contêm a lógica de negócio
 *    - São disponibilizados para injeção de dependência
 *
 * 4. exports: [] - Define o que pode ser usado por outros módulos
 *    - Se outro módulo importar BooksModule, terá acesso ao que está em exports
 *    - Por enquanto não exportamos nada (módulo independente)
 *
 * 5. imports: [] - Importa outros módulos necessários
 *    - Por enquanto não precisamos de outros módulos
 *    - Na Fase 2 importaremos PrismaModule
 *
 * Arquitetura Modular:
 * - Cada módulo é independente e reutilizável
 * - Facilita manutenção e testing
 * - Permite lazy loading (carregamento sob demanda)
 */

import { Module } from '@nestjs/common';
import { BooksService } from './books.service';
import { BooksController } from './books.controller';

@Module({
  controllers: [BooksController],
  providers: [BooksService],
  exports: [BooksService], // Exportamos para usar em outros módulos se necessário
})
export class BooksModule {}
