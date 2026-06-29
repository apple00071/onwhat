import { Module } from '@nestjs/common';
import { CatalogController } from './catalog.controller';
import { SessionModule } from '../session/session.module';

@Module({
  imports: [SessionModule],
  controllers: [CatalogController],
})
export class CatalogModule {}
