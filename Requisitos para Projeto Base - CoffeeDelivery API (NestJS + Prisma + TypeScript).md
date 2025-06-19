# Requisitos para Projeto Base - CoffeeDelivery API (NestJS + Prisma + TypeScript)

## Estrutura do Projeto

```
coffee-delivery-api/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── coffees/
│   │   ├── coffees.module.ts
│   │   ├── coffees.controller.ts
│   │   ├── coffees.service.ts
│   │   ├── entities/
│   │   │   └── coffee.entity.ts
│   │   └── dto/
│   │       ├── create-coffee.dto.ts
│   │       ├── update-coffee.dto.ts
│   │       └── coffee-response.dto.ts
│   ├── tags/
│   │   ├── tags.module.ts
│   │   ├── tags.controller.ts
│   │   ├── tags.service.ts
│   │   ├── entities/
│   │   │   └── tag.entity.ts
│   │   └── dto/
│   │       ├── create-tag.dto.ts
│   │       └── tag-response.dto.ts
│   ├── cart/
│   │   ├── cart.module.ts
│   │   ├── cart.controller.ts
│   │   ├── cart.service.ts
│   │   ├── entities/
│   │   │   ├── cart.entity.ts
│   │   │   └── cart-item.entity.ts
│   │   └── dto/
│   │       ├── add-item.dto.ts
│   │       ├── update-item.dto.ts
│   │       └── cart-response.dto.ts
│   └── checkout/
│       ├── checkout.module.ts
│       ├── checkout.controller.ts
│       ├── checkout.service.ts
│       └── dto/
│           ├── checkout.dto.ts
│           └── order-response.dto.ts
├── .env
├── package.json
└── tsconfig.json
```

## Configuração Inicial

1. **Inicialização do Projeto**

   ```bash
   # Criar projeto NestJS
   nest new coffee-delivery-api
   cd coffee-delivery-api

   # Instalar dependências
   npm install @nestjs/common @nestjs/core @nestjs/platform-express reflect-metadata rxjs
   npm install --save-dev @nestjs/cli @nestjs/schematics @types/express @types/node typescript

   # Instalar Prisma
   npm install @prisma/client
   npm install --save-dev prisma

   # Inicializar Prisma
   npx prisma init
   ```

2. **Configuração do .env**
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/coffeedelivery?schema=public"
   ```

## Schema Prisma

Crie o arquivo `prisma/schema.prisma` com o seguinte conteúdo:

```prisma
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Coffee {
  id          String     @id @default(uuid())
  name        String
  description String
  price       Decimal    @db.Decimal(10, 2)
  imageUrl    String
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  // Relacionamentos
  tags        CoffeeTag[]
  cartItems   CartItem[]
}

model Tag {
  id        String      @id @default(uuid())
  name      String      @unique
  createdAt DateTime    @default(now())
  updatedAt DateTime    @updatedAt

  // Relacionamentos
  coffees   CoffeeTag[]
}

model CoffeeTag {
  coffee    Coffee  @relation(fields: [coffeeId], references: [id])
  coffeeId  String
  tag       Tag     @relation(fields: [tagId], references: [id])
  tagId     String

  @@id([coffeeId, tagId])
}

model Cart {
  id        String     @id @default(uuid())
  userId    String?    // Opcional para usuários não autenticados
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt

  // Relacionamentos
  items     CartItem[]
  orders    Order[]
}

model CartItem {
  id         String   @id @default(uuid())
  quantity   Int
  unitPrice  Decimal  @db.Decimal(10, 2)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  // Relacionamentos
  cart       Cart     @relation(fields: [cartId], references: [id], onDelete: Cascade)
  cartId     String
  coffee     Coffee   @relation(fields: [coffeeId], references: [id])
  coffeeId   String

  @@unique([cartId, coffeeId])
}

