import { describe, it, expect } from 'vitest';
import sentenceCase from '@/utils/sentenceCase';

describe('sentenceCase util', () => {
  it('converts strings to sentence case', () => {
    expect(sentenceCase('hello world')).toBe('Hello world');
    expect(sentenceCase('SENTENCE CASE')).toBe('Sentence case');
    expect(sentenceCase('mIxEd CaSe StRiNg')).toBe('Mixed case string');
    expect(sentenceCase('single')).toBe('Single');
    expect(sentenceCase('')).toBe('');
    expect(sentenceCase(undefined)).toBeUndefined();
    expect(sentenceCase('with_underscores')).toBe('With underscores');
  });
});
