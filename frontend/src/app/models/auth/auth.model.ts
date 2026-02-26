import { User } from '@models/user.model';

export interface AuthResponse {
  user: User;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  displayName?: string;
  avatarEmoji?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}
