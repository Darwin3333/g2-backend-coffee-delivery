import {
  IsNotEmpty,
  IsString,
  IsNumber,
  Min,
  IsUrl,
  IsArray,
  ArrayNotEmpty,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCoffeeDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsString()
  @MinLength(10)
  @MaxLength(200)
  description: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Type(() => Number)
  price: number;

  @IsUrl()
  imageUrl: string;

  @IsArray()
  @ArrayNotEmpty()
  tagIds: string[];
}
