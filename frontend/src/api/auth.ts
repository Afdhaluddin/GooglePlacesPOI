import { request } from './client';
import type { AuthResponse, RegisterResponse } from '../types';

/** POST /auth/register {username,password} → 201 {id,username} */
export function register(username: string, password: string): Promise<RegisterResponse> {
  return request<RegisterResponse>(
    '/auth/register',
    { method: 'POST', body: JSON.stringify({ username, password }) },
    { auth: false }
  );
}

/** POST /auth/login {username,password} → 200 {token} */
export function login(username: string, password: string): Promise<AuthResponse> {
  return request<AuthResponse>(
    '/auth/login',
    { method: 'POST', body: JSON.stringify({ username, password }) },
    { auth: false }
  );
}
