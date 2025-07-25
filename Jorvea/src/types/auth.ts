import { User } from 'firebase/auth';

export interface AuthUser extends User {}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignUpCredentials extends LoginCredentials {
  confirmPassword?: string;
}
