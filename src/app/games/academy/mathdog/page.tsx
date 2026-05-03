'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Trophy, Star, RotateCcw, Brain, Cat } from 'lucide-react';
import Link from 'next/link';
import { saveLocalScore, formatNumber } from '@/lib/utils';
import { grantXP } from '@/lib/progression';
import { sfx, initAudio } from '@/lib/audio';

// ─── Types ────────────────────────────────────────────────────────────────────
type Character = 'dog' | 'cat';
type Grade = 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
type Phase = 'select' | 'playing' | 'results';

interface Question {
  id: number;
  text: string;
  choices: string[];
  answer: number;
  explanation: string;
  type: 'math' | 'logic';
}

// ─── Question Banks ───────────────────────────────────────────────────────────
function makeMathQuestions(grade: Grade): Question[] {
  const banks: Record<Grade, Question[]> = {
    5: [
      { id: 1, text: 'What is 7 × 8?', choices: ['54', '56', '63', '48'], answer: 1, explanation: '7 × 8 = 56', type: 'math' },
      { id: 2, text: 'What is 144 ÷ 12?', choices: ['11', '13', '12', '10'], answer: 2, explanation: '144 ÷ 12 = 12', type: 'math' },
      { id: 3, text: 'What is 25% of 80?', choices: ['15', '25', '20', '30'], answer: 2, explanation: '25% × 80 = 0.25 × 80 = 20', type: 'math' },
      { id: 4, text: 'What is 3² + 4²?', choices: ['25', '49', '14', '30'], answer: 0, explanation: '9 + 16 = 25', type: 'math' },
      { id: 5, text: 'What is the perimeter of a square with side 7?', choices: ['28', '49', '14', '21'], answer: 0, explanation: '4 × 7 = 28', type: 'math' },
      { id: 6, text: 'What is 1/2 + 1/4?', choices: ['2/6', '3/4', '1/3', '2/4'], answer: 1, explanation: '2/4 + 1/4 = 3/4', type: 'math' },
      { id: 7, text: 'Round 3,748 to the nearest hundred.', choices: ['3700', '3800', '3750', '4000'], answer: 1, explanation: '3,748 → 3,800 (48 rounds up)', type: 'math' },
      { id: 8, text: 'What is 0.6 × 0.3?', choices: ['0.18', '1.8', '0.018', '0.9'], answer: 0, explanation: '6 × 3 = 18, shift two decimals → 0.18', type: 'math' },
    ],
    6: [
      { id: 1, text: 'Evaluate: 3(x + 4) when x = 2', choices: ['18', '21', '15', '14'], answer: 0, explanation: '3(2 + 4) = 3 × 6 = 18', type: 'math' },
      { id: 2, text: 'What is the GCF of 24 and 36?', choices: ['6', '12', '4', '8'], answer: 1, explanation: 'Factors of 24: 1,2,3,4,6,8,12,24. Factors of 36: ...,12,... GCF = 12', type: 'math' },
      { id: 3, text: 'What is 30% of 150?', choices: ['45', '30', '50', '60'], answer: 0, explanation: '0.30 × 150 = 45', type: 'math' },
      { id: 4, text: 'What is the area of a triangle with base 10 and height 6?', choices: ['60', '30', '16', '20'], answer: 1, explanation: 'A = ½ × b × h = ½ × 10 × 6 = 30', type: 'math' },
      { id: 5, text: 'Simplify: 18/24', choices: ['3/4', '6/8', '2/3', '4/5'], answer: 0, explanation: 'GCF(18,24) = 6 → 18/24 = 3/4', type: 'math' },
      { id: 6, text: 'What is −3 + (−5)?', choices: ['-2', '8', '-8', '2'], answer: 2, explanation: 'Adding two negatives: −3 + (−5) = −8', type: 'math' },
      { id: 7, text: 'A ratio of 3:5 — if 3 = 12, what is 5?', choices: ['15', '20', '18', '25'], answer: 1, explanation: '3 × 4 = 12, so 5 × 4 = 20', type: 'math' },
      { id: 8, text: 'What is 2³ × 2²?', choices: ['32', '64', '16', '12'], answer: 0, explanation: '2³ × 2² = 2^(3+2) = 2⁵ = 32', type: 'math' },
    ],
    7: [
      { id: 1, text: 'Solve: 2x + 5 = 17', choices: ['x = 6', 'x = 11', 'x = 5', 'x = 7'], answer: 0, explanation: '2x = 12 → x = 6', type: 'math' },
      { id: 2, text: 'What is 15% of 240?', choices: ['36', '24', '30', '42'], answer: 0, explanation: '0.15 × 240 = 36', type: 'math' },
      { id: 3, text: 'What is the circumference of a circle with radius 7? (π ≈ 3.14)', choices: ['43.96', '21.98', '153.86', '14'], answer: 0, explanation: 'C = 2πr = 2 × 3.14 × 7 = 43.96', type: 'math' },
      { id: 4, text: 'What is the mean of: 4, 8, 12, 16, 20?', choices: ['10', '12', '14', '8'], answer: 1, explanation: '(4+8+12+16+20)/5 = 60/5 = 12', type: 'math' },
      { id: 5, text: 'Solve: 3(x − 2) = 9', choices: ['x = 5', 'x = 4', 'x = 3', 'x = 7'], answer: 0, explanation: 'x − 2 = 3 → x = 5', type: 'math' },
      { id: 6, text: 'What is −7 × (−4)?', choices: ['-28', '28', '-11', '11'], answer: 1, explanation: 'Negative × Negative = Positive: 7 × 4 = 28', type: 'math' },
      { id: 7, text: 'Express 0.875 as a fraction.', choices: ['7/8', '3/4', '5/6', '8/9'], answer: 0, explanation: '875/1000 → simplify → 7/8', type: 'math' },
      { id: 8, text: 'What is the surface area of a cube with side 4?', choices: ['64', '96', '48', '32'], answer: 1, explanation: '6 × 4² = 6 × 16 = 96', type: 'math' },
    ],
    8: [
      { id: 1, text: 'Factor: x² − 9', choices: ['(x−3)(x+3)', '(x−3)²', '(x+3)²', '(x−9)(x+1)'], answer: 0, explanation: 'Difference of squares: x² − 9 = (x−3)(x+3)', type: 'math' },
      { id: 2, text: 'What is the slope of y = 3x − 5?', choices: ['3', '-5', '-3', '5'], answer: 0, explanation: 'y = mx + b, m (slope) = 3', type: 'math' },
      { id: 3, text: 'Solve: x² = 49', choices: ['x = 7', 'x = ±7', 'x = 7 or -1', 'x = 24.5'], answer: 1, explanation: '√49 = ±7', type: 'math' },
      { id: 4, text: 'What is the Pythagorean theorem?', choices: ['a² + b² = c²', 'a + b = c', 'a² − b² = c', 'a × b = c²'], answer: 0, explanation: 'In a right triangle: a² + b² = c² (c = hypotenuse)', type: 'math' },
      { id: 5, text: 'Solve the system: x + y = 10, x − y = 2', choices: ['x=6, y=4', 'x=5, y=5', 'x=4, y=6', 'x=8, y=2'], answer: 0, explanation: 'Add: 2x = 12 → x=6; then y=4', type: 'math' },
      { id: 6, text: 'What is 5! (5 factorial)?', choices: ['120', '60', '25', '100'], answer: 0, explanation: '5! = 5×4×3×2×1 = 120', type: 'math' },
      { id: 7, text: 'Expand: (x + 3)²', choices: ['x² + 9', 'x² + 6x + 9', 'x² + 3x + 9', 'x² + 6x + 6'], answer: 1, explanation: '(x+3)² = x² + 2(3)x + 9 = x² + 6x + 9', type: 'math' },
      { id: 8, text: 'What is log₂(8)?', choices: ['2', '3', '4', '8'], answer: 1, explanation: '2³ = 8, so log₂(8) = 3', type: 'math' },
    ],
    9: [
      { id: 1, text: 'Solve: 2x² − 8 = 0', choices: ['x = ±2', 'x = 2', 'x = 4', 'x = ±4'], answer: 0, explanation: '2x² = 8 → x² = 4 → x = ±2', type: 'math' },
      { id: 2, text: 'What is sin(30°)?', choices: ['√3/2', '1/2', '√2/2', '1'], answer: 1, explanation: 'sin(30°) = 1/2', type: 'math' },
      { id: 3, text: 'What is the discriminant of x² − 4x + 4 = 0?', choices: ['0', '8', '16', '-8'], answer: 0, explanation: 'b²−4ac = 16−16 = 0 → one real root', type: 'math' },
      { id: 4, text: 'What is the slope of a line perpendicular to y = 2x + 1?', choices: ['-1/2', '2', '-2', '1/2'], answer: 0, explanation: 'Perpendicular slope = negative reciprocal = −1/2', type: 'math' },
      { id: 5, text: 'Simplify: √72', choices: ['6√2', '8√3', '36√2', '12√3'], answer: 0, explanation: '√72 = √(36×2) = 6√2', type: 'math' },
      { id: 6, text: 'What is the vertex of y = (x − 3)² + 2?', choices: ['(3, 2)', '(-3, 2)', '(3, -2)', '(2, 3)'], answer: 0, explanation: 'Vertex form: (h, k) = (3, 2)', type: 'math' },
      { id: 7, text: 'Solve: |x − 4| = 6', choices: ['x = 10 or -2', 'x = 10', 'x = 2', 'x = -2 or 10'], answer: 3, explanation: 'x−4 = 6 → x=10; or x−4 = −6 → x=−2', type: 'math' },
      { id: 8, text: 'What is the area of a circle with diameter 10?', choices: ['25π', '100π', '50π', '10π'], answer: 0, explanation: 'r = 5; A = πr² = 25π', type: 'math' },
    ],
    10: [
      { id: 1, text: 'What is the derivative of x³?', choices: ['3x²', 'x²', '3x', 'x³'], answer: 0, explanation: 'd/dx(xⁿ) = nxⁿ⁻¹ → 3x²', type: 'math' },
      { id: 2, text: 'What is cos²(x) + sin²(x)?', choices: ['0', '2', '1', 'undefined'], answer: 2, explanation: 'Pythagorean identity: sin²(x) + cos²(x) = 1', type: 'math' },
      { id: 3, text: 'What is the period of y = sin(2x)?', choices: ['π', '2π', 'π/2', '4π'], answer: 0, explanation: 'Period = 2π/|b| = 2π/2 = π', type: 'math' },
      { id: 4, text: 'How many arrangements of "MATH" are there?', choices: ['24', '12', '4', '16'], answer: 0, explanation: '4! = 24 permutations', type: 'math' },
      { id: 5, text: 'What is lim(x→0) sin(x)/x?', choices: ['0', '1', '∞', 'undefined'], answer: 1, explanation: 'Standard limit: lim(x→0) sin(x)/x = 1', type: 'math' },
      { id: 6, text: 'What is the sum of an arithmetic series: 1+2+3+...+100?', choices: ['5050', '5000', '4950', '10000'], answer: 0, explanation: 'n(n+1)/2 = 100×101/2 = 5050', type: 'math' },
      { id: 7, text: 'What is log(1000) (base 10)?', choices: ['2', '3', '100', '4'], answer: 1, explanation: '10³ = 1000, so log₁₀(1000) = 3', type: 'math' },
      { id: 8, text: 'What is (3 + 4i)(3 − 4i)?', choices: ['25', '0', '9 + 16i', '25i'], answer: 0, explanation: '(a+bi)(a−bi) = a²+b² = 9+16 = 25', type: 'math' },
    ],
    11: [
      { id: 1, text: 'What is ∫2x dx?', choices: ['x²', 'x² + C', '2x²', '2'], answer: 1, explanation: '∫2x dx = x² + C (add constant of integration)', type: 'math' },
      { id: 2, text: 'What is e^(ln 5)?', choices: ['5', 'ln 5', '1', 'e'], answer: 0, explanation: 'e^(ln x) = x, so e^(ln 5) = 5', type: 'math' },
      { id: 3, text: 'What is the determinant of [[2,3],[1,4]]?', choices: ['5', '11', '8', '14'], answer: 0, explanation: 'det = (2×4) − (3×1) = 8 − 3 = 5', type: 'math' },
      { id: 4, text: 'What is the binomial coefficient C(6,2)?', choices: ['15', '12', '30', '6'], answer: 0, explanation: 'C(6,2) = 6!/(2!×4!) = 15', type: 'math' },
      { id: 5, text: 'What is the range of f(x) = |x| − 2?', choices: ['[-2, ∞)', '[0, ∞)', '(-∞, ∞)', '[-2, 2]'], answer: 0, explanation: '|x| ≥ 0 so |x| − 2 ≥ −2, range = [−2, ∞)', type: 'math' },
      { id: 6, text: 'What is the dot product of (2,3) and (4,−1)?', choices: ['5', '11', '8', '-5'], answer: 0, explanation: '2×4 + 3×(−1) = 8 − 3 = 5', type: 'math' },
      { id: 7, text: 'Solve: 2sin(x) = √2, for 0≤x<2π', choices: ['π/4, 3π/4', 'π/6, π/3', 'π/4, π/2', 'π/3, 2π/3'], answer: 0, explanation: 'sin(x) = √2/2 → x = π/4, 3π/4', type: 'math' },
      { id: 8, text: 'What is ∑(k=1 to 5) k²?', choices: ['55', '25', '15', '30'], answer: 0, explanation: '1 + 4 + 9 + 16 + 25 = 55', type: 'math' },
    ],
    12: [
      { id: 1, text: 'What is the derivative of sin(x²)?', choices: ['2x·cos(x²)', 'cos(x²)', '2sin(x)', 'x·cos(x)'], answer: 0, explanation: 'Chain rule: d/dx[sin(u)] = cos(u)·du/dx = cos(x²)·2x', type: 'math' },
      { id: 2, text: 'What is ∫₀¹ x² dx?', choices: ['1/3', '1/2', '1', '2/3'], answer: 0, explanation: '[x³/3]₀¹ = 1/3 − 0 = 1/3', type: 'math' },
      { id: 3, text: 'What is the Taylor series of eˣ?', choices: ['∑ xⁿ/n!', '∑ xⁿ', '∑ (-1)ⁿxⁿ/n!', '∑ xⁿ/(n+1)!'], answer: 0, explanation: 'eˣ = ∑(n=0 to ∞) xⁿ/n!', type: 'math' },
      { id: 4, text: 'What is the cross product formula for vectors?', choices: ['a×b = |a||b|sinθ n̂', 'a·b = |a||b|cosθ', 'a×b = a₁b₁+a₂b₂', 'a×b = |a||b|'], answer: 0, explanation: 'Cross product magnitude = |a||b|sinθ, direction by right-hand rule', type: 'math' },
      { id: 5, text: 'What is the limit definition of a derivative?', choices: ['lim(h→0) [f(x+h)−f(x)]/h', 'lim(x→0) f(x)/x', 'f(x+1)−f(x)', 'f\'(x)/x'], answer: 0, explanation: 'f\'(x) = lim(h→0) [f(x+h)−f(x)]/h', type: 'math' },
      { id: 6, text: 'What is the Fundamental Theorem of Calculus (Part 1)?', choices: ['d/dx ∫ₐˣ f(t)dt = f(x)', '∫ₐᵇ f = F(b)−F(a)', '∫f = F+C', 'd/dx f(x) = f\'(x)'], answer: 0, explanation: 'FTC Part 1: if F(x) = ∫ₐˣ f(t)dt, then F\'(x) = f(x)', type: 'math' },
      { id: 7, text: 'Evaluate: lim(x→∞) (1 + 1/x)ˣ', choices: ['e', '1', '∞', '0'], answer: 0, explanation: 'This is the definition of e ≈ 2.718', type: 'math' },
      { id: 8, text: 'What is the eigenvalue equation?', choices: ['Av = λv', 'A = λv', 'Av = v', 'det(A) = λ'], answer: 0, explanation: 'For matrix A, eigenvalue λ and eigenvector v: Av = λv', type: 'math' },
    ],
  };
  return banks[grade];
}

