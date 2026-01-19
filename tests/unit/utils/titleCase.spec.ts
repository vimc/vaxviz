import { describe, it, expect } from 'vitest';
import titleCase from '@/utils/titleCase';

describe('titleCase util', () => {
  it('converts strings to title case', () => {
    expect(titleCase('hello world')).toBe('Hello World');
    expect(titleCase('TITLE CASE')).toBe('Title Case');
    expect(titleCase('mIxEd CaSe StRiNg')).toBe('Mixed Case String');
    expect(titleCase('single')).toBe('Single');
    expect(titleCase('')).toBe('');
    expect(titleCase(undefined)).toBeUndefined();
    expect(titleCase('with_underscores')).toBe('With Underscores');
  });
});
