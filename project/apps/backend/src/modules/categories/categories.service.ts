import { Injectable, Logger, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { TenantContextService } from '../../common/tenant/tenant-context.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(
    private prisma: PrismaService,
    private tenantContext: TenantContextService
  ) {}

  async create(createCategoryDto: CreateCategoryDto) {
    try {
      const tenantId = this.tenantContext.requireTenantId();
      this.logger.log('Creating category with data:', JSON.stringify(createCategoryDto, null, 2));
      
      const category = await this.prisma.category.create({
        data: {
          tenantId,
          name: createCategoryDto.name,
          customName: createCategoryDto.customName,
          description: createCategoryDto.description,
          isActive: createCategoryDto.isActive ?? true,
          createdBy: createCategoryDto.createdBy!,
        },
        include: {
          subcategories: true,
        },
      });

      this.logger.log(`Category created successfully: ${category.name}`);
      return category;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const target = (error.meta as any)?.target;
        if (target?.includes('customName')) {
          throw new ConflictException(`Category with custom name "${createCategoryDto.customName}" already exists`);
        }
        throw new ConflictException(`Category already exists`);
      }
      this.logger.error('Error creating category:', error);
      this.logger.error('Error details:', JSON.stringify(error, null, 2));
      throw error;
    }
  }

  async findAll() {
    try {
      const tenantId = this.tenantContext.requireTenantId();
      const categories = await this.prisma.category.findMany({
        where: { tenantId },
        include: {
          subcategories: {
            orderBy: { name: 'asc' },
          },
        },
        orderBy: [
          { isActive: 'desc' }, // Active categories first
          { name: 'asc' }
        ],
      });

      return categories;
    } catch (error) {
      this.logger.error('Error finding categories:', error);
      throw error;
    }
  }

  async findActive() {
    try {
      const tenantId = this.tenantContext.requireTenantId();
      const categories = await this.prisma.category.findMany({
        where: { tenantId, isActive: true },
        include: {
          subcategories: {
            where: { isActive: true },
            orderBy: { name: 'asc' },
          },
        },
        orderBy: { name: 'asc' },
      });

      return categories;
    } catch (error) {
      this.logger.error('Error finding active categories:', error);
      throw error;
    }
  }

  async findOne(id: string) {
    try {
      const category = await this.prisma.category.findUnique({
        where: { id },
        include: {
          subcategories: {
            where: { isActive: true },
            orderBy: { name: 'asc' },
          },
        },
      });

      if (!category) {
        throw new Error('Category not found');
      }

      return category;
    } catch (error) {
      this.logger.error('Error finding category:', error);
      throw error;
    }
  }

  async findByEnumName(name: string) {
    try {
      const category = await this.prisma.category.findFirst({
        where: {
          name: name as
            | 'HARDWARE'
            | 'SOFTWARE'
            | 'NETWORK'
            | 'ACCESS'
            | 'OTHER',
        },
        include: {
          subcategories: {
            where: { isActive: true },
            orderBy: { name: 'asc' },
          },
        },
      });

      return category;
    } catch (error) {
      this.logger.error('Error finding category by enum name:', error);
      throw error;
    }
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    try {
      const category = await this.prisma.category.update({
        where: { id },
        data: updateCategoryDto,
        include: {
          subcategories: true,
        },
      });

      this.logger.log(`Category updated: ${category.name}`);
      return category;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException(`Category with name "${updateCategoryDto.customName}" already exists`);
      }
      this.logger.error('Error updating category:', error);
      throw error;
    }
  }

  async remove(id: string) {
    try {
      const category = await this.prisma.category.delete({
        where: { id },
      });

      this.logger.log(`Category deleted: ${category.name}`);
      return category;
    } catch (error) {
      this.logger.error('Error deleting category:', error);
      throw error;
    }
  }

  async getSubcategoriesByCategory(categoryId: string) {
    try {
      const subcategories = await this.prisma.subcategory.findMany({
        where: {
          categoryId,
          isActive: true,
        },
        orderBy: { name: 'asc' },
      });

      return subcategories;
    } catch (error) {
      this.logger.error('Error getting subcategories:', error);
      throw error;
    }
  }

  async getSubcategoriesByCategoryName(categoryName: string) {
    try {
      const category = await this.prisma.category.findFirst({
        where: {
          name: categoryName as
            | 'HARDWARE'
            | 'SOFTWARE'
            | 'NETWORK'
            | 'ACCESS'
            | 'OTHER',
        },
      });

      if (!category) {
        return [];
      }

      return this.getSubcategoriesByCategory(category.id);
    } catch (error) {
      this.logger.error('Error getting subcategories by category name:', error);
      throw error;
    }
  }

  /**
   * Get dynamic form fields based on category
   */
  async getDynamicFields(categoryName: string) {
    try {
      const category = await this.findByEnumName(categoryName);

      if (!category) {
        return { fields: [], subcategories: [] };
      }

      // Define dynamic fields based on category
      const dynamicFields = this.getFieldsForCategory(categoryName);

      return {
        fields: dynamicFields,
        subcategories: category.subcategories || [],
        category: category,
      };
    } catch (error) {
      this.logger.error('Error getting dynamic fields:', error);
      throw error;
    }
  }

  private getFieldsForCategory(categoryName: string) {
    const baseFields = [
      {
        name: 'title',
        type: 'text',
        label: 'Title',
        required: true,
        placeholder: 'Brief description of the issue',
      },
      {
        name: 'description',
        type: 'textarea',
        label: 'Description',
        required: true,
        placeholder: 'Detailed description of the issue',
      },
      {
        name: 'priority',
        type: 'select',
        label: 'Priority',
        required: true,
        options: [
          { value: 'LOW', label: 'Low' },
          { value: 'MEDIUM', label: 'Medium' },
          { value: 'HIGH', label: 'High' },
          { value: 'CRITICAL', label: 'Critical' },
        ],
      },
      {
        name: 'impact',
        type: 'select',
        label: 'Impact',
        required: true,
        options: [
          { value: 'MINOR', label: 'Minor' },
          { value: 'MODERATE', label: 'Moderate' },
          { value: 'MAJOR', label: 'Major' },
          { value: 'CRITICAL', label: 'Critical' },
        ],
      },
      {
        name: 'urgency',
        type: 'select',
        label: 'Urgency',
        required: true,
        options: [
          { value: 'LOW', label: 'Low' },
          { value: 'NORMAL', label: 'Normal' },
          { value: 'HIGH', label: 'High' },
          { value: 'IMMEDIATE', label: 'Immediate' },
        ],
      },
    ];

    // Add category-specific fields
    const categorySpecificFields = this.getCategorySpecificFields(categoryName);

    return [...baseFields, ...categorySpecificFields];
  }

  private getCategorySpecificFields(categoryName: string) {
    switch (categoryName) {
      case 'HARDWARE':
        return [
          {
            name: 'deviceModel',
            type: 'text',
            label: 'Device Model',
            required: false,
            placeholder: 'e.g., Dell OptiPlex 7090',
          },
          {
            name: 'serialNumber',
            type: 'text',
            label: 'Serial Number',
            required: false,
            placeholder: 'Device serial number',
          },
          {
            name: 'location',
            type: 'text',
            label: 'Location',
            required: false,
            placeholder: 'Physical location of the device',
          },
          {
            name: 'warrantyStatus',
            type: 'select',
            label: 'Warranty Status',
            required: false,
            options: [
              { value: 'IN_WARRANTY', label: 'In Warranty' },
              { value: 'OUT_OF_WARRANTY', label: 'Out of Warranty' },
              { value: 'UNKNOWN', label: 'Unknown' },
            ],
          },
        ];

      case 'SOFTWARE':
        return [
          {
            name: 'softwareName',
            type: 'text',
            label: 'Software Name',
            required: false,
            placeholder: 'Name of the software application',
          },
          {
            name: 'version',
            type: 'text',
            label: 'Version',
            required: false,
            placeholder: 'Software version',
          },
          {
            name: 'operatingSystem',
            type: 'text',
            label: 'Operating System',
            required: false,
            placeholder: 'e.g., Windows 11, macOS 14',
          },
          {
            name: 'errorMessage',
            type: 'textarea',
            label: 'Error Message',
            required: false,
            placeholder: 'Exact error message if any',
          },
        ];

      case 'NETWORK':
        return [
          {
            name: 'networkType',
            type: 'select',
            label: 'Network Type',
            required: false,
            options: [
              { value: 'WIRED', label: 'Wired' },
              { value: 'WIRELESS', label: 'Wireless' },
              { value: 'VPN', label: 'VPN' },
              { value: 'REMOTE', label: 'Remote Access' },
            ],
          },
          {
            name: 'affectedUsers',
            type: 'number',
            label: 'Number of Affected Users',
            required: false,
            placeholder: 'How many users are affected?',
          },
          {
            name: 'networkLocation',
            type: 'text',
            label: 'Network Location',
            required: false,
            placeholder: 'Building, floor, or specific area',
          },
          {
            name: 'severity',
            type: 'select',
            label: 'Network Severity',
            required: false,
            options: [
              { value: 'MINOR', label: 'Minor - Single user affected' },
              {
                value: 'MODERATE',
                label: 'Moderate - Multiple users affected',
              },
              { value: 'MAJOR', label: 'Major - Department affected' },
              {
                value: 'CRITICAL',
                label: 'Critical - Entire organization affected',
              },
            ],
          },
        ];

      case 'ACCESS':
        return [
          {
            name: 'accessType',
            type: 'select',
            label: 'Access Type',
            required: false,
            options: [
              { value: 'ACCOUNT_CREATION', label: 'Account Creation' },
              { value: 'PASSWORD_RESET', label: 'Password Reset' },
              { value: 'PERMISSION_CHANGE', label: 'Permission Change' },
              { value: 'ACCOUNT_LOCKOUT', label: 'Account Lockout' },
              { value: 'ACCESS_REVOKE', label: 'Access Revocation' },
            ],
          },
          {
            name: 'systemName',
            type: 'text',
            label: 'System/Application',
            required: false,
            placeholder: 'Name of the system or application',
          },
          {
            name: 'userRole',
            type: 'text',
            label: 'Requested Role',
            required: false,
            placeholder: 'Role or permission level requested',
          },
          {
            name: 'justification',
            type: 'textarea',
            label: 'Business Justification',
            required: false,
            placeholder: 'Why is this access needed?',
          },
        ];

      case 'OTHER':
        return [
          {
            name: 'issueType',
            type: 'text',
            label: 'Issue Type',
            required: false,
            placeholder: 'Type of issue or request',
          },
          {
            name: 'businessImpact',
            type: 'textarea',
            label: 'Business Impact',
            required: false,
            placeholder: 'How does this affect business operations?',
          },
          {
            name: 'expectedResolution',
            type: 'text',
            label: 'Expected Resolution',
            required: false,
            placeholder: 'What would resolve this issue?',
          },
        ];

      default:
        return [];
    }
  }
}
