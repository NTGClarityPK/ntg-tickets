import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CustomFieldType } from '@prisma/client';
import {
  CreateCustomFieldDto,
  UpdateCustomFieldDto,
} from './dto/custom-field.dto';

@Injectable()
export class CustomFieldsService {
  private readonly logger = new Logger(CustomFieldsService.name);

  constructor(private prisma: PrismaService) {}

  async findAll(filters?: { category?: string; isActive?: boolean }) {
    try {
      const where: {
        category?: string;
        isActive?: boolean;
      } = {};

      if (filters?.category) {
        where.category = filters.category;
      }

      if (filters?.isActive !== undefined) {
        where.isActive = filters.isActive;
      }

      const customFields = await this.prisma.customField.findMany({
        where,
        orderBy: { name: 'asc' },
      });
      return customFields;
    } catch (error) {
      this.logger.error('Error finding custom fields:', error);
      throw error;
    }
  }

  async findOne(id: string) {
    try {
      const customField = await this.prisma.customField.findUnique({
        where: { id },
      });

      if (!customField) {
        throw new NotFoundException('Custom field not found');
      }

      return customField;
    } catch (error) {
      this.logger.error('Error finding custom field:', error);
      throw error;
    }
  }

  async create(createCustomFieldDto: CreateCustomFieldDto) {
    try {
      const customField = await this.prisma.customField.create({
        data: {
          name: createCustomFieldDto.name,
          fieldType: createCustomFieldDto.fieldType as CustomFieldType,
          options: createCustomFieldDto.options,
          isRequired: createCustomFieldDto.isRequired ?? false,
          isActive: createCustomFieldDto.isActive ?? true,
          description: createCustomFieldDto.description,
          category: createCustomFieldDto.category,
        },
      });

      return customField;
    } catch (error) {
      this.logger.error('Error creating custom field:', error);
      throw error;
    }
  }

  async update(id: string, updateCustomFieldDto: UpdateCustomFieldDto) {
    try {
      await this.findOne(id);

      const updateData: {
        name?: string;
        fieldType?: CustomFieldType;
        options?: string[] | null;
        isRequired?: boolean;
        isActive?: boolean;
        description?: string;
        category?: string;
      } = {};

      if (updateCustomFieldDto.name !== undefined) {
        updateData.name = updateCustomFieldDto.name;
      }
      if (updateCustomFieldDto.fieldType !== undefined) {
        updateData.fieldType =
          updateCustomFieldDto.fieldType as CustomFieldType;
      }
      if (updateCustomFieldDto.options !== undefined) {
        updateData.options = updateCustomFieldDto.options;
      }
      if (updateCustomFieldDto.isRequired !== undefined) {
        updateData.isRequired = updateCustomFieldDto.isRequired;
      }
      if (updateCustomFieldDto.isActive !== undefined) {
        updateData.isActive = updateCustomFieldDto.isActive;
      }
      if (updateCustomFieldDto.description !== undefined) {
        updateData.description = updateCustomFieldDto.description;
      }
      if (updateCustomFieldDto.category !== undefined) {
        updateData.category = updateCustomFieldDto.category;
      }

      const customField = await this.prisma.customField.update({
        where: { id },
        data: updateData,
      });

      return customField;
    } catch (error) {
      this.logger.error('Error updating custom field:', error);
      throw error;
    }
  }

  async remove(id: string) {
    try {
      await this.findOne(id);

      await this.prisma.customField.delete({
        where: { id },
      });

      return { message: 'Custom field deleted successfully' };
    } catch (error) {
      this.logger.error('Error deleting custom field:', error);
      throw error;
    }
  }
}
