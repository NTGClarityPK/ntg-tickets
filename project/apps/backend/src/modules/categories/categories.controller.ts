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
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';

@ApiTags('Categories')
@Controller('categories')
@UseGuards(SupabaseAuthGuard)
@ApiBearerAuth()
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  @ApiOperation({ summary: 'Create a new category' })
  @ApiResponse({ status: 201, description: 'Category created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(@Body() createCategoryDto: CreateCategoryDto, @Request() req) {
    console.log('=== CATEGORY CREATE REQUEST ===');
    console.log('Request body:', JSON.stringify(createCategoryDto, null, 2));
    console.log('Request user:', JSON.stringify(req.user, null, 2));
    console.log('User ID:', req.user?.id);
    
    try {
      const category = await this.categoriesService.create({
        ...createCategoryDto,
        createdBy: req.user.id,
      });
      
      console.log('Category created successfully:', category.id);
      return {
        data: category,
        message: 'Category created successfully',
      };
    } catch (error) {
      console.error('Error in categories controller:', error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      // If it's a validation error, provide more details
      if (error.name === 'ValidationError' || error.message?.includes('validation')) {
        console.error('Validation error details:', error);
      }
      
      throw error;
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get all categories (including inactive for admin)' })
  @ApiResponse({
    status: 200,
    description: 'Categories retrieved successfully',
  })
  async findAll() {
    const categories = await this.categoriesService.findAll();
    return {
      data: categories,
      message: 'Categories retrieved successfully',
    };
  }

  @Get('active')
  @ApiOperation({ summary: 'Get only active categories' })
  @ApiResponse({
    status: 200,
    description: 'Active categories retrieved successfully',
  })
  async findActive() {
    const categories = await this.categoriesService.findActive();
    return {
      data: categories,
      message: 'Active categories retrieved successfully',
    };
  }

  @Get('dynamic-fields/:categoryName')
  @ApiOperation({ summary: 'Get dynamic form fields for a category' })
  @ApiResponse({
    status: 200,
    description: 'Dynamic fields retrieved successfully',
  })
  async getDynamicFields(@Param('categoryName') categoryName: string) {
    const fields = await this.categoriesService.getDynamicFields(categoryName);
    return {
      data: fields,
      message: 'Dynamic fields retrieved successfully',
    };
  }

  @Get('subcategories/:categoryName')
  @ApiOperation({ summary: 'Get subcategories for a category' })
  @ApiResponse({
    status: 200,
    description: 'Subcategories retrieved successfully',
  })
  async getSubcategories(@Param('categoryName') categoryName: string) {
    const subcategories =
      await this.categoriesService.getSubcategoriesByCategoryName(categoryName);
    return {
      data: subcategories,
      message: 'Subcategories retrieved successfully',
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get category by ID' })
  @ApiResponse({ status: 200, description: 'Category retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async findOne(@Param('id') id: string) {
    const category = await this.categoriesService.findOne(id);
    return {
      data: category,
      message: 'Category retrieved successfully',
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update category' })
  @ApiResponse({ status: 200, description: 'Category updated successfully' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto
  ) {
    const category = await this.categoriesService.update(id, updateCategoryDto);
    return {
      data: category,
      message: 'Category updated successfully',
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete category' })
  @ApiResponse({ status: 200, description: 'Category deleted successfully' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async remove(@Param('id') id: string) {
    const category = await this.categoriesService.remove(id);
    return {
      data: category,
      message: 'Category deleted successfully',
    };
  }
}