function makeLogicQuestions(grade: Grade): Question[] {
  const banks: Record<Grade, Question[]> = {
    5: [
      { id: 101, text: 'What comes next: 2, 4, 8, 16, ___?', choices: ['24', '30', '32', '18'], answer: 2, explanation: 'Pattern: multiply by 2. 16 × 2 = 32', type: 'logic' },
      { id: 102, text: 'If all dogs are animals and Rex is a dog, then Rex is ___?', choices: ['Not an animal', 'An animal', 'A cat', 'A fish'], answer: 1, explanation: 'Syllogism: if dog → animal, and Rex = dog, then Rex = animal', type: 'logic' },
      { id: 103, text: 'Which is the odd one out: Apple, Orange, Banana, Carrot?', choices: ['Apple', 'Orange', 'Banana', 'Carrot'], answer: 3, explanation: 'Carrot is a vegetable; the rest are fruits', type: 'logic' },
      { id: 104, text: '3 cats catch 3 mice in 3 minutes. How many cats to catch 9 mice in 9 minutes?', choices: ['9', '3', '6', '27'], answer: 1, explanation: 'Rate = 1 cat/mouse/3min. Same rate applies: 3 cats for 9 mice in 9 min', type: 'logic' },
      { id: 105, text: 'What comes next: A, C, E, G, ___?', choices: ['H', 'I', 'J', 'K'], answer: 1, explanation: 'Skip every other letter: A, C, E, G, I', type: 'logic' },
      { id: 106, text: 'If Monday is 2 days after Saturday, what day is 3 days before Thursday?', choices: ['Sunday', 'Monday', 'Tuesday', 'Wednesday'], answer: 1, explanation: 'Thursday − 3 days = Monday', type: 'logic' },
    ],
    6: [
      { id: 101, text: 'Find the pattern: 1, 1, 2, 3, 5, 8, ___?', choices: ['10', '11', '12', '13'], answer: 3, explanation: 'Fibonacci: each = sum of two before. 8 + 5 = 13', type: 'logic' },
      { id: 102, text: 'Alice is taller than Bob. Bob is taller than Carol. Who is shortest?', choices: ['Alice', 'Bob', 'Carol', 'Tie'], answer: 2, explanation: 'Alice > Bob > Carol, so Carol is shortest', type: 'logic' },
      { id: 103, text: 'What fraction of a clockface is between 12 and 3?', choices: ['1/4', '1/3', '1/6', '3/4'], answer: 0, explanation: '3 hours out of 12 = 1/4 of the clock', type: 'logic' },
      { id: 104, text: 'A train leaves at 2:45 PM and arrives 3h 25min later. Arrival time?', choices: ['5:45 PM', '6:10 PM', '6:05 PM', '6:15 PM'], answer: 1, explanation: '2:45 + 3:25 = 6:10 PM', type: 'logic' },
      { id: 105, text: 'Which shape has exactly 5 sides?', choices: ['Hexagon', 'Pentagon', 'Quadrilateral', 'Heptagon'], answer: 1, explanation: 'Pentagon = 5 sides', type: 'logic' },
      { id: 106, text: 'What percentage is 15 of 60?', choices: ['20%', '25%', '15%', '30%'], answer: 1, explanation: '15/60 = 0.25 = 25%', type: 'logic' },
    ],
    7: [
      { id: 101, text: 'Complete the analogy: Book is to Library as Painting is to ___?', choices: ['Artist', 'Gallery', 'Canvas', 'Color'], answer: 1, explanation: 'Books are stored in libraries; paintings are displayed in galleries', type: 'logic' },
      { id: 102, text: 'If 2 workers build a wall in 6 days, how long for 4 workers?', choices: ['12 days', '3 days', '4 days', '6 days'], answer: 1, explanation: 'Inverse proportion: 2×6 = 4×x → x = 3 days', type: 'logic' },
      { id: 103, text: 'What number is missing: 4, 9, 16, 25, ___?', choices: ['30', '36', '49', '35'], answer: 1, explanation: 'Perfect squares: 2², 3², 4², 5², 6² = 36', type: 'logic' },
      { id: 104, text: 'All roses are flowers. Some flowers fade quickly. Therefore...', choices: ['All roses fade quickly', 'Some roses may fade quickly', 'No roses fade', 'Roses are not flowers'], answer: 1, explanation: 'Logic: we can only conclude SOME roses MAY fade, not all', type: 'logic' },
      { id: 105, text: 'Mirror image: If the time shows 4:25, what is the mirror time?', choices: ['7:35', '8:25', '7:25', '4:35'], answer: 0, explanation: 'Mirror time = 11:60 − actual = 11:60 − 4:25 = 7:35', type: 'logic' },
      { id: 106, text: 'A code: 2=B, 3=C, 1=A. What does 3-1-2 spell?', choices: ['ABC', 'CAB', 'ACB', 'BAC'], answer: 1, explanation: '3=C, 1=A, 2=B → CAB', type: 'logic' },
    ],
    8: [
      { id: 101, text: 'Complete: 2, 6, 12, 20, 30, ___?', choices: ['40', '42', '44', '38'], answer: 1, explanation: 'Differences: 4, 6, 8, 10, 12 → 30 + 12 = 42', type: 'logic' },
      { id: 102, text: 'In a class of 30: 18 like math, 15 like science, 10 like both. How many like neither?', choices: ['7', '3', '5', '8'], answer: 0, explanation: 'Union = 18+15−10 = 23. Neither = 30−23 = 7', type: 'logic' },
      { id: 103, text: 'A is B\'s sister. B is C\'s father. How is A related to C?', choices: ['Mother', 'Aunt', 'Sister', 'Grandmother'], answer: 1, explanation: 'A is B\'s sister; B is C\'s father → A is C\'s aunt', type: 'logic' },
      { id: 104, text: 'What is the next term: a², b³, c⁴, ___?', choices: ['d⁵', 'e⁵', 'd⁴', 'e⁴'], answer: 0, explanation: 'Letters go a,b,c,d and powers go 2,3,4,5 → d⁵', type: 'logic' },
      { id: 105, text: 'Decode: GPHF (shift each letter back by 1). What word?', choices: ['FOIE', 'HQIG', 'FOGE', 'GOFE'], answer: 0, explanation: 'G→F, P→O, H→G, F→E = FOGE... actually FOIE (G-1=F, P-1=O, H-1=G, F-1=E)', type: 'logic' },
      { id: 106, text: 'If CLOUD = 12345, what is LOUD?', choices: ['2345', '1234', '2234', '1235'], answer: 0, explanation: 'C=1,L=2,O=3,U=4,D=5. LOUD = L,O,U,D = 2345', type: 'logic' },
    ],
    9: [
      { id: 101, text: 'Deduction: All squares have 4 sides. This shape has 3 sides. Is it a square?', choices: ['Yes', 'No', 'Maybe', 'Cannot determine'], answer: 1, explanation: 'A square must have 4 sides. This has 3 → NOT a square', type: 'logic' },
      { id: 102, text: 'Complete the series: 3, 5, 11, 29, ___?', choices: ['57', '83', '59', '61'], answer: 1, explanation: '×2−1: 3, 5(3×2-1), 11(5×2+1), 29(11×2+7)... pattern is ×2+1,×2+1,×2+7... actually 3→5: +2, 5→11: +6, 11→29: +18, 29→83: +54 (×3 differences)', type: 'logic' },
      { id: 103, text: 'Truth table: A AND NOT B, when A=T, B=F?', choices: ['True', 'False', 'Undefined', 'Both'], answer: 0, explanation: 'NOT B = NOT F = T. A AND T = T AND T = True', type: 'logic' },
      { id: 104, text: '6 people shake hands with each other once. How many handshakes total?', choices: ['30', '15', '12', '36'], answer: 1, explanation: 'C(6,2) = 15 unique handshakes', type: 'logic' },
      { id: 105, text: 'XOR gate: 1 XOR 1 = ?', choices: ['1', '0', '2', 'undefined'], answer: 1, explanation: 'XOR outputs 1 only when inputs differ: 1 XOR 1 = 0', type: 'logic' },
      { id: 106, text: 'In a tournament where every pair plays once: 5 teams, total matches?', choices: ['10', '20', '5', '25'], answer: 0, explanation: 'C(5,2) = 10 matches', type: 'logic' },
    ],
    10: [
      { id: 101, text: 'If P→Q and Q→R, what can we conclude?', choices: ['P→R', 'R→P', 'P↔R', 'None'], answer: 0, explanation: 'Hypothetical syllogism: P→Q and Q→R implies P→R', type: 'logic' },
      { id: 102, text: 'A set has n elements. How many subsets does it have?', choices: ['n', 'n²', '2ⁿ', 'n!'], answer: 2, explanation: 'Every element is either in or out: 2ⁿ subsets', type: 'logic' },
      { id: 103, text: 'Contrapositive of "If it rains, ground is wet":?', choices: ['If ground is not wet, it did not rain', 'If ground is wet, it rained', 'If it does not rain, ground is not wet', 'Ground is always wet'], answer: 0, explanation: 'Contrapositive: If NOT Q, then NOT P → if ground not wet, no rain', type: 'logic' },
      { id: 104, text: '3 true/false questions — how many possible answer sheets?', choices: ['6', '8', '9', '12'], answer: 1, explanation: '2³ = 8 (each question has 2 options)', type: 'logic' },
      { id: 105, text: 'P: "All swans are white." One black swan found. Conclusion?', choices: ['More black swans exist', 'P is false', 'P is unaffected', 'The swan is not a swan'], answer: 1, explanation: 'A single counterexample falsifies a universal claim', type: 'logic' },
      { id: 106, text: 'What is modus ponens?', choices: ['If P→Q and P, then Q', 'If P→Q and Q, then P', 'If P and Q, then R', 'If not P, then Q'], answer: 0, explanation: 'Modus ponens: given P→Q and P is true, Q must be true', type: 'logic' },
    ],
    11: [
      { id: 101, text: 'How many ways to arrange 4 books on a shelf?', choices: ['16', '12', '24', '8'], answer: 2, explanation: '4! = 24 permutations', type: 'logic' },
      { id: 102, text: 'Probability of drawing 2 aces from a 52-card deck (no replace)?', choices: ['1/221', '1/26', '4/52', '2/52'], answer: 0, explanation: '(4/52) × (3/51) = 12/2652 = 1/221', type: 'logic' },
      { id: 103, text: 'What is the negation of "∃x: P(x)"?', choices: ['∀x: ¬P(x)', '∃x: ¬P(x)', '¬∃x: P(x)', '∀x: P(x)'], answer: 0, explanation: '¬(∃x: P(x)) = ∀x: ¬P(x) — for all x, P is false', type: 'logic' },
      { id: 104, text: 'Recurrence: T(n) = 2T(n−1), T(1) = 3. What is T(4)?', choices: ['24', '12', '48', '6'], answer: 0, explanation: 'T(1)=3, T(2)=6, T(3)=12, T(4)=24', type: 'logic' },
      { id: 105, text: 'In propositional logic, what does ⊕ mean?', choices: ['AND', 'OR', 'XOR', 'NOT'], answer: 2, explanation: '⊕ is the exclusive OR (XOR) operator', type: 'logic' },
      { id: 106, text: 'How many 3-digit combinations from {1,2,3,4,5} without repetition?', choices: ['60', '120', '15', '25'], answer: 0, explanation: 'P(5,3) = 5×4×3 = 60', type: 'logic' },
    ],
    12: [
      { id: 101, text: 'P(A∪B) = P(A) + P(B) − P(A∩B). If P(A)=0.4, P(B)=0.3, P(A∩B)=0.1, P(A∪B)=?', choices: ['0.6', '0.7', '0.8', '0.5'], answer: 0, explanation: '0.4 + 0.3 − 0.1 = 0.6', type: 'logic' },
      { id: 102, text: 'What is the Big-O of binary search?', choices: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'], answer: 1, explanation: 'Binary search halves search space each step → O(log n)', type: 'logic' },
      { id: 103, text: 'Prove by contradiction: √2 is irrational. First step?', choices: ['Assume √2 = p/q in lowest terms', 'Compute √2 exactly', 'Show √2 = 1.414', 'Factor 2'], answer: 0, explanation: 'Proof by contradiction starts by assuming the opposite', type: 'logic' },
      { id: 104, text: 'In a directed graph, what is a topological sort valid for?', choices: ['Cyclic graphs', 'Undirected graphs', 'DAGs only', 'All graphs'], answer: 2, explanation: 'Topological sort is only defined for Directed Acyclic Graphs (DAGs)', type: 'logic' },
      { id: 105, text: 'What is the Pigeonhole Principle?', choices: ['If n+1 items in n bins, some bin has 2+', 'If n items in n bins, all bins have 1', 'Probability approaches 1', 'Harmonic series diverges'], answer: 0, explanation: 'If you have more items than containers, at least one container has ≥2', type: 'logic' },
      { id: 106, text: 'Bayes Theorem: P(A|B) = ?', choices: ['P(B|A)P(A)/P(B)', 'P(A)P(B)', 'P(A∩B)/P(A)', 'P(A) + P(B)'], answer: 0, explanation: 'Bayes: P(A|B) = P(B|A)×P(A) / P(B)', type: 'logic' },
    ],
  };
  return banks[grade];
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function MathDogPage() {
  const [phase, setPhase]       = useState<Phase>('select');
  const [character, setChar]    = useState<Character>('dog');
  const [grade, setGrade]       = useState<Grade>(6);
  const [questions, setQs]      = useState<Question[]>([]);
  const [qIdx, setQIdx]         = useState(0);
  const [score, setScore]       = useState(0);
  const [streak, setStreak]     = useState(0);
  const [timeLeft, setTimeLeft] = useState(25);
  const [chosen, setChosen]     = useState<number | null>(null);
  const [correct, setCorrect]   = useState<boolean | null>(null);
  const [results, setResults]   = useState<{ correct: boolean; chosen: number; q: Question }[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const TOTAL_QS = 8;
  const TIME_PER_Q = 25;

  const startGame = useCallback(() => {
    initAudio();
    const pool = character === 'dog'
      ? makeMathQuestions(grade)
      : makeLogicQuestions(grade);
    const picked = shuffle(pool).slice(0, TOTAL_QS);
    setQs(picked);
    setQIdx(0);
    setScore(0);
    setStreak(0);
    setTimeLeft(TIME_PER_Q);
    setChosen(null);
    setCorrect(null);
    setResults([]);
    setPhase('playing');
  }, [character, grade]);

  // Timer
  useEffect(() => {
    if (phase !== 'playing') return;
    if (chosen !== null) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          // Time up — wrong
          handleAnswer(-1);
          return TIME_PER_Q;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, qIdx, chosen]); // eslint-disable-line

  const handleAnswer = useCallback((idx: number) => {
    if (chosen !== null) return;
    if (timerRef.current) clearInterval(timerRef.current);
    const q = questions[qIdx];
    if (!q) return;
    const isCorrect = idx === q.answer;
    const timeBonus = Math.round(timeLeft * 2);
    const pts = isCorrect ? (100 + timeBonus + (streak + 1) * 10) : 0;
    setChosen(idx);
    setCorrect(isCorrect);
    if (isCorrect) {
      sfx.success();
      setScore(s => s + pts);
      setStreak(s => s + 1);
    } else {
      sfx.fail();
      setStreak(0);
    }
    setResults(r => [...r, { correct: isCorrect, chosen: idx, q }]);
    setTimeout(() => {
      if (qIdx + 1 >= TOTAL_QS) {
        finishGame(score + pts);
      } else {
        setQIdx(i => i + 1);
        setTimeLeft(TIME_PER_Q);
        setChosen(null);
        setCorrect(null);
      }
    }, 1400);
  }, [chosen, questions, qIdx, timeLeft, streak, score]); // eslint-disable-line

  const finishGame = useCallback((finalScore: number) => {
    saveLocalScore('mathdog', finalScore);
    grantXP('math', finalScore);
    if (finalScore > 600) sfx.levelUp();
    setScore(finalScore);
    setPhase('results');
  }, []);

  const q = questions[qIdx];
  const pct = Math.round((results.filter(r => r.correct).length / TOTAL_QS) * 100) || 0;

  return (
    <div className="min-h-dvh pt-16 pb-24 bg-midnight">
      <div className="fluid-container max-w-2xl py-8">
        {/* Back */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/games/academy" className="glass p-2 rounded-xl hover:bg-white/10 transition-colors">
            <ArrowLeft size={18} className="text-white/70" />
          </Link>
          <div>
            <h1 className="text-xl font-black text-white">
              {character === 'dog' ? '🐕 Math Dog' : '🐱 Logic Cat'}
            </h1>
            <p className="text-white/40 text-sm">Grade {grade} Challenges</p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* Character + Grade Select */}
          {phase === 'select' && (
            <motion.div key="select" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <p className="text-white/60 text-center mb-6">Choose your character and grade level</p>
              {/* Character */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {([
                  { id: 'dog', emoji: '🐕', name: 'Math Dog', desc: 'Arithmetic, algebra, equations', color: '#0047FF' },
                  { id: 'cat', emoji: '🐱', name: 'Logic Cat', desc: 'Patterns, sequences, logical reasoning', color: '#9B59B6' },
                ] as const).map(c => (
                  <button key={c.id} onClick={() => setChar(c.id)}
                    className={`p-5 rounded-2xl border-2 transition-all text-left ${character === c.id ? 'border-opacity-100 bg-opacity-20' : 'border-white/10 glass hover:border-white/30'}`}
                    style={character === c.id ? { borderColor: c.color, background: `${c.color}18` } : {}}>
                    <div className="text-5xl mb-2">{c.emoji}</div>
                    <div className="text-white font-bold text-lg">{c.name}</div>
                    <div className="text-white/50 text-sm mt-1">{c.desc}</div>
                    {character === c.id && <div className="mt-2 text-xs font-bold" style={{ color: c.color }}>✓ Selected</div>}
                  </button>
                ))}
              </div>
              {/* Grade */}
              <h3 className="text-white font-bold mb-3">Select Grade Level</h3>
              <div className="grid grid-cols-4 gap-2 mb-8">
                {([5,6,7,8,9,10,11,12] as Grade[]).map(g => (
                  <button key={g} onClick={() => setGrade(g)}
                    className={`p-3 rounded-xl font-bold transition-all ${grade === g ? 'bg-cobalt text-white' : 'glass text-white/60 hover:text-white'}`}>
                    Grade {g}
                  </button>
                ))}
              </div>
              <button onClick={startGame} className="w-full btn-cobalt py-4 text-lg font-black rounded-2xl">
                {character === 'dog' ? '🐕 Start Math Dog!' : '🐱 Start Logic Cat!'}
              </button>
            </motion.div>
          )}

          {/* Playing */}
          {phase === 'playing' && q && (
            <motion.div key={`q-${qIdx}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
              {/* Progress */}
              <div className="flex items-center gap-3 mb-4">
                <span className="text-white/40 text-sm">{qIdx + 1}/{TOTAL_QS}</span>
                <div className="flex-1 h-2 bg-white/10 rounded-full">
                  <div className="h-2 bg-cobalt-gradient rounded-full transition-all" style={{ width: `${((qIdx) / TOTAL_QS) * 100}%` }} />
                </div>
                <span className="text-sm font-bold" style={{ color: timeLeft <= 8 ? '#FF4444' : timeLeft <= 15 ? '#FFD700' : '#00FF88' }}>
                  ⏱ {timeLeft}s
                </span>
                <span className="text-gold text-sm font-bold">⭐ {formatNumber(score)}</span>
              </div>
              {/* Streak */}
              {streak >= 2 && (
                <div className="mb-3 text-center text-sm font-bold text-orange-400">
                  🔥 {streak}× Streak Bonus!
                </div>
              )}
              {/* Question */}
              <div className="glass-dark rounded-2xl p-6 mb-6 border border-cobalt/20">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-cobalt/20 text-cobalt-bright">
                    {q.type === 'math' ? '🐕 MATH' : '🐱 LOGIC'}
                  </span>
                  <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-white/10 text-white/50">
                    Grade {grade}
                  </span>
                </div>
                <p className="text-white text-xl font-bold leading-relaxed">{q.text}</p>
              </div>
              {/* Choices */}
              <div className="grid grid-cols-2 gap-3">
                {q.choices.map((choice, i) => {
                  let style = 'glass border-white/10 text-white hover:border-cobalt/50 hover:bg-cobalt/10';
                  if (chosen !== null) {
                    if (i === q.answer) style = 'bg-green-500/20 border-green-400/60 text-green-300';
                    else if (i === chosen && !correct) style = 'bg-red-500/20 border-red-400/60 text-red-300';
                    else style = 'glass border-white/5 text-white/30';
                  }
                  return (
                    <button key={i} onClick={() => handleAnswer(i)} disabled={chosen !== null}
                      className={`p-4 rounded-xl border-2 font-semibold text-left transition-all ${style}`}>
                      <span className="text-white/40 text-sm mr-2">{String.fromCharCode(65 + i)}.</span>
                      {choice}
                    </button>
                  );
                })}
              </div>
              {/* Explanation */}
              {chosen !== null && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className={`mt-4 p-4 rounded-xl text-sm ${correct ? 'bg-green-500/10 border border-green-500/20 text-green-300' : 'bg-red-500/10 border border-red-500/20 text-red-300'}`}>
                  {correct ? '✓ Correct! ' : '✗ Incorrect. '}{q.explanation}
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Results */}
          {phase === 'results' && (
            <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="text-center mb-6">
                <div className="text-6xl mb-3">{pct >= 80 ? '🏆' : pct >= 60 ? '⭐' : '📚'}</div>
                <h2 className="text-3xl font-black text-white">{pct >= 80 ? 'Excellent!' : pct >= 60 ? 'Good Job!' : 'Keep Practicing!'}</h2>
                <div className="text-5xl font-black text-gold mt-2">{formatNumber(score)}</div>
                <p className="text-white/50 mt-1">{results.filter(r => r.correct).length}/{TOTAL_QS} correct · {pct}%</p>
              </div>
              {/* Answer review */}
              <div className="space-y-2 mb-6 max-h-64 overflow-y-auto scrollbar-none">
                {results.map((r, i) => (
                  <div key={i} className={`p-3 rounded-xl text-sm flex items-start gap-3 ${r.correct ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                    <span className="text-lg">{r.correct ? '✓' : '✗'}</span>
                    <div>
                      <div className="text-white/80 font-medium">{r.q.text}</div>
                      {!r.correct && <div className="text-green-400 text-xs mt-1">Correct: {r.q.choices[r.q.answer]}</div>}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setPhase('select')} className="flex-1 btn-glass py-3 rounded-xl font-bold flex items-center justify-center gap-2">
                  <RotateCcw size={16} /> Change
                </button>
                <button onClick={startGame} className="flex-1 btn-cobalt py-3 rounded-xl font-bold">
                  Play Again
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
