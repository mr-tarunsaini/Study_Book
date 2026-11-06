import { describe, it, expect } from 'vitest';
import { convertMarksToGrade } from '../pages/CalculatorPage';

export const calculateSgpa = (
  subjects: { credit: number }[],
  grades: Record<number, string>
): number => {
  let totalCreditPoints = 0;
  let totalCredits = 0;

  subjects.forEach((sub, idx) => {
    const val = grades[idx] || '';
    const { point } = convertMarksToGrade(val);
    totalCreditPoints += point * sub.credit;
    totalCredits += sub.credit;
  });

  if (totalCredits <= 0) return 0;
  const sgpa = totalCreditPoints / totalCredits;
  return Math.min(10, Math.max(0, parseFloat(sgpa.toFixed(2))));
};

describe('AKTU GPA Calculator Logic with A-F Grades', () => {
  it('converts percentage marks (0-100) to A, B, C, D, E, F grades and points', () => {
    // Clamps > 100 to 100 (Grade A, Point 10)
    expect(convertMarksToGrade('150')).toEqual({ grade: 'A', point: 10 });
    expect(convertMarksToGrade('95')).toEqual({ grade: 'A', point: 10 });
    expect(convertMarksToGrade('82')).toEqual({ grade: 'B', point: 9 });
    expect(convertMarksToGrade('75')).toEqual({ grade: 'C', point: 8 });
    expect(convertMarksToGrade('64')).toEqual({ grade: 'D', point: 7 });
    expect(convertMarksToGrade('52')).toEqual({ grade: 'E', point: 5 });
    expect(convertMarksToGrade('32')).toEqual({ grade: 'F', point: 0 });
  });

  it('converts letter grades (A, B, C, D, E, F) to grade points', () => {
    expect(convertMarksToGrade('A')).toEqual({ grade: 'A', point: 10 });
    expect(convertMarksToGrade('B')).toEqual({ grade: 'B', point: 9 });
    expect(convertMarksToGrade('C')).toEqual({ grade: 'C', point: 8 });
    expect(convertMarksToGrade('D')).toEqual({ grade: 'D', point: 7 });
    expect(convertMarksToGrade('E')).toEqual({ grade: 'E', point: 5 });
    expect(convertMarksToGrade('F')).toEqual({ grade: 'F', point: 0 });
  });

  it('calculates weighted SGPA correctly and never exceeds 10.0', () => {
    const subjects = [
      { credit: 4 }, // Math (grade A = 10) -> 40
      { credit: 4 }, // Physics (grade B = 9) -> 36
      { credit: 2 }, // Lab (grade C = 8) -> 16
    ];
    // Total points = 40 + 36 + 16 = 92; Total credits = 10; SGPA = 9.20
    const grades = { 0: 'A', 1: 'B', 2: 'C' };
    expect(calculateSgpa(subjects, grades)).toBe(9.20);

    // Max cap test (all 100s)
    const maxGrades = { 0: '100', 1: '100', 2: '100' };
    expect(calculateSgpa(subjects, maxGrades)).toBe(10.00);
  });
});
