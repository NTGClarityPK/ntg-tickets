import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CustomFieldsService } from './custom-fields.service';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import {
  CreateCustomFieldDto,
  UpdateCustomFieldDto,
} from './dto/custom-field.dto';

@ApiTags('Custom Fields')
@Controller('custom-fields')
@UseGuards(SupabaseAuthGuard)
@ApiBearerAuth()
export class CustomFieldsController {
  constructor(private readonly customFieldsService: CustomFieldsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all custom fields' })
  @ApiResponse({
    status: 200,
    description: 'Custom fields retrieved successfully',
  })
  async getAllCustomFields(
    @Query('category') category?: string,
    @Query('isActive') isActive?: boolean
  ) {
    const customFields = await this.customFieldsService.findAll({
      category,
      isActive,
    });

    return {
      data: customFields,
      message: 'Custom fields retrieved successfully',
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get custom field by ID' })
  @ApiResponse({
    status: 200,
    description: 'Custom field retrieved successfully',
  })
  async getCustomField(@Param('id') id: string) {
    const customField = await this.customFieldsService.findOne(id);

    return {
      data: customField,
      message: 'Custom field retrieved successfully',
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create new custom field' })
  @ApiResponse({
    status: 201,
    description: 'Custom field created successfully',
  })
  async createCustomField(
    @Request() req,
    @Body() createCustomFieldDto: CreateCustomFieldDto
  ) {
    const customField =
      await this.customFieldsService.create(createCustomFieldDto);

    return {
      data: customField,
      message: 'Custom field created successfully',
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update custom field' })
  @ApiResponse({
    status: 200,
    description: 'Custom field updated successfully',
  })
  async updateCustomField(
    @Param('id') id: string,
    @Body() updateCustomFieldDto: UpdateCustomFieldDto
  ) {
    const customField = await this.customFieldsService.update(
      id,
      updateCustomFieldDto
    );

    return {
      data: customField,
      message: 'Custom field updated successfully',
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete custom field' })
  @ApiResponse({
    status: 200,
    description: 'Custom field deleted successfully',
  })
  async deleteCustomField(@Param('id') id: string) {
    await this.customFieldsService.remove(id);

    return {
      message: 'Custom field deleted successfully',
    };
  }
}
