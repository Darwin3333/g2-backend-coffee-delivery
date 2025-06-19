import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpStatus,
  HttpCode,
  Query,
  Patch,
  Delete,
} from '@nestjs/common';
import { CoffeesService } from './coffees.service';
import { CreateCoffeeDto } from './dto/create-coffee.dto';
import { UpdateCoffeeDto } from './dto/update-coffee.dto';

@Controller('coffees')
export class CoffeesController {
  constructor(private readonly coffeesService: CoffeesService) {}

  @Get()
  async findAll() {
    return this.coffeesService.findAll();
  }

  @Get('search')
  async search(
    @Query('name') name?: string,
    @Query('min_price') min_price?: string,
    @Query('max_price') max_price?: string,
    @Query('tags') tags?: string,
    @Query('start_date') start_date?: string,
    @Query('end_date') end_date?: string,
    @Query('page') page = '0',
    @Query('limit') limit = '10',
  ) {
    // Converter parâmetros de paginação
    const pageNumber = parseInt(page, 10) || 0;
    const limitNumber = parseInt(limit, 10) || 10;
    const offset = pageNumber * limitNumber;

    // Converter datas
    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (start_date) {
      startDate = new Date(start_date);
    }

    if (end_date) {
      endDate = new Date(end_date);
      // Ajusta para incluir todo o dia
      endDate.setHours(23, 59, 59, 999);
    }

    // Converter tags
    const tagsList = tags ? tags.split(',') : [];

    // Converter preços
    const minPrice = min_price ? parseFloat(min_price) : undefined;
    const maxPrice = max_price ? parseFloat(max_price) : undefined;

    return this.coffeesService.searchCoffees({
      name,
      minPrice,
      maxPrice,
      tags: tagsList,
      start_date: startDate,
      end_date: endDate,
      limit: limitNumber,
      offset,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.coffeesService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED) //retorno positivo de criação
  async create(@Body() createCoffeeDto: CreateCoffeeDto) {
    return this.coffeesService.create(createCoffeeDto);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateCoffeeDto: UpdateCoffeeDto,
  ) {
    return this.coffeesService.update(id, updateCoffeeDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT) //retorno erro de sem conteudo
  async remove(@Param('id') id: string) {
    return this.coffeesService.remove(id);
  }
}
