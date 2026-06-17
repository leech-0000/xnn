/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserProfile, DietLog, FitProject, FitTask, WeightEntry } from "./types";

// Helper for dynamic local dates
function getRelativeDateStr(daysOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const date = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${date}`;
}

export const initialProfile: UserProfile = {
  name: "林佳萱",
  gender: "female",
  age: 26,
  height: 0,
  weight: 0,
  dailyWaterGoal: 2000,
  dailyTdeeGoal: 1650
};

export const initialDietLogs: DietLog[] = [
  {
    id: "today_log",
    userId: "default_user",
    date: getRelativeDateStr(-2), // Dynamic two days ago
    foods: [
      {
        id: "food1",
        name: "7-11 茶葉蛋",
        calories: 75,
        carbs: 1,
        protein: 7,
        fat: 5,
        timestamp: "08:15"
      },
      {
        id: "food2",
        name: "烤地瓜 (大)",
        calories: 140,
        carbs: 32,
        protein: 2,
        fat: 0,
        timestamp: "08:20"
      },
      {
        id: "food3",
        name: "無糖豆漿 (中杯)",
        calories: 110,
        carbs: 4,
        protein: 10,
        fat: 5,
        timestamp: "12:10"
      },
      {
        id: "food4",
        name: "舒肥雞胸肉生菜沙拉",
        calories: 280,
        carbs: 12,
        protein: 28,
        fat: 8,
        timestamp: "12:15"
      },
      {
        id: "food5",
        name: "香蕉 (中)",
        calories: 90,
        carbs: 23,
        protein: 1,
        fat: 0,
        timestamp: "16:00"
      }
    ],
    totalCalories: 695,
    totalCarbs: 72,
    totalProtein: 48,
    totalFat: 18
  },
  {
    id: "yesterday_log",
    userId: "default_user",
    date: getRelativeDateStr(-1), // Dynamic Yesterday's date
    foods: [
      {
        id: "food_y1",
        name: "美式黑咖啡",
        calories: 15,
        carbs: 1,
        protein: 0,
        fat: 0,
        timestamp: "08:00"
      },
      {
        id: "food_y2",
        name: "鮪魚三明治",
        calories: 310,
        carbs: 42,
        protein: 14,
        fat: 9,
        timestamp: "08:10"
      },
      {
        id: "food_y3",
        name: "清蒸肉圓 (二顆)",
        calories: 360,
        carbs: 60,
        protein: 12,
        fat: 8,
        timestamp: "12:45"
      },
      {
        id: "food_y4",
        name: "清炒花椰菜雞丁餐盒",
        calories: 450,
        carbs: 45,
        protein: 35,
        fat: 11,
        timestamp: "18:40"
      },
      {
        id: "food_y5",
        name: "微糖手搖高山青茶",
        calories: 80,
        carbs: 20,
        protein: 0,
        fat: 0,
        timestamp: "19:30"
      }
    ],
    totalCalories: 1215,
    totalCarbs: 168,
    totalProtein: 61,
    totalFat: 28
  }
];

export const initialProjects: FitProject[] = [
  {
    id: "p1",
    userId: "default_user",
    name: "夏季海灘身材消脂計畫 (-5kg)",
    status: "ongoing",
    dueDate: getRelativeDateStr(30),
    createdAt: getRelativeDateStr(-30)
  },
  {
    id: "p2",
    userId: "default_user",
    name: "核心力量提升與肌耐力強化計畫",
    status: "ongoing",
    dueDate: getRelativeDateStr(45),
    createdAt: getRelativeDateStr(-10)
  },
  {
    id: "p3",
    userId: "default_user",
    name: "每日 2500ml 水分充足新陳代謝專案",
    status: "completed",
    dueDate: getRelativeDateStr(-5),
    createdAt: getRelativeDateStr(-40)
  }
];

export const initialTasks: FitTask[] = [
  {
    id: "t1",
    userId: "default_user",
    title: "每日晨跑 30 分鐘或有氧訓練",
    completed: true,
    dueDate: getRelativeDateStr(0),
    createdAt: getRelativeDateStr(-1)
  },
  {
    id: "t2",
    userId: "default_user",
    title: "攝取充足蛋白質 (目標 80g)",
    completed: false,
    dueDate: getRelativeDateStr(0),
    createdAt: getRelativeDateStr(-1)
  },
  {
    id: "t3",
    userId: "default_user",
    title: "完成 10 分鐘核心棒式維持",
    completed: false,
    dueDate: getRelativeDateStr(0),
    createdAt: getRelativeDateStr(-1)
  },
  {
    id: "t4",
    userId: "default_user",
    title: "睡前深度拉伸或瑜珈放鬆",
    completed: true,
    dueDate: getRelativeDateStr(-1),
    createdAt: getRelativeDateStr(-1)
  }
];

// Both height and weight begin at 0, weight history starts empty as requested
export const initialWeights: WeightEntry[] = [];
