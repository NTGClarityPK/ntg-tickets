import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../../database/supabase.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(private supabase: SupabaseService) {}

  async create(createCategoryDto: CreateCategoryDto) {
    try {
      this.logger.log('Creating category with data:', JSON.stringify(createCategoryDto, null, 2));
      
      const { data: category, error } = await this.supabase.client
        .from('categories')
        .insert({
          name: createCategoryDto.name,
          custom_name: createCategoryDto.customName,
          description: createCategoryDto.description,
          is_active: createCategoryDto.isActive ?? true,
          created_by: createCategoryDto.createdBy!,
        })
        .select(`
          *,
          subcategories:subcategories (*)
        `)
        .single();

      if (error) {
        this.logger.error('Error creating category:', error);
        throw error;
      }

      this.logger.log(`Category created successfully: ${category.name}`);
      return this.mapCategory(category);
    } catch (error) {
      this.logger.error('Error creating category:', error);
      throw error;
    }
  }

  async findAll() {
    try {
      const { data: categories, error } = await this.supabase.client
        .from('categories')
        .select(`
          *,
          subcategories:subcategories (*)
        `)
        .order('is_active', { ascending: false })
        .order('name', { ascending: true });

      if (error) {
        this.logger.error('Error finding categories:', error);
        throw error;
      }

      // Sort subcategories
      const sortedCategories = (categories || []).map(cat => ({
        ...this.mapCategory(cat),
        subcategories: (cat.subcategories || []).sort((a, b) => a.name.localeCompare(b.name)),
      }));

      return sortedCategories;
    } catch (error) {
      this.logger.error('Error finding categories:', error);
      throw error;
    }
  }

  async findActive() {
    try {
      const { data: categories, error } = await this.supabase.client
        .from('categories')
        .select(`
          *,
          subcategories:subcategories!inner (*)
        `)
        .eq('is_active', true)
        .eq('subcategories.is_active', true)
        .order('name', { ascending: true });

      if (error) {
        this.logger.error('Error finding active categories:', error);
        throw error;
      }

      // Filter and sort subcategories
      const sortedCategories = (categories || []).map(cat => ({
        ...this.mapCategory(cat),
        subcategories: (cat.subcategories || [])
          .filter(sub => sub.is_active)
          .sort((a, b) => a.name.localeCompare(b.name)),
      }));

      return sortedCategories;
    } catch (error) {
      this.logger.error('Error finding active categories:', error);
      throw error;
    }
  }

  async findOne(id: string) {
    try {
      const { data: category, error } = await this.supabase.client
        .from('categories')
        .select(`
          *,
          subcategories:subcategories (*)
        `)
        .eq('id', id)
        .single();

      if (error || !category) {
        throw new NotFoundException('Category not found');
      }

      // Filter and sort subcategories
      const sortedSubcategories = (category.subcategories || [])
        .filter(sub => sub.is_active)
        .sort((a, b) => a.name.localeCompare(b.name));

      return {
        ...this.mapCategory(category),
        subcategories: sortedSubcategories,
      };
    } catch (error) {
      this.logger.error('Error finding category:', error);
      throw error;
    }
  }

  async findByEnumName(name: string) {
    try {
      const { data: category, error } = await this.supabase.client
        .from('categories')
        .select(`
          *,
          subcategories:subcategories (*)
        `)
        .eq('name', name)
        .limit(1)
        .single();

      if (error || !category) {
        return null;
      }

      // Filter and sort subcategories
      const sortedSubcategories = (category.subcategories || [])
        .filter(sub => sub.is_active)
        .sort((a, b) => a.name.localeCompare(b.name));

      return {
        ...this.mapCategory(category),
        subcategories: sortedSubcategories,
      };
    } catch (error) {
      this.logger.error('Error finding category by enum name:', error);
      return null;
    }
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    try {
      // Convert camelCase to snake_case for update
      const updateData: any = {};
      if (updateCategoryDto.customName !== undefined) updateData.custom_name = updateCategoryDto.customName;
      if (updateCategoryDto.isActive !== undefined) updateData.is_active = updateCategoryDto.isActive;
      if (updateCategoryDto.description !== undefined) updateData.description = updateCategoryDto.description;
      updateData.updated_at = new Date().toISOString();

      const { data: category, error } = await this.supabase.client
        .from('categories')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          subcategories:subcategories (*)
        `)
        .single();

      if (error) {
        this.logger.error('Error updating category:', error);
        throw error;
      }

      this.logger.log(`Category updated: ${category.name}`);
      return this.mapCategory(category);
    } catch (error) {
      this.logger.error('Error updating category:', error);
      throw error;
    }
  }

  async remove(id: string) {
    try {
      const { data: category, error } = await this.supabase.client
        .from('categories')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        this.logger.error('Error deactivating category:', error);
        throw error;
      }

      this.logger.log(`Category deactivated: ${category.name}`);
      return this.mapCategory(category);
    } catch (error) {
      this.logger.error('Error deactivating category:', error);
      throw error;
    }
  }

  async getSubcategoriesByCategory(categoryId: string) {
    try {
      const { data: subcategories, error } = await this.supabase.client
        .from('subcategories')
        .select('*')
        .eq('category_id', categoryId)
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) {
        this.logger.error('Error getting subcategories:', error);
        throw error;
      }

      return (subcategories || []).map(this.mapSubcategory);
    } catch (error) {
      this.logger.error('Error getting subcategories:', error);
      throw error;
    }
  }

  async getSubcategoriesByCategoryName(categoryName: string) {
    try {
      const { data: category, error } = await this.supabase.client
        .from('categories')
        .select('id')
        .eq('name', categoryName)
        .limit(1)
        .single();

      if (error || !category) {
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

  /**
   * Map Supabase snake_case to camelCase for API compatibility
   */
  private mapCategory(category: any) {
    return {
      id: category.id,
      name: category.name,
      customName: category.custom_name,
      description: category.description,
      isActive: category.is_active,
      createdAt: category.created_at,
      updatedAt: category.updated_at,
      createdBy: category.created_by,
      subcategories: category.subcategories || [],
    };
  }

  /**
   * Map Supabase subcategory snake_case to camelCase
   */
  private mapSubcategory(subcategory: any) {
    return {
      id: subcategory.id,
      categoryId: subcategory.category_id,
      name: subcategory.name,
      description: subcategory.description,
      isActive: subcategory.is_active,
      createdAt: subcategory.created_at,
      updatedAt: subcategory.updated_at,
      createdBy: subcategory.created_by,
    };
  }
}
