import { describe, it, expect } from 'vitest';
import {
  ROUTES,
  STORAGE_KEYS,
  QUERY_KEYS,
  QUESTIONS_BY_SET,
  QUESTIONS_BY_CATEGORY,
  QUIZ_QUESTION_COUNT,
  MOCK_TIME_LIMIT,
  MOCK_PASS_MARK,
  MOCK_TOTAL_QUESTIONS,
  MOCK_WARNING_TIME,
  TOTAL_SIMULATION_MANEUVERS,
} from './constants';

describe('ROUTES', () => {
  it('has a root dashboard route', () => {
    expect(ROUTES.DASHBOARD).toBe('/');
  });

  it('all routes start with /', () => {
    Object.values(ROUTES).forEach((route) => {
      expect(route).toMatch(/^\//);
    });
  });

  it('has unique route values', () => {
    const values = Object.values(ROUTES);
    const unique = new Set(values);
    expect(unique.size).toBe(values.length);
  });
});

describe('STORAGE_KEYS', () => {
  it('quiz progress key is a non-empty string', () => {
    expect(typeof STORAGE_KEYS.QUIZ_PROGRESS).toBe('string');
    expect(STORAGE_KEYS.QUIZ_PROGRESS.length).toBeGreaterThan(0);
  });
});

describe('QUERY_KEYS', () => {
  it('QUESTIONS is an array starting with "questions"', () => {
    expect(QUERY_KEYS.QUESTIONS[0]).toBe('questions');
  });

  it('CATEGORIES is nested under QUESTIONS', () => {
    expect(QUERY_KEYS.CATEGORIES[0]).toBe('questions');
    expect(QUERY_KEYS.CATEGORIES[1]).toBe('categories');
  });
});

describe('QUESTIONS_BY_SET', () => {
  it('returns a tuple starting with questions prefix', () => {
    const key = QUESTIONS_BY_SET('set-1');
    expect(key[0]).toBe('questions');
    expect(key).toContain('set-1');
  });
});

describe('QUESTIONS_BY_CATEGORY', () => {
  it('returns a tuple containing the category', () => {
    const key = QUESTIONS_BY_CATEGORY('traffic-signs');
    expect(key[0]).toBe('questions');
    expect(key).toContain('traffic-signs');
  });
});

describe('Exam configuration constants', () => {
  it('MOCK_TIME_LIMIT is 45 minutes in seconds', () => {
    expect(MOCK_TIME_LIMIT).toBe(45 * 60);
  });

  it('MOCK_WARNING_TIME is 5 minutes in seconds', () => {
    expect(MOCK_WARNING_TIME).toBe(5 * 60);
  });

  it('MOCK_WARNING_TIME is less than MOCK_TIME_LIMIT', () => {
    expect(MOCK_WARNING_TIME).toBeLessThan(MOCK_TIME_LIMIT);
  });

  it('MOCK_PASS_MARK is a reasonable percentage of MOCK_TOTAL_QUESTIONS', () => {
    const passPct = (MOCK_PASS_MARK / MOCK_TOTAL_QUESTIONS) * 100;
    expect(passPct).toBeGreaterThanOrEqual(75);
    expect(passPct).toBeLessThanOrEqual(100);
  });

  it('QUIZ_QUESTION_COUNT is a positive integer', () => {
    expect(QUIZ_QUESTION_COUNT).toBeGreaterThan(0);
    expect(Number.isInteger(QUIZ_QUESTION_COUNT)).toBe(true);
  });

  it('TOTAL_SIMULATION_MANEUVERS is 8', () => {
    expect(TOTAL_SIMULATION_MANEUVERS).toBe(8);
  });
});
