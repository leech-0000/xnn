/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface UserProfile {
  name: string;
  gender: 'male' | 'female' | 'other';
  age: number;
  height: number;
  weight: number;
  dailyWaterGoal: number; // in ml
  dailyTdeeGoal: number;  // in kcal
}

export interface FoodItem {
  id: string;
  name: string;
  calories: number;   // kcal
  carbs: number;      // g
  protein: number;    // g
  fat: number;        // g
  timestamp: string;  // ISO timestamp or HH:MM
}

export interface DietLog {
  id: string; // usually YYYY-MM-DD
  userId: string;
  date: string; // YYYY-MM-DD
  foods: FoodItem[];
  totalCalories: number;
  totalCarbs: number;
  totalProtein: number;
  totalFat: number;
}

export interface FitProject {
  id: string;
  userId: string;
  name: string;
  status: 'ongoing' | 'completed';
  dueDate: string; // YYYY-MM-DD
  createdAt: string;
}

export interface FitTask {
  id: string;
  userId: string;
  title: string;
  completed: boolean;
  dueDate: string; // YYYY-MM-DD
  createdAt: string;
}

export interface WeightEntry {
  id: string; // YYYY-MM-DD string
  userId: string;
  date: string; // YYYY-MM-DD
  weight: number; // in kg
}

export interface WaterLog {
  id: string; // YYYY-MM-DD
  userId: string;
  date: string; // YYYY-MM-DD
  amount: number; // in ml
}

// Helper to get local date (avoiding UTC offset mismatch)
export function getLocalTodayDateStr(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const date = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${date}`;
}

