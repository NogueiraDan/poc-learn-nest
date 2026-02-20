/**
 * DTO para criação de Author
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

export class CreateAuthorDto {
  @IsString({ message: 'O nome deve ser uma string' })
  @IsNotEmpty({ message: 'O nome é obrigatório' })
  @MinLength(3, { message: 'O nome deve ter no mínimo 3 caracteres' })
  @MaxLength(200, { message: 'O nome deve ter no máximo 200 caracteres' })
  name: string;

  @IsOptional()
  @IsString({ message: 'A biografia deve ser uma string' })
  @MaxLength(2000, {
    message: 'A biografia deve ter no máximo 2000 caracteres',
  })
  biography?: string;
}
