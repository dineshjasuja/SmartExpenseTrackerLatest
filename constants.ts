
import { Budget, Category } from './types';

export const DEFAULT_BUDGETS: Budget[] = [
  { category: 'Food', limit: 15000 },
  { category: 'Transport', limit: 5000 },
  { category: 'Bills', limit: 10000 },
  { category: 'Shopping', limit: 8000 },
  { category: 'Health', limit: 5000 },
  { category: 'Entertainment', limit: 5000 },
  { category: 'Other', limit: 5000 },
];

export const CATEGORY_COLORS: Record<string, string> = {
  'Food': '#4ADE80',
  'Transport': '#60A5FA',
  'Bills': '#FBBF24',
  'Shopping': '#A78BFA',
  'Health': '#F87171',
  'Entertainment': '#F472B6',
  'Other': '#94A3B8',
};

export const getCategoryColor = (category: string): string => {
  return CATEGORY_COLORS[category] || '#6366F1'; // Default indigo color for new categories
};
