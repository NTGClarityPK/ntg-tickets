import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateSavedSearchDto } from './dto/create-saved-search.dto';
import { UpdateSavedSearchDto } from './dto/update-saved-search.dto';

@Injectable()
export class SavedSearchesService {
  private readonly logger = new Logger(SavedSearchesService.name);

  constructor(private prisma: PrismaService) {}

  async create(createSavedSearchDto: CreateSavedSearchDto, userId: string) {
    try {
      const savedSearch = await this.prisma.savedSearch.create({
        data: {
          ...createSavedSearchDto,
          userId,
          searchCriteria: JSON.stringify(createSavedSearchDto.searchCriteria),
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      this.logger.log(`Saved search created: ${savedSearch.name}`);
      return savedSearch;
    } catch (error) {
      this.logger.error('Error creating saved search:', error);
      throw error;
    }
  }

  async findAll(userId: string, includePublic: boolean = true) {
    try {
      const where: { OR: Array<{ userId: string } | { isPublic: boolean }> } = {
        OR: [
          { userId }, // User's own searches
        ],
      };

      if (includePublic) {
        where.OR.push({ isPublic: true }); // Public searches
      }

      const savedSearches = await this.prisma.savedSearch.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: [
          { userId: 'asc' }, // User's own searches first
          { createdAt: 'desc' },
        ],
      });

      // Parse search criteria for each saved search
      return savedSearches.map(search => ({
        ...search,
        searchCriteria: JSON.parse(search.searchCriteria),
      }));
    } catch (error) {
      this.logger.error('Error finding saved searches:', error);
      throw error;
    }
  }

  async findOne(id: string, userId: string) {
    try {
      const savedSearch = await this.prisma.savedSearch.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      if (!savedSearch) {
        throw new NotFoundException('Saved search not found');
      }

      // Check if user can access this search
      if (savedSearch.userId !== userId && !savedSearch.isPublic) {
        throw new ForbiddenException('Access denied to this saved search');
      }

      return {
        ...savedSearch,
        searchCriteria: JSON.parse(savedSearch.searchCriteria),
      };
    } catch (error) {
      this.logger.error('Error finding saved search:', error);
      throw error;
    }
  }

  async update(
    id: string,
    updateSavedSearchDto: UpdateSavedSearchDto,
    userId: string
  ) {
    try {
      const existingSearch = await this.prisma.savedSearch.findUnique({
        where: { id },
      });

      if (!existingSearch) {
        throw new NotFoundException('Saved search not found');
      }

      if (existingSearch.userId !== userId) {
        throw new ForbiddenException(
          'You can only update your own saved searches'
        );
      }

      const updateData: Record<string, unknown> = { ...updateSavedSearchDto };

      if (updateSavedSearchDto.searchCriteria) {
        updateData.searchCriteria = JSON.stringify(
          updateSavedSearchDto.searchCriteria
        );
      }

      const savedSearch = await this.prisma.savedSearch.update({
        where: { id },
        data: updateData,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      this.logger.log(`Saved search updated: ${savedSearch.name}`);
      return {
        ...savedSearch,
        searchCriteria: JSON.parse(savedSearch.searchCriteria),
      };
    } catch (error) {
      this.logger.error('Error updating saved search:', error);
      throw error;
    }
  }

  async remove(id: string, userId: string) {
    try {
      const existingSearch = await this.prisma.savedSearch.findUnique({
        where: { id },
      });

      if (!existingSearch) {
        throw new NotFoundException('Saved search not found');
      }

      if (existingSearch.userId !== userId) {
        throw new ForbiddenException(
          'You can only delete your own saved searches'
        );
      }

      await this.prisma.savedSearch.delete({
        where: { id },
      });

      this.logger.log(`Saved search deleted: ${existingSearch.name}`);
      return { message: 'Saved search deleted successfully' };
    } catch (error) {
      this.logger.error('Error deleting saved search:', error);
      throw error;
    }
  }

  async executeSavedSearch(
    id: string,
    userId: string,
    page: number = 1,
    limit: number = 20
  ) {
    try {
      const savedSearch = await this.findOne(id, userId);

      // This would typically call the tickets service with the saved search criteria
      // For now, we'll return the search criteria that can be used by the frontend
      return {
        searchCriteria: savedSearch.searchCriteria,
        pagination: {
          page,
          limit,
        },
      };
    } catch (error) {
      this.logger.error('Error executing saved search:', error);
      throw error;
    }
  }

  async getPopularSearches(limit: number = 10) {
    try {
      // Get most used public searches
      const popularSearches = await this.prisma.savedSearch.findMany({
        where: {
          isPublic: true,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
      });

      return popularSearches.map(search => ({
        ...search,
        searchCriteria: JSON.parse(search.searchCriteria),
      }));
    } catch (error) {
      this.logger.error('Error getting popular searches:', error);
      throw error;
    }
  }

  async duplicateSearch(id: string, userId: string, newName?: string) {
    try {
      const originalSearch = await this.findOne(id, userId);

      const duplicatedSearch = await this.prisma.savedSearch.create({
        data: {
          name: newName || `${originalSearch.name} (Copy)`,
          description: originalSearch.description,
          searchCriteria: JSON.stringify(originalSearch.searchCriteria),
          isPublic: false, // Duplicated searches are private by default
          userId,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      this.logger.log(`Saved search duplicated: ${duplicatedSearch.name}`);
      return {
        ...duplicatedSearch,
        searchCriteria: JSON.parse(duplicatedSearch.searchCriteria),
      };
    } catch (error) {
      this.logger.error('Error duplicating saved search:', error);
      throw error;
    }
  }
}
