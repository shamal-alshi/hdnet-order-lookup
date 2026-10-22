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

export type OrderStatus =
  | 'RECEIVED'
  | 'PROCESSING'
  | 'SENT_TO_PHARMACY'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED';

export interface Order {
  orderNumber: string;
  orderDate: string;
  status: OrderStatus;
  rxCount: number;
  shipToState: string;
  lastUpdated: string;
}

export interface OrdersResponse {
  items: Order[];
  page: number;
  size: number;
  totalItems: number;
}