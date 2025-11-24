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
  ParseUUIDPipe,
  Request,
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
import { GetUsersQueryDto } from './dto/get-users-query.dto';
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
  async findAll(@Query() query: GetUsersQueryDto) {
    const result = await this.usersService.findAll(query);
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

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findOne(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
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
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req,
  ) {
    // Pass current user ID to prevent self-admin removal
    const user = await this.usersService.update(id, updateUserDto, req.user?.id);
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
  async remove(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    const user = await this.usersService.remove(id);
    return {
      data: user,
      message: 'User deactivated successfully',
    };
  }
}
