import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCoffeeDto } from './dto/create-coffee.dto';
import { UpdateCoffeeDto } from './dto/update-coffee.dto';

@Injectable()
export class CoffeesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const coffees = await this.prisma.coffee.findMany({
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    return coffees.map((coffee) => ({
      ...coffee,
      tags: coffee.tags.map((coffeeTag) => coffeeTag.tag),
    }));
  }

  async findOne(id: string) {
    const coffee = await this.prisma.coffee.findUnique({
      where: { id },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    if (!coffee) {
      throw new NotFoundException(`Coffee with ID ${id} not found`);
    }

    return {
      ...coffee,
      tags: coffee.tags.map((coffeeTag) => coffeeTag.tag),
    };
  }

  async create(createCoffeeDto: CreateCoffeeDto) {
    const { tagIds, ...coffeeData } = createCoffeeDto;

    return this.prisma.coffee.create({
      data: {
        ...coffeeData,
        tags: {
          create: tagIds.map((tagId) => ({
            tag: {
              connect: { id: tagId },
            },
          })),
        },
      },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });
  }

  async update(id: string, updateCoffeeDto: UpdateCoffeeDto) {
    const { tagIds, ...coffeeData } = updateCoffeeDto;
    await this.findOne(id); //preciso verificar se o café existe

    if (tagIds) {
      // Primeiro, remover todos os relacionamentos existentes
      await this.prisma.coffeeTag.deleteMany({
        where: { coffeeId: id },
      });

      // preciso criar o novo relacionamento
      await Promise.all(
        tagIds.map((tagId) =>
          this.prisma.coffeeTag.create({
            data: {
              coffee: { connect: { id } },
              tag: { connect: { id: tagId } },
            },
          }),
        ),
      );
    }
    return this.prisma.coffee.update({
      where: { id },
      data: coffeeData, // seu dados atualziados iserir aqui
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id); //encontrar o café

    return this.prisma.coffee.delete({ where: { id } }); //agora posso deletar
  }

  async searchCoffees(params: {
    start_date?: Date;
    end_date?: Date;
    name?: string;
    tags?: string[];
    minPrice?: number;
    maxPrice?: number;
    limit?: number;
    offset?: number;
  }) {
    const {
      start_date,
      end_date,
      name,
      tags,
      minPrice,
      maxPrice,
      limit = 10,
      offset = 0,
    } = params;

    const where: any = {};

    // Filtro por data
    if (start_date || end_date) {
      where.createdAt = {};
      if (start_date) {
        where.createdAt.gte = start_date;
      }
      if (end_date) {
        where.createdAt.lte = end_date;
      }
    }

    // Filtro por nome (case-insensitive e pesquisa parcial)
    if (name) {
      where.name = {
        contains: name,
        mode: 'insensitive',
      };
    }

    // Filtro por faixa de preço
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) {
        where.price.gte = minPrice;
      }
      if (maxPrice !== undefined) {
        where.price.lte = maxPrice;
      }
    }

    // Filtro por tags
    if (tags && tags.length > 0) {
      where.tags = {
        some: {
          tag: {
            name: {
              in: tags,
              mode: 'insensitive', // Para pesquisa case-insensitive nas tags
            },
          },
        },
      };
    }

    // Buscar os cafés com paginação
    const [coffees, total] = await Promise.all([
      this.prisma.coffee.findMany({
        where,
        include: {
          tags: {
            include: {
              tag: true,
            },
          },
        },
        skip: offset,
        take: limit,
        orderBy: {
          name: 'asc', // Ordenação padrão
        },
      }),
      this.prisma.coffee.count({ where }),
    ]);

    return {
      data: coffees.map((coffee) => ({
        ...coffee,
        tags: coffee.tags.map((coffeeTag) => coffeeTag.tag),
      })),
      pagination: {
        total,
        page: Math.floor(offset / limit),
        pageSize: limit,
        totalPages: Math.ceil(total / limit),
        hasMore: offset + limit < total,
      },
    };
  }
}