model Order {
  id          String   @id @default(uuid())
  totalItems  Decimal  @db.Decimal(10, 2)
  shippingFee Decimal  @db.Decimal(10, 2)
  totalAmount Decimal  @db.Decimal(10, 2)
  status      String   @default("pending")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relacionamentos
  cart        Cart     @relation(fields: [cartId], references: [id])
  cartId      String
}
```

## Módulo Principal

Crie o arquivo `src/app.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { CoffeesModule } from './coffees/coffees.module';
import { TagsModule } from './tags/tags.module';
import { CartModule } from './cart/cart.module';
import { CheckoutModule } from './checkout/checkout.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    CoffeesModule,
    TagsModule,
    CartModule,
    CheckoutModule,
  ],
})
export class AppModule {}
```

## Módulo Prisma

1. **Criar o Módulo e Serviço Prisma**

   Crie o diretório `src/prisma` e os seguintes arquivos:

   `src/prisma/prisma.module.ts`:

   ```typescript
   import { Module } from '@nestjs/common';
   import { PrismaService } from './prisma.service';

   @Module({
     providers: [PrismaService],
     exports: [PrismaService],
   })
   export class PrismaModule {}
   ```

   `src/prisma/prisma.service.ts`:

   ```typescript
   import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
   import { PrismaClient } from '@prisma/client';

   @Injectable()
   export class PrismaService
     extends PrismaClient
     implements OnModuleInit, OnModuleDestroy
   {
     constructor() {
       super({
         log: ['query', 'info', 'warn', 'error'],
       });
     }

     async onModuleInit() {
       await this.$connect();
     }

     async onModuleDestroy() {
       await this.$disconnect();
     }
   }
   ```

## Módulo Coffees

1. **Entidade Coffee**

   `src/coffees/entities/coffee.entity.ts`:

   ```typescript
   import { Coffee as PrismaCoffee } from '@prisma/client';

   export class Coffee implements PrismaCoffee {
     id: string;
     name: string;
     description: string;
     price: number | string;
     imageUrl: string;
     createdAt: Date;
     updatedAt: Date;

     // Campos adicionais não presentes no modelo Prisma
     tags?: { id: string; name: string }[];
   }
   ```

2. **DTOs para Coffee**

   `src/coffees/dto/create-coffee.dto.ts`:

   ```typescript
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
   ```

   `src/coffees/dto/update-coffee.dto.ts`:

   ```typescript
   import { PartialType } from '@nestjs/mapped-types';
   import { CreateCoffeeDto } from './create-coffee.dto';

   export class UpdateCoffeeDto extends PartialType(CreateCoffeeDto) {}
   ```

   `src/coffees/dto/coffee-response.dto.ts`:

   ```typescript
   export class CoffeeResponseDto {
     id: string;
     name: string;
     description: string;
     price: number;
     imageUrl: string;
     createdAt: Date;
     updatedAt: Date;
     tags: { id: string; name: string }[];
   }
   ```

3. **Serviço Coffees**

   `src/coffees/coffees.service.ts`:

   ```typescript
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

       // Verificar se o café existe
       await this.findOne(id);

       // Se tagIds for fornecido, atualizar relacionamentos
       if (tagIds) {
         // Primeiro, remover todos os relacionamentos existentes
         await this.prisma.coffeeTag.deleteMany({
           where: { coffeeId: id },
         });

         // Depois, criar os novos relacionamentos
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

       // Atualizar os dados do café
       return this.prisma.coffee.update({
         where: { id },
         data: coffeeData,
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
       // Verificar se o café existe
       await this.findOne(id);

       // Remover o café
       return this.prisma.coffee.delete({
         where: { id },
       });
     }

     async searchCoffees(params: {
       startDate?: Date;
       endDate?: Date;
       name?: string;
       tags?: string[];
       limit?: number;
       offset?: number;
     }) {
       const {
         startDate,
         endDate,
         name,
         tags,
         limit = 10,
         offset = 0,
       } = params;

       // Construir o filtro
       const where: any = {};

       // Filtro por data
       if (startDate || endDate) {
         where.createdAt = {};
         if (startDate) {
           where.createdAt.gte = startDate;
         }
         if (endDate) {
           where.createdAt.lte = endDate;
         }
       }

       // Filtro por nome
       if (name) {
         where.name = {
           contains: name,
           mode: 'insensitive',
         };
       }

       // Filtro por tags
       if (tags && tags.length > 0) {
         where.tags = {
           some: {
             tag: {
               name: {
                 in: tags,
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
         }),
         this.prisma.coffee.count({ where }),
       ]);

       // Formatar a resposta
       return {
         data: coffees.map((coffee) => ({
           ...coffee,
           tags: coffee.tags.map((coffeeTag) => coffeeTag.tag),
         })),
         pagination: {
           total,
           limit,
           offset,
           hasMore: offset + limit < total,
         },
       };
     }
   }
   ```

4. **Controller Coffees**

   `src/coffees/coffees.controller.ts`:

   ```typescript
   import {
     Controller,
     Get,
     Post,
     Body,
     Patch,
     Param,
     Delete,
     HttpStatus,
     HttpCode,
     Query,
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
       @Query('dateRange') dateRange?: string,
       @Query('name') name?: string,
       @Query('tags') tags?: string,
       @Query('limit') limit = 10,
       @Query('offset') offset = 0,
     ) {
       // Processar os parâmetros
       let startDate: Date | undefined;
       let endDate: Date | undefined;

       if (dateRange) {
         const [start, end] = dateRange.split(',');
         startDate = start ? new Date(start) : undefined;
         endDate = end ? new Date(end) : undefined;
       }

       const tagsList = tags ? tags.split(',') : [];

       return this.coffeesService.searchCoffees({
         startDate,
         endDate,
         name,
         tags: tagsList,
         limit: +limit,
         offset: +offset,
       });
     }

     @Get(':id')
     async findOne(@Param('id') id: string) {
       return this.coffeesService.findOne(id);
     }

     @Post()
     @HttpCode(HttpStatus.CREATED)
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
     @HttpCode(HttpStatus.NO_CONTENT)
     async remove(@Param('id') id: string) {
       return this.coffeesService.remove(id);
     }
   }
   ```

5. **Módulo Coffees**

   `src/coffees/coffees.module.ts`:

   ```typescript
   import { Module } from '@nestjs/common';
   import { CoffeesService } from './coffees.service';
   import { CoffeesController } from './coffees.controller';
   import { PrismaModule } from '../prisma/prisma.module';

   @Module({
     imports: [PrismaModule],
     controllers: [CoffeesController],
     providers: [CoffeesService],
     exports: [CoffeesService],
   })
   export class CoffeesModule {}
   ```

## Módulo Tags

1. **Entidade Tag**

   `src/tags/entities/tag.entity.ts`:

   ```typescript
   import { Tag as PrismaTag } from '@prisma/client';

   export class Tag implements PrismaTag {
     id: string;
     name: string;
     createdAt: Date;
     updatedAt: Date;
   }
   ```

2. **DTOs para Tag**

   `src/tags/dto/create-tag.dto.ts`:

   ```typescript
   import { IsNotEmpty, IsString } from 'class-validator';

   export class CreateTagDto {
     @IsNotEmpty()
     @IsString()
     name: string;
   }
   ```

   `src/tags/dto/tag-response.dto.ts`:

   ```typescript
   export class TagResponseDto {
     id: string;
     name: string;
     createdAt: Date;
     updatedAt: Date;
   }
   ```

3. **Serviço Tags**

   `src/tags/tags.service.ts`:

   ```typescript
   import {
     Injectable,
     NotFoundException,
     ConflictException,
   } from '@nestjs/common';
   import { PrismaService } from '../prisma/prisma.service';
   import { CreateTagDto } from './dto/create-tag.dto';

   @Injectable()
   export class TagsService {
     constructor(private prisma: PrismaService) {}

     async findAll() {
       return this.prisma.tag.findMany();
     }

     async findOne(id: string) {
       const tag = await this.prisma.tag.findUnique({
         where: { id },
       });

       if (!tag) {
         throw new NotFoundException(`Tag with ID ${id} not found`);
       }

       return tag;
     }

     async create(createTagDto: CreateTagDto) {
       try {
         return await this.prisma.tag.create({
           data: createTagDto,
         });
       } catch (error) {
         if (error.code === 'P2002') {
           throw new ConflictException(
             `Tag with name ${createTagDto.name} already exists`,
           );
         }
         throw error;
       }
     }

     async remove(id: string) {
       // Verificar se a tag existe
       await this.findOne(id);

       // Remover a tag
       return this.prisma.tag.delete({
         where: { id },
       });
     }
   }
   ```

4. **Controller Tags**

   `src/tags/tags.controller.ts`:

   ```typescript
   import {
     Controller,
     Get,
     Post,
     Body,
     Param,
     Delete,
     HttpStatus,
     HttpCode,
   } from '@nestjs/common';
   import { TagsService } from './tags.service';
   import { CreateTagDto } from './dto/create-tag.dto';

   @Controller('tags')
   export class TagsController {
     constructor(private readonly tagsService: TagsService) {}

     @Get()
     async findAll() {
       return this.tagsService.findAll();
     }

     @Get(':id')
     async findOne(@Param('id') id: string) {
       return this.tagsService.findOne(id);
     }

     @Post()
     @HttpCode(HttpStatus.CREATED)
     async create(@Body() createTagDto: CreateTagDto) {
       return this.tagsService.create(createTagDto);
     }

     @Delete(':id')
     @HttpCode(HttpStatus.NO_CONTENT)
     async remove(@Param('id') id: string) {
       return this.tagsService.remove(id);
     }
   }
   ```

5. **Módulo Tags**

   `src/tags/tags.module.ts`:

   ```typescript
   import { Module } from '@nestjs/common';
   import { TagsService } from './tags.service';
   import { TagsController } from './tags.controller';
   import { PrismaModule } from '../prisma/prisma.module';

   @Module({
     imports: [PrismaModule],
     controllers: [TagsController],
     providers: [TagsService],
     exports: [TagsService],
   })
   export class TagsModule {}
   ```

## Módulo Cart

1. **Entidades Cart e CartItem**

   `src/cart/entities/cart.entity.ts`:

   ```typescript
   import { Cart as PrismaCart } from '@prisma/client';

   export class Cart implements PrismaCart {
     id: string;
     userId: string | null;
     createdAt: Date;
     updatedAt: Date;
   }
   ```

   `src/cart/entities/cart-item.entity.ts`:

   ```typescript
   import { CartItem as PrismaCartItem } from '@prisma/client';

   export class CartItem implements PrismaCartItem {
     id: string;
     cartId: string;
     coffeeId: string;
     quantity: number;
     unitPrice: number | string;
     createdAt: Date;
     updatedAt: Date;

     // Campos adicionais não presentes no modelo Prisma
     coffee?: {
       id: string;
       name: string;
       price: number;
       imageUrl: string;
     };
     subtotal?: number;
   }
   ```

2. **DTOs para Cart**

   `src/cart/dto/add-item.dto.ts`:

   ```typescript
   import { IsNotEmpty, IsString, IsInt, Min, Max } from 'class-validator';
   import { Type } from 'class-transformer';

   export class AddItemDto {
     @IsNotEmpty()
     @IsString()
     coffeeId: string;

     @IsInt()
     @Min(1)
     @Max(5)
     @Type(() => Number)
     quantity: number;
   }
   ```

   `src/cart/dto/update-item.dto.ts`:

   ```typescript
   import { IsInt, Min, Max } from 'class-validator';
   import { Type } from 'class-transformer';

   export class UpdateItemDto {
     @IsInt()
     @Min(1)
     @Max(5)
     @Type(() => Number)
     quantity: number;
   }
   ```

   `src/cart/dto/cart-response.dto.ts`:

   ```typescript
   export class CartItemResponseDto {
     id: string;
     coffee: {
       id: string;
       name: string;
       price: number;
       imageUrl: string;
     };
     quantity: number;
     unitPrice: number;
     subtotal: number;
   }

   export class CartResponseDto {
     id: string;
     items: CartItemResponseDto[];
     itemsTotal: number;
     uniqueCategories: string[];
     shippingFee: number;
     total: number;
   }
   ```

3. **Serviço Cart**

   `src/cart/cart.service.ts`:

   ```typescript
   import {
     Injectable,
     NotFoundException,
     BadRequestException,
   } from '@nestjs/common';
   import { PrismaService } from '../prisma/prisma.service';
   import { AddItemDto } from './dto/add-item.dto';
   import { UpdateItemDto } from './dto/update-item.dto';

   @Injectable()
   export class CartService {
     constructor(private prisma: PrismaService) {}

     async getOrCreateCart(userId?: string) {
       // Se userId for fornecido, buscar carrinho existente ou criar novo
       if (userId) {
         const existingCart = await this.prisma.cart.findFirst({
           where: { userId },
           include: { items: true },
         });

         if (existingCart) {
           return existingCart;
         }
       }

       // Criar novo carrinho
       return this.prisma.cart.create({
         data: {
           userId: userId || null,
         },
       });
     }

     async getCart(cartId: string) {
       const cart = await this.prisma.cart.findUnique({
         where: { id: cartId },
         include: {
           items: {
             include: {
               coffee: {
                 include: {
                   tags: {
                     include: {
                       tag: true,
                     },
                   },
                 },
               },
             },
           },
         },
       });

       if (!cart) {
         throw new NotFoundException(`Cart with ID ${cartId} not found`);
       }

       // Calcular subtotal para cada item
       const items = cart.items.map((item) => ({
         ...item,
         subtotal: Number(item.quantity) * Number(item.unitPrice),
         coffee: {
           ...item.coffee,
           tags: item.coffee.tags.map((coffeeTag) => coffeeTag.tag),
         },
       }));

       // Calcular total de itens
       const itemsTotal = items.reduce(
         (sum, item) => sum + Number(item.subtotal),
         0,
       );

       // Obter categorias únicas
       const uniqueCategories = Array.from(
         new Set(
           items.flatMap((item) => item.coffee.tags.map((tag) => tag.name)),
         ),
       );

       // Calcular frete (R$3,75 por categoria única)
       const shippingFee = uniqueCategories.length * 3.75;

       // Calcular total
       const total = itemsTotal + shippingFee;

       return {
         id: cart.id,
         items,
         itemsTotal,
         uniqueCategories,
         shippingFee,
         total,
       };
     }

     async addItem(cartId: string, addItemDto: AddItemDto) {
       const { coffeeId, quantity } = addItemDto;

       // Verificar se o café existe
       const coffee = await this.prisma.coffee.findUnique({
         where: { id: coffeeId },
       });

       if (!coffee) {
         throw new NotFoundException(`Coffee with ID ${coffeeId} not found`);
       }

       // Verificar se o carrinho existe
       const cart = await this.prisma.cart.findUnique({
         where: { id: cartId },
       });

       if (!cart) {
         throw new NotFoundException(`Cart with ID ${cartId} not found`);
       }

       // Verificar se o item já existe no carrinho
       const existingItem = await this.prisma.cartItem.findUnique({
         where: {
           cartId_coffeeId: {
             cartId,
             coffeeId,
           },
         },
       });

       if (existingItem) {
         // Atualizar quantidade do item existente
         const newQuantity = existingItem.quantity + quantity;

         if (newQuantity > 5) {
           throw new BadRequestException('Maximum quantity per item is 5');
         }

         const updatedItem = await this.prisma.cartItem.update({
           where: { id: existingItem.id },
           data: { quantity: newQuantity },
           include: { coffee: true },
         });

         return {
           ...updatedItem,
           subtotal:
             Number(updatedItem.quantity) * Number(updatedItem.unitPrice),
         };
       }

       // Adicionar novo item ao carrinho
       const newItem = await this.prisma.cartItem.create({
         data: {
           cart: { connect: { id: cartId } },
           coffee: { connect: { id: coffeeId } },
           quantity,
           unitPrice: coffee.price,
         },
         include: { coffee: true },
       });

       return {
         ...newItem,
         subtotal: Number(newItem.quantity) * Number(newItem.unitPrice),
       };
     }

     async updateItem(
       cartId: string,
       itemId: string,
       updateItemDto: UpdateItemDto,
     ) {
       // Verificar se o item existe no carrinho
       const item = await this.prisma.cartItem.findFirst({
         where: {
           id: itemId,
           cartId,
         },
       });

       if (!item) {
         throw new NotFoundException(
           `Item with ID ${itemId} not found in cart ${cartId}`,
         );
       }

       // Atualizar quantidade do item
       const updatedItem = await this.prisma.cartItem.update({
         where: { id: itemId },
         data: { quantity: updateItemDto.quantity },
         include: { coffee: true },
       });

       return {
         ...updatedItem,
         subtotal: Number(updatedItem.quantity) * Number(updatedItem.unitPrice),
       };
     }

     async removeItem(cartId: string, itemId: string) {
       // Verificar se o item existe no carrinho
       const item = await this.prisma.cartItem.findFirst({
         where: {
           id: itemId,
           cartId,
         },
       });

       if (!item) {
         throw new NotFoundException(
           `Item with ID ${itemId} not found in cart ${cartId}`,
         );
       }

       // Remover o item do carrinho
       await this.prisma.cartItem.delete({
         where: { id: itemId },
       });

       return { success: true };
     }
   }
   ```

4. **Controller Cart**

   `src/cart/cart.controller.ts`:

   ```typescript
   import {
     Controller,
     Get,
     Post,
     Body,
     Patch,
     Param,
     Delete,
     HttpStatus,
     HttpCode,
   } from '@nestjs/common';
   import { CartService } from './cart.service';
   import { AddItemDto } from './dto/add-item.dto';
   import { UpdateItemDto } from './dto/update-item.dto';

   @Controller('cart')
   export class CartController {
     constructor(private readonly cartService: CartService) {}

     @Post()
     @HttpCode(HttpStatus.CREATED)
     async createCart() {
       return this.cartService.getOrCreateCart();
     }

     @Get(':id')
     async getCart(@Param('id') id: string) {
       return this.cartService.getCart(id);
     }

     @Post(':id/items')
     @HttpCode(HttpStatus.CREATED)
     async addItem(@Param('id') id: string, @Body() addItemDto: AddItemDto) {
       return this.cartService.addItem(id, addItemDto);
     }

     @Patch(':cartId/items/:itemId')
     async updateItem(
       @Param('cartId') cartId: string,
       @Param('itemId') itemId: string,
       @Body() updateItemDto: UpdateItemDto,
     ) {
       return this.cartService.updateItem(cartId, itemId, updateItemDto);
     }

     @Delete(':cartId/items/:itemId')
     @HttpCode(HttpStatus.NO_CONTENT)
     async removeItem(
       @Param('cartId') cartId: string,
       @Param('itemId') itemId: string,
     ) {
       return this.cartService.removeItem(cartId, itemId);
     }
   }
   ```

5. **Módulo Cart**

   `src/cart/cart.module.ts`:

   ```typescript
   import { Module } from '@nestjs/common';
   import { CartService } from './cart.service';
   import { CartController } from './cart.controller';
   import { PrismaModule } from '../prisma/prisma.module';

   @Module({
     imports: [PrismaModule],
     controllers: [CartController],
     providers: [CartService],
     exports: [CartService],
   })
   export class CartModule {}
   ```

## Módulo Checkout

1. **DTOs para Checkout**

   `src/checkout/dto/checkout.dto.ts`:

   ```typescript
   import {
     IsNotEmpty,
     IsString,
     IsObject,
     ValidateNested,
   } from 'class-validator';
   import { Type } from 'class-transformer';

   class AddressDto {
     @IsNotEmpty()
     @IsString()
     street: string;

     @IsNotEmpty()
     @IsString()
     number: string;

     @IsNotEmpty()
     @IsString()
     city: string;

     @IsNotEmpty()
     @IsString()
     state: string;

     @IsNotEmpty()
     @IsString()
     zipCode: string;
   }

   export class CheckoutDto {
     @IsNotEmpty()
     @IsString()
     cartId: string;

     @IsObject()
     @ValidateNested()
     @Type(() => AddressDto)
     deliveryAddress: AddressDto;

     @IsNotEmpty()
     @IsString()
     paymentMethod: string;
   }
   ```

   `src/checkout/dto/order-response.dto.ts`:

   ```typescript
   export class OrderItemDto {
     name: string;
     quantity: number;
     unitPrice: number;
     subtotal: number;
   }

   export class OrderResponseDto {
     id: string;
     items: OrderItemDto[];
     uniqueCategories: string[];
     itemsTotal: number;
     shippingFee: number;
     total: number;
     status: string;
     createdAt: Date;
   }
   ```

2. **Serviço Checkout**

   `src/checkout/checkout.service.ts`:

   ```typescript
   import { Injectable, NotFoundException } from '@nestjs/common';
   import { PrismaService } from '../prisma/prisma.service';
   import { CartService } from '../cart/cart.service';
   import { CheckoutDto } from './dto/checkout.dto';

   @Injectable()
   export class CheckoutService {
     constructor(
       private prisma: PrismaService,
       private cartService: CartService,
     ) {}

     async createOrder(checkoutDto: CheckoutDto) {
       const { cartId, deliveryAddress, paymentMethod } = checkoutDto;

       // Obter o carrinho com itens e cálculos
       const cart = await this.cartService.getCart(cartId);

       if (!cart || cart.items.length === 0) {
         throw new NotFoundException(
           `Cart with ID ${cartId} not found or is empty`,
         );
       }

       // Criar o pedido
       const order = await this.prisma.order.create({
         data: {
           cart: { connect: { id: cartId } },
           totalItems: cart.itemsTotal,
           shippingFee: cart.shippingFee,
           totalAmount: cart.total,
           // Aqui você poderia salvar também o endereço e método de pagamento
           // em modelos adicionais relacionados ao pedido
         },
       });

       // Formatar a resposta
       return {
         id: order.id,
         items: cart.items.map((item) => ({
           name: item.coffee.name,
           quantity: item.quantity,
           unitPrice: Number(item.unitPrice),
           subtotal: Number(item.subtotal),
         })),
         uniqueCategories: cart.uniqueCategories,
         itemsTotal: Number(order.totalItems),
         shippingFee: Number(order.shippingFee),
         total: Number(order.totalAmount),
         status: order.status,
         createdAt: order.createdAt,
       };
     }
   }
   ```

3. **Controller Checkout**

   `src/checkout/checkout.controller.ts`:

   ```typescript
   import {
     Controller,
     Post,
     Body,
     HttpStatus,
     HttpCode,
   } from '@nestjs/common';
   import { CheckoutService } from './checkout.service';
   import { CheckoutDto } from './dto/checkout.dto';

   @Controller('checkout')
   export class CheckoutController {
     constructor(private readonly checkoutService: CheckoutService) {}

     @Post()
     @HttpCode(HttpStatus.CREATED)
     async checkout(@Body() checkoutDto: CheckoutDto) {
       return this.checkoutService.createOrder(checkoutDto);
     }
   }
   ```

4. **Módulo Checkout**

   `src/checkout/checkout.module.ts`:

   ```typescript
   import { Module } from '@nestjs/common';
   import { CheckoutService } from './checkout.service';
   import { CheckoutController } from './checkout.controller';
   import { PrismaModule } from '../prisma/prisma.module';
   import { CartModule } from '../cart/cart.module';

   @Module({
     imports: [PrismaModule, CartModule],
     controllers: [CheckoutController],
     providers: [CheckoutService],
   })
   export class CheckoutModule {}
   ```

## Arquivo Principal

Crie o arquivo `src/main.ts`:

```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configurar validação global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Configurar CORS
  app.enableCors();

  await app.listen(3000);
}
bootstrap();
```

## Comandos para Migração e Execução

```bash
# Gerar a migração inicial
npx prisma migrate dev --name init

# Gerar o cliente Prisma
npx prisma generate

# Executar a aplicação em modo de desenvolvimento
npm run start:dev
```

## Endpoints Disponíveis

### Coffees

- `GET /coffees` - Listar todos os cafés
- `GET /coffees/:id` - Obter detalhes de um café
- `POST /coffees` - Criar um novo café
- `PATCH /coffees/:id` - Atualizar um café
- `DELETE /coffees/:id` - Remover um café
- `GET /coffees/search` - Buscar cafés com filtros

### Tags

- `GET /tags` - Listar todas as tags
- `GET /tags/:id` - Obter detalhes de uma tag
- `POST /tags` - Criar uma nova tag
- `DELETE /tags/:id` - Remover uma tag

### Cart

- `POST /cart` - Criar um novo carrinho
- `GET /cart/:id` - Obter detalhes de um carrinho
- `POST /cart/:id/items` - Adicionar item ao carrinho
- `PATCH /cart/:cartId/items/:itemId` - Atualizar quantidade de um item
- `DELETE /cart/:cartId/items/:itemId` - Remover item do carrinho

### Checkout

- `POST /checkout` - Finalizar pedido
