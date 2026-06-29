import { Module } from '@nestjs/common';
import { PluginsController } from './plugins.controller';
import { PluginsModule } from '../../core/plugins/plugins.module';

@Module({
  imports: [PluginsModule],
  controllers: [PluginsController],
})
export class PluginsApiModule {}
