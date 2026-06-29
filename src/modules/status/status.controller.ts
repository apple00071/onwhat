import { Controller, Get, Post, Delete, Param, Body, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SessionService } from '../session/session.service';
import { SendTextStatusDto } from './dto/send-text-status.dto';
import { SendImageStatusDto, SendVideoStatusDto } from './dto/send-media-status.dto';
import { RequireRole } from '../auth/decorators/auth.decorators';
import { ApiKeyRole } from '../auth/entities/api-key.entity';

@ApiTags('Status')
@Controller('sessions/:sessionId/status')
export class StatusController {
  constructor(private readonly sessionService: SessionService) {}

  private getEngine(sessionId: string) {
    const engine = this.sessionService.getEngine(sessionId);
    if (!engine) {
      throw new NotFoundException(`Session ${sessionId} not found or not connected`);
    }
    return engine;
  }

  @Get()
  @ApiOperation({ summary: 'Get all contact status updates' })
  async getStatuses(@Param('sessionId') sessionId: string) {
    return { statuses: await this.getEngine(sessionId).getContactStatuses() };
  }

  @Get(':contactId')
  @ApiOperation({ summary: 'Get status updates from a specific contact' })
  async getContactStatus(@Param('sessionId') sessionId: string, @Param('contactId') contactId: string) {
    return { statuses: await this.getEngine(sessionId).getContactStatus(contactId) };
  }

  @Post('send-text')
  @RequireRole(ApiKeyRole.OPERATOR)
  @ApiOperation({ summary: 'Post a text status' })
  async sendTextStatus(@Param('sessionId') sessionId: string, @Body() dto: SendTextStatusDto) {
    return this.getEngine(sessionId).postTextStatus(dto.text, {
      backgroundColor: dto.backgroundColor,
      font: dto.font,
    });
  }

  @Post('send-image')
  @RequireRole(ApiKeyRole.OPERATOR)
  @ApiOperation({ summary: 'Post an image status' })
  async sendImageStatus(@Param('sessionId') sessionId: string, @Body() dto: SendImageStatusDto) {
    return this.getEngine(sessionId).postImageStatus(
      {
        mimetype: 'image/jpeg',
        data: dto.image.url || dto.image.base64 || '',
      },
      dto.caption,
    );
  }

  @Post('send-video')
  @RequireRole(ApiKeyRole.OPERATOR)
  @ApiOperation({ summary: 'Post a video status' })
  async sendVideoStatus(@Param('sessionId') sessionId: string, @Body() dto: SendVideoStatusDto) {
    return this.getEngine(sessionId).postVideoStatus(
      {
        mimetype: 'video/mp4',
        data: dto.video.url || dto.video.base64 || '',
      },
      dto.caption,
    );
  }

  @Delete(':statusId')
  @RequireRole(ApiKeyRole.OPERATOR)
  @ApiOperation({ summary: 'Delete own status' })
  async deleteStatus(@Param('sessionId') sessionId: string, @Param('statusId') statusId: string) {
    await this.getEngine(sessionId).deleteStatus(statusId);
    return { message: 'Status deleted successfully' };
  }
}
