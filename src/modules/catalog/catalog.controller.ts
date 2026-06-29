import { Controller, Get, Post, Param, Body, Query, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SessionService } from '../session/session.service';
import { SendProductDto, SendCatalogDto, ProductQueryDto } from './dto/send-product.dto';
import { RequireRole } from '../auth/decorators/auth.decorators';
import { ApiKeyRole } from '../auth/entities/api-key.entity';

@ApiTags('Catalog')
@Controller('sessions/:sessionId')
export class CatalogController {
  constructor(private readonly sessionService: SessionService) {}

  private getEngine(sessionId: string) {
    const engine = this.sessionService.getEngine(sessionId);
    if (!engine) {
      throw new NotFoundException(`Session ${sessionId} not found or not connected`);
    }
    return engine;
  }

  @Get('catalog')
  @ApiOperation({ summary: 'Get business catalog info' })
  async getCatalog(@Param('sessionId') sessionId: string) {
    return this.getEngine(sessionId).getCatalog();
  }

  @Get('catalog/products')
  @ApiOperation({ summary: 'List catalog products' })
  async getProducts(@Param('sessionId') sessionId: string, @Query() query: ProductQueryDto) {
    return this.getEngine(sessionId).getProducts({ page: query.page, limit: query.limit });
  }

  @Get('catalog/products/:productId')
  @ApiOperation({ summary: 'Get a specific product' })
  async getProduct(@Param('sessionId') sessionId: string, @Param('productId') productId: string) {
    return this.getEngine(sessionId).getProduct(productId);
  }

  @Post('messages/send-product')
  @RequireRole(ApiKeyRole.OPERATOR)
  @ApiOperation({ summary: 'Send a product message' })
  async sendProduct(@Param('sessionId') sessionId: string, @Body() dto: SendProductDto) {
    return this.getEngine(sessionId).sendProduct(dto.chatId, dto.productId, dto.body);
  }

  @Post('messages/send-catalog')
  @RequireRole(ApiKeyRole.OPERATOR)
  @ApiOperation({ summary: 'Send catalog link' })
  async sendCatalog(@Param('sessionId') sessionId: string, @Body() dto: SendCatalogDto) {
    return this.getEngine(sessionId).sendCatalog(dto.chatId, dto.body);
  }
}
