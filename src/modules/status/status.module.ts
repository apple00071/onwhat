import { Module } from '@nestjs/common';
import { StatusController } from './status.controller';
import { SessionModule } from '../session/session.module';

@Module({
  imports: [SessionModule],
  controllers: [StatusController],
})
export class StatusModule {}
