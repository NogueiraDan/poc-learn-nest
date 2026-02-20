/**
 * DTO - Data Transfer Object para criação de livros
 *
 * Conceitos NestJS:
 * - DTOs definem a estrutura dos dados que chegam nas requisições
 * - Separar DTOs de entidades é uma boa prática (separação de responsabilidades)
 * - DTOs ajudam no type-safety e documentação automática (Swagger)
 *
 * Fase 3 - Validações:
 * - @IsString(): Valida que o campo é uma string
 * - @IsNotEmpty(): Valida que o campo não está vazio
 * - @MinLength() / @MaxLength(): Valida tamanho mínimo/máximo
 * - @IsISBN(): Valida formato ISBN correto
 * - @IsInt(): Valida que é um número inteiro
 * - @Min(): Valida valor mínimo
 * - @IsOptional(): Campo opcional (pode ser undefined)
 */

import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsISBN,
  IsInt,
  Min,
  Max,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBookDto {
  @ApiProperty({
    description: 'Título do livro',
    example: 'Clean Code',
    minLength: 3,
    maxLength: 255,
  })
  @IsString({ message: 'O título deve ser uma string' })
  @IsNotEmpty({ message: 'O título é obrigatório' })
  @MinLength(3, { message: 'O título deve ter no mínimo 3 caracteres' })
  @MaxLength(255, { message: 'O título deve ter no máximo 255 caracteres' })
  title: string;

  @ApiProperty({
    description: 'ISBN do livro',
    example: '978-0132350884',
  })
  @IsString({ message: 'O ISBN deve ser uma string' })
  @IsNotEmpty({ message: 'O ISBN é obrigatório' })
  @IsISBN(undefined, { message: 'O ISBN deve estar em um formato válido' })
  isbn: string;

  @ApiPropertyOptional({
    description: 'Descrição do livro',
    example: 'Um guia prático para escrever código limpo e manutenível',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString({ message: 'A descrição deve ser uma string' })
  @MaxLength(1000, {
    message: 'A descrição deve ter no máximo 1000 caracteres',
  })
  description?: string;

  @ApiProperty({
    description: 'Total de cópias disponíveis',
    example: 5,
    minimum: 1,
    maximum: 1000,
  })
  @IsInt({ message: 'O total de cópias deve ser um número inteiro' })
  @Min(1, { message: 'O total de cópias deve ser no mínimo 1' })
  @Max(1000, { message: 'O total de cópias não pode exceder 1000' })
  totalCopies: number;

  @ApiProperty({
    description: 'Ano de publicação do livro',
    example: 2008,
    minimum: 1000,
    maximum: new Date().getFullYear() + 1,
  })
  @IsInt({ message: 'O ano de publicação deve ser um número inteiro' })
  @Min(1000, { message: 'O ano de publicação deve ser no mínimo 1000' })
  @Max(new Date().getFullYear() + 1, {
    message: 'O ano de publicação não pode ser maior que o próximo ano',
  })
  publicationYear: number;

  @ApiProperty({
    description: 'ID da categoria do livro',
    example: 1,
    minimum: 1,
  })
  @IsInt({ message: 'O ID da categoria deve ser um número inteiro' })
  @Min(1, { message: 'O ID da categoria deve ser no mínimo 1' })
  categoryId: number;
}
