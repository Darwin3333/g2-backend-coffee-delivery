import { PartialType } from '@nestjs/mapped-types';
import { CreateCoffeeDto } from './create-coffee.dto';

export class UpdateCoffeeDto extends PartialType(CreateCoffeeDto) {
  name?: string;
  description?: string;
  price?: number | undefined;
  imageUrl?: string;
  tagIds?: string[];
}
