export type Role = 'HDNet Viewer' | 'HDNet Cancel';

export interface User {
  username: string;
  displayName: string;
  roles: Role[];
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  user: User;
}

export interface AuthSession {
  accessToken: string;
  user: User;
}