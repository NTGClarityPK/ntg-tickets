import { User, UserRole } from '../../../types/unified';

export interface UsersListMetrics {
  users: User[];
  totalCount: number;
}

export interface UsersListState {
  searchTerm: string;
  roleFilter: string | null;
  statusFilter: string | null;
  currentPage: number;
  selectedUser: User | null;
  deleteModalOpen: boolean;
}

export interface UsersListColors {
  roleColors: Record<UserRole, string>;
  activeColor: string;
  inactiveColor: string;
}

export interface UsersListHandlers {
  onCreateUser: () => void;
  onViewUser: (userId: string) => void;
  onEditUser: (userId: string) => void;
  onDeleteUser: (userId: string) => void;
  onPageChange: (page: number) => void;
  onSearchChange: (value: string) => void;
  onRoleFilterChange: (value: string | null) => void;
  onStatusFilterChange: (value: string | null) => void;
  onDeleteModalClose: () => void;
}

export interface UsersListPresenterProps {
  metrics: UsersListMetrics;
  state: UsersListState;
  colors: UsersListColors;
  handlers: UsersListHandlers;
  isLoading: boolean;
  error: Error | null;
}

