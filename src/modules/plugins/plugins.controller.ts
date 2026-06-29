import { Controller, Get, Post, Put, Param, Body, HttpCode, HttpStatus, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PluginLoaderService, PluginStatus } from '../../core/plugins';
import { PluginDto, PluginConfigDto } from './dto/plugin.dto';
import { redactSecretConfig, restoreSecretConfig } from './redact-config';
import { RequireRole } from '../auth/decorators/auth.decorators';
import { ApiKeyRole } from '../auth/entities/api-key.entity';

@ApiTags('plugins')
@Controller('plugins')
export class PluginsController {
  constructor(private readonly pluginLoader: PluginLoaderService) {}

  @Get()
  @ApiOperation({ summary: 'List all plugins' })
  @ApiResponse({ status: 200, description: 'List of all plugins' })
  findAll(): PluginDto[] {
    const plugins = this.pluginLoader.getAllPlugins();
    return plugins.map(plugin => ({
      id: plugin.manifest.id,
      name: plugin.manifest.name,
      version: plugin.manifest.version,
      type: plugin.manifest.type,
      description: plugin.manifest.description,
      author: plugin.manifest.author,
      status: plugin.status,
      config: redactSecretConfig(plugin.config, plugin.manifest.configSchema),
      builtIn: plugin.manifest.id === 'whatsapp-web.js',
      provides: plugin.manifest.provides ?? [],
      configSchema: plugin.manifest.configSchema,
      loadedAt: plugin.loadedAt?.toISOString(),
      enabledAt: plugin.enabledAt?.toISOString(),
      error: plugin.error,
    }));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get plugin by ID' })
  @ApiResponse({ status: 200, description: 'Plugin details' })
  @ApiResponse({ status: 404, description: 'Plugin not found' })
  findOne(@Param('id') id: string): PluginDto {
    const plugin = this.pluginLoader.getPlugin(id);
    if (!plugin) {
      throw new NotFoundException(`Plugin ${id} not found`);
    }
    return {
      id: plugin.manifest.id,
      name: plugin.manifest.name,
      version: plugin.manifest.version,
      type: plugin.manifest.type,
      description: plugin.manifest.description,
      author: plugin.manifest.author,
      status: plugin.status,
      config: redactSecretConfig(plugin.config, plugin.manifest.configSchema),
      builtIn: plugin.manifest.id === 'whatsapp-web.js',
      provides: plugin.manifest.provides ?? [],
      configSchema: plugin.manifest.configSchema,
      loadedAt: plugin.loadedAt?.toISOString(),
      enabledAt: plugin.enabledAt?.toISOString(),
      error: plugin.error,
    };
  }

  @Post(':id/enable')
  @RequireRole(ApiKeyRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Enable a plugin' })
  @ApiResponse({ status: 200, description: 'Plugin enabled successfully' })
  async enable(@Param('id') id: string): Promise<{ success: boolean; message: string }> {
    const plugin = this.pluginLoader.getPlugin(id);
    if (!plugin) {
      throw new NotFoundException(`Plugin ${id} not found`);
    }
    if (plugin.status === PluginStatus.ENABLED) {
      return { success: true, message: `Plugin ${id} is already enabled` };
    }
    try {
      await this.pluginLoader.enablePlugin(id);
      return { success: true, message: `Plugin ${id} enabled successfully` };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : String(error),
      };
    }
  }

  @Post(':id/disable')
  @RequireRole(ApiKeyRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Disable a plugin' })
  @ApiResponse({ status: 200, description: 'Plugin disabled successfully' })
  async disable(@Param('id') id: string): Promise<{ success: boolean; message: string }> {
    const plugin = this.pluginLoader.getPlugin(id);
    if (!plugin) {
      throw new NotFoundException(`Plugin ${id} not found`);
    }
    if (plugin.status !== PluginStatus.ENABLED) {
      return { success: true, message: `Plugin ${id} is not enabled` };
    }
    try {
      await this.pluginLoader.disablePlugin(id);
      return { success: true, message: `Plugin ${id} disabled successfully` };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : String(error),
      };
    }
  }

  @Put(':id/config')
  @RequireRole(ApiKeyRole.ADMIN)
  @ApiOperation({ summary: 'Update plugin configuration' })
  @ApiResponse({ status: 200, description: 'Plugin configuration updated' })
  updateConfig(@Param('id') id: string, @Body() configDto: PluginConfigDto): { success: boolean; message: string } {
    const plugin = this.pluginLoader.getPlugin(id);
    if (!plugin) {
      throw new NotFoundException(`Plugin ${id} not found`);
    }
    try {
      const merged = restoreSecretConfig(configDto.config, plugin.config, plugin.manifest.configSchema);
      this.pluginLoader.updatePluginConfig(id, merged);
      return { success: true, message: `Plugin ${id} configuration updated` };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : String(error),
      };
    }
  }

  @Get(':id/health')
  @ApiOperation({ summary: 'Check plugin health' })
  @ApiResponse({ status: 200, description: 'Plugin health status' })
  async healthCheck(@Param('id') id: string): Promise<{ healthy: boolean; message?: string }> {
    const plugin = this.pluginLoader.getPlugin(id);
    if (!plugin) {
      throw new NotFoundException(`Plugin ${id} not found`);
    }
    if (!plugin.instance?.healthCheck) {
      return { healthy: true, message: 'Plugin does not implement health check' };
    }
    try {
      return await plugin.instance.healthCheck();
    } catch (error) {
      return {
        healthy: false,
        message: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
