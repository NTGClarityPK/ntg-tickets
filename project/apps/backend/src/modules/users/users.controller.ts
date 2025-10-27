import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserRole } from '@prisma/client';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);
    return {
      data: user,
      message: 'User created successfully',
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all users with pagination and filtering' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'role', required: false, enum: UserRole })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('role') role?: UserRole,
    @Query('isActive') isActive?: boolean
  ) {
    const result = await this.usersService.findAll({
      page,
      limit,
      search,
      role,
      isActive,
    });
    return {
      data: result.data,
      pagination: result.pagination,
      message: 'Users retrieved successfully',
    };
  }

  @Get('support-staff')
  @ApiOperation({ summary: 'Get all support staff users' })
  @ApiResponse({
    status: 200,
    description: 'Support staff retrieved successfully',
  })
  async getSupportStaff() {
    const users = await this.usersService.getSupportStaff();
    return {
      data: users,
      message: 'Support staff retrieved successfully',
    };
  }

  @Get('support-managers')
  @ApiOperation({ summary: 'Get all support manager users' })
  @ApiResponse({
    status: 200,
    description: 'Support managers retrieved successfully',
  })
  async getSupportManagers() {
    const users = await this.usersService.getSupportManagers();
    return {
      data: users,
      message: 'Support managers retrieved successfully',
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findOne(id);
    return {
      data: user,
      message: 'User retrieved successfully',
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    const user = await this.usersService.update(id, updateUserDto);
    return {
      data: user,
      message: 'User updated successfully',
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deactivate user (soft delete)' })
  @ApiResponse({ status: 200, description: 'User deactivated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async remove(@Param('id') id: string) {
    const user = await this.usersService.remove(id);
    return {
      data: user,
      message: 'User deactivated successfully',
    };
  }
}
