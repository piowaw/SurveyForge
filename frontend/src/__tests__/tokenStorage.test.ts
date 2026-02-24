/**
 * Unit tests for the token storage helpers.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { getToken, setToken, removeToken } from '@/lib/tokenStorage';

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe('tokenStorage', () => {
  it('returns null when no token is stored', () => {
    expect(getToken()).toBeNull();
  });

  it('stores token in sessionStorage when remember=false', () => {
    setToken('abc123', false);
    expect(sessionStorage.getItem('auth_token')).toBe('abc123');
    expect(localStorage.getItem('auth_token')).toBeNull();
    expect(getToken()).toBe('abc123');
  });

  it('stores token in localStorage when remember=true', () => {
    setToken('abc123', true);
    expect(localStorage.getItem('auth_token')).toBe('abc123');
    expect(sessionStorage.getItem('auth_token')).toBeNull();
    expect(localStorage.getItem('auth_remember')).toBe('1');
    expect(getToken()).toBe('abc123');
  });

  it('clears previous storage when switching remember mode', () => {
    setToken('first', true);
    expect(localStorage.getItem('auth_token')).toBe('first');

    setToken('second', false);
    expect(localStorage.getItem('auth_token')).toBeNull();
    expect(sessionStorage.getItem('auth_token')).toBe('second');
  });

  it('removeToken clears both storages', () => {
    setToken('tok', true);
    removeToken();
    expect(getToken()).toBeNull();
    expect(localStorage.getItem('auth_remember')).toBeNull();
  });
});
