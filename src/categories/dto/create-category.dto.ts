/**
 * DTO para criação de Category
 *
 * Fase 3 - Validações:
 * - @IsString(): Valida que o campo é uma string
 * - @IsNotEmpty(): Valida que o campo não está vazio
 * - @MinLength(): Valida tamanho mínimo
 * - @MaxLength(): Valida tamanho máximo
 * - @IsOptional(): Campo opcional
 */

import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsOptional,
} from 'class-validator';

export class CreateCategoryDto {
  @IsString({ message: 'O nome deve ser uma string' })
  @IsNotEmpty({ message: 'O nome é obrigatório' })
  @MinLength(3, { message: 'O nome deve ter no mínimo 3 caracteres' })
  @MaxLength(100, { message: 'O nome deve ter no máximo 100 caracteres' })
  name: string;

  @IsOptional()
  @IsString({ message: 'A descrição deve ser uma string' })
  @MaxLength(500, {
    message: 'A descrição deve ter no máximo 500 caracteres',
  })
  description?: string;
}
