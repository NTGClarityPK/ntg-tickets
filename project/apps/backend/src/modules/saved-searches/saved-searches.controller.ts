import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { SavedSearchesService } from './saved-searches.service';
import { CreateSavedSearchDto } from './dto/create-saved-search.dto';
import { UpdateSavedSearchDto } from './dto/update-saved-search.dto';
import { NextAuthJwtGuard } from '../auth/guards/nextauth-jwt.guard';

@ApiTags('Saved Searches')
@Controller('saved-searches')
@UseGuards(NextAuthJwtGuard)
@ApiBearerAuth()
export class SavedSearchesController {
  constructor(private readonly savedSearchesService: SavedSearchesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new saved search' })
  @ApiResponse({
    status: 201,
    description: 'Saved search created successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(
    @Body() createSavedSearchDto: CreateSavedSearchDto,
    @Request() req
  ) {
    const savedSearch = await this.savedSearchesService.create(
      createSavedSearchDto,
      req.user.id
    );
    return {
      data: savedSearch,
      message: 'Saved search created successfully',
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all saved searches' })
  @ApiResponse({
    status: 200,
    description: 'Saved searches retrieved successfully',
  })
  @ApiQuery({ name: 'includePublic', required: false, type: Boolean })
  async findAll(
    @Request() req,
    @Query('includePublic') includePublic?: string
  ) {
    const savedSearches = await this.savedSearchesService.findAll(
      req.user.id,
      includePublic === 'true'
    );
    return {
      data: savedSearches,
      message: 'Saved searches retrieved successfully',
    };
  }

  @Get('popular')
  @ApiOperation({ summary: 'Get popular public saved searches' })
  @ApiResponse({
    status: 200,
    description: 'Popular searches retrieved successfully',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getPopularSearches(@Query('limit') limit?: string) {
    const popularSearches = await this.savedSearchesService.getPopularSearches(
      limit ? parseInt(limit) : 10
    );
    return {
      data: popularSearches,
      message: 'Popular searches retrieved successfully',
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get saved search by ID' })
  @ApiResponse({
    status: 200,
    description: 'Saved search retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Saved search not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    const savedSearch = await this.savedSearchesService.findOne(
      id,
      req.user.id
    );
    return {
      data: savedSearch,
      message: 'Saved search retrieved successfully',
    };
  }

  @Get(':id/execute')
  @ApiOperation({ summary: 'Execute a saved search' })
  @ApiResponse({
    status: 200,
    description: 'Saved search executed successfully',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async executeSavedSearch(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    const result = await this.savedSearchesService.executeSavedSearch(
      id,
      req.user.id,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20
    );
    return {
      data: result,
      message: 'Saved search executed successfully',
    };
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplicate a saved search' })
  @ApiResponse({
    status: 201,
    description: 'Saved search duplicated successfully',
  })
  @ApiResponse({ status: 404, description: 'Saved search not found' })
  async duplicateSearch(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req,
    @Body() body: { name?: string }
  ) {
    const duplicatedSearch = await this.savedSearchesService.duplicateSearch(
      id,
      req.user.id,
      body.name
    );
    return {
      data: duplicatedSearch,
      message: 'Saved search duplicated successfully',
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update saved search' })
  @ApiResponse({
    status: 200,
    description: 'Saved search updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Saved search not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateSavedSearchDto: UpdateSavedSearchDto,
    @Request() req
  ) {
    const savedSearch = await this.savedSearchesService.update(
      id,
      updateSavedSearchDto,
      req.user.id
    );
    return {
      data: savedSearch,
      message: 'Saved search updated successfully',
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete saved search' })
  @ApiResponse({
    status: 200,
    description: 'Saved search deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Saved search not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async remove(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    const result = await this.savedSearchesService.remove(id, req.user.id);
    return result;
  }
}
