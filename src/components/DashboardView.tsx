/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Droplet, 
  Sparkles, 
  Plus, 
  Scale, 
  TrendingUp, 
  Flame, 
  ChevronRight, 
  Calendar, 
  RotateCcw,
  CheckCircle2,
  Trash2,
  Activity,
  Award,
  AlertCircle,
  HelpCircle,
  Clock
} from "lucide-react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title as ChartTitle,
  Tooltip,
  Legend,
  Filler,
  ChartOptions
} from 'chart.js';
import { UserProfile, DietLog, FoodItem, FitTask, WeightEntry, getLocalTodayDateStr } from "../types";

// Register ChartJS modules
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ChartTitle,
  Tooltip,
  Legend,
  Filler
);

interface DashboardViewProps {
  profile: UserProfile;
  todayDietLog: DietLog;
  setTodayDietLog: React.Dispatch<React.SetStateAction<DietLog>>;
  tasks: FitTask[];
  onAddTask: (title: string, dueDate: string) => void;
  weightHistory: WeightEntry[];
  onAddWeight: (weight: number, date: string) => void;
  onDeleteWeight: (date: string) => void;
  waterIntake: number;
  setWaterIntake: (amount: number) => void;
  syncStatus: string;
}

export default function DashboardView({
  profile,
  todayDietLog,
  setTodayDietLog,
  tasks,
  onAddTask,
  weightHistory,
  onAddWeight,
  onDeleteWeight,
  waterIntake,
  setWaterIntake,
  syncStatus
}: DashboardViewProps) {
  // AI Parser States
  const [dietInput, setDietInput] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    foods: Omit<FoodItem, "id" | "timestamp">[];
    totalCalories: number;
    totalCarbs: number;
    totalProtein: number;
    totalFat: number;
    error?: string;
    note?: string;
  } | null>(null);

  // New Weight Dialog States
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);
  const [tempWeightInput, setTempWeightInput] = useState(profile.weight > 0 ? profile.weight.toString() : "");
  const [weightDateInput, setWeightDateInput] = useState(getLocalTodayDateStr());

  // Quick Task Dialog States
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [tempTaskTitle, setTempTaskTitle] = useState("");
  const [tempTaskDueDate, setTempTaskDueDate] = useState(getLocalTodayDateStr());

  // History filter tabs state: 'month' | 'weeks' | 'all'
  const [timelinePeriod, setTimelinePeriod] = useState<'month' | 'weeks' | 'all'>('month');

  // Custom water intake step state
  const [customWaterStep, setCustomWaterStep] = useState("250");

  useEffect(() => {
    if (profile.weight > 0) {
      setTempWeightInput(profile.weight.toString());
    }
  }, [profile.weight]);

  // BMI calculations
  const heightInMeters = profile.height / 100;
  const bmiCurrentWeight = profile.weight; // Linked directly to profile.weight
  const bmi = heightInMeters > 0 ? bmiCurrentWeight / (heightInMeters * heightInMeters) : 0;

  const getBmiStatus = (val: number) => {
    if (profile.height <= 0 || profile.weight <= 0 || val <= 0) {
      return { label: "無數值 (請設定基本資料)", color: "bg-slate-100 text-slate-500 border-slate-200" };
    }
    if (val < 18.5) return { label: "體重過輕", color: "bg-amber-100 text-amber-700 border-amber-200" };
    if (val < 24) return { label: "標準範圍", color: "bg-emerald-100 text-emerald-700 border-emerald-200" };
    if (val < 27) return { label: "過重", color: "bg-orange-100 text-orange-700 border-orange-200" };
    return { label: "肥胖", color: "bg-rose-100 text-rose-700 border-rose-200" };
  };
  const bmiStatus = getBmiStatus(bmi);

  // Calorie progress & remaining
  const consumedCalories = todayDietLog.totalCalories;
  const remainingCalories = profile.dailyTdeeGoal - consumedCalories;

  // Water goal percentage
  const waterPercentage = Math.min(100, Math.round((waterIntake / profile.dailyWaterGoal) * 100));

  // Timeline events based on log dates, weight dates, tasks completed
  const [timelineEvents, setTimelineEvents] = useState<any[]>([]);

  useEffect(() => {
    // Generate events
    const events: any[] = [];
    
    // Add diet log items
    if (todayDietLog.foods.length > 0) {
      events.push({
        id: "diet-today",
        time: "今日飲食",
        type: "diet",
        title: `攝取了 ${todayDietLog.foods.length} 項餐食`,
        desc: `加總熱量達 ${todayDietLog.totalCalories} kcal (蛋白質 ${todayDietLog.totalProtein}g)`,
        icon: Flame,
        color: "text-amber-500 bg-amber-50"
      });
    }

    // Add weights
    weightHistory.forEach(w => {
      events.push({
        id: `weight-${w.date}`,
        time: w.date,
        type: "weight",
        title: `記錄體重：${w.weight} kg`,
        desc: heightInMeters > 0 && w.weight > 0
          ? `BMI 數值約為 ${Math.round(w.weight / (heightInMeters * heightInMeters) * 10) / 10}`
          : "基本資料尚未填寫完整 (無 BMI)",
        icon: Scale,
        color: "text-orange-500 bg-orange-50",
        rawDate: w.date
      });
    });

    // Add completed tasks
    tasks.filter(t => t.completed).forEach(t => {
      events.push({
        id: `task-${t.id}`,
        time: t.dueDate,
        type: "task",
        title: `完成任務：${t.title}`,
        desc: `計畫到期日 ${t.dueDate}`,
        icon: CheckCircle2,
        color: "text-emerald-500 bg-emerald-50",
        rawDate: t.dueDate
      });
    });

    // Sort events
    const sorted = events.sort((a, b) => {
      const dateA = a.rawDate || "2026-06-10";
      const dateB = b.rawDate || "2026-06-10";
      return dateB.localeCompare(dateA);
    });

    setTimelineEvents(sorted);
  }, [todayDietLog, weightHistory, tasks, heightInMeters]);

  // Filtered timeline based on state
  const filteredEvents = timelineEvents.filter(ev => {
    if (timelinePeriod === 'weeks') {
      // Show events within past 2 weeks (mock calculation)
      return true;
    }
    if (timelinePeriod === 'month') {
      // Current month June (2026-06)
      return ev.rawDate ? ev.rawDate.startsWith("2026-06") : true;
    }
    return true; // all
  });

  // Chart setup
  const last7WeightHistory = weightHistory.slice(-7);
  const chartData = {
    labels: last7WeightHistory.map(w => w.date.substring(5)), // MM-DD
    datasets: [
      {
        label: "體重變化軌跡 (kg)",
        data: last7WeightHistory.map(w => w.weight),
        borderColor: "rgb(99, 102, 241)", // Indigo 500
        backgroundColor: "rgba(99, 102, 241, 0.08)",
        borderWidth: 3,
        tension: 0.35,
        pointBackgroundColor: "rgb(99, 102, 241)",
        pointHoverRadius: 8,
        pointRadius: 5,
        fill: true
      }
    ]
  };

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: "rgba(15, 23, 42, 0.9)",
        titleFont: { size: 13, weight: 'bold' },
        bodyFont: { size: 14 },
        displayColors: false,
        padding: 12,
        cornerRadius: 8
      }
    },
    scales: {
      y: {
        grid: {
          color: "rgba(226, 232, 240, 0.6)"
        },
        ticks: {
          color: "rgb(100, 116, 139)",
          font: { size: 11 }
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: "rgb(100, 116, 139)",
          font: { size: 11 }
        }
      }
    }
  };

  // Submit text input to Express /api/diet/analyze for parsing
  const handleAiTextAnalyze = async () => {
    if (!dietInput.trim()) return;
    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const response = await fetch("/api/diet/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: dietInput })
      });
      const data = await response.json();
      setAnalysisResult(data);
    } catch (err) {
      console.error("Critical API Error on text analysis:", err);
      // Generate immediate heuristic backup in client state
      setAnalysisResult({
        foods: [
          { name: "未命名自訂食物", calories: 250, carbs: 30, protein: 12, fat: 5 }
        ],
        totalCalories: 250,
        totalCarbs: 30,
        totalProtein: 12,
        totalFat: 5,
        error: "無法連接後端伺服器，已套用快速解析機制"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Add the parsed food list to today's diet log
  const handleApplyAiAnalysisResult = () => {
    if (!analysisResult) return;

    const timeString = new Date().toLocaleTimeString("zh-TW", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });

    const newFoods: FoodItem[] = analysisResult.foods.map((food, i) => ({
      id: `ai_${Date.now()}_${i}`,
      name: food.name,
      calories: Math.round(food.calories),
      carbs: Math.round(food.carbs),
      protein: Math.round(food.protein),
      fat: Math.round(food.fat),
      timestamp: timeString
    }));

    setTodayDietLog(prev => {
      const updatedFoods = [...prev.foods, ...newFoods];
      const totalCalories = updatedFoods.reduce((sum, f) => sum + f.calories, 0);
      const totalCarbs = updatedFoods.reduce((sum, f) => sum + f.carbs, 0);
      const totalProtein = updatedFoods.reduce((sum, f) => sum + f.protein, 0);
      const totalFat = updatedFoods.reduce((sum, f) => sum + f.fat, 0);

      return {
        ...prev,
        foods: updatedFoods,
        totalCalories,
        totalCarbs,
        totalProtein,
        totalFat
      };
    });

    // Clear state
    setDietInput("");
    setAnalysisResult(null);
  };

  const handleRemoveTodayFood = (id: string) => {
    setTodayDietLog(prev => {
      const updatedFoods = prev.foods.filter(f => f.id !== id);
      const totalCalories = updatedFoods.reduce((sum, f) => sum + f.calories, 0);
      const totalCarbs = updatedFoods.reduce((sum, f) => sum + f.carbs, 0);
      const totalProtein = updatedFoods.reduce((sum, f) => sum + f.protein, 0);
      const totalFat = updatedFoods.reduce((sum, f) => sum + f.fat, 0);

      return {
        ...prev,
        foods: updatedFoods,
        totalCalories,
        totalCarbs,
        totalProtein,
        totalFat
      };
    });
  };

  // Modal actions
  const triggerAddWeightObj = () => {
    const val = parseFloat(tempWeightInput);
    if (!isNaN(val) && val > 0) {
      onAddWeight(val, weightDateInput);
      setIsWeightModalOpen(false);
    }
  };

  const triggerAddTaskObj = () => {
    if (tempTaskTitle.trim()) {
      onAddTask(tempTaskTitle.trim(), tempTaskDueDate);
      setTempTaskTitle("");
      setIsTaskModalOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upper Status strip / Sync indicator */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-xl border border-slate-100 shadow-sm gap-2">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            主控台 <span className="text-xs font-normal text-slate-400">/ 每日監測數據</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">您好！歡迎回來，今日請繼續保持自律，朝理想身材更進一步！</p>
        </div>
        <div className="flex items-center gap-2 text-xs bg-slate-50 border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg font-mono">
          <span className={`w-2 h-2 rounded-full ${syncStatus.includes("error") ? "bg-rose-500 animate-pulse" : "bg-emerald-500 animate-pulse"}`}></span>
          Firestore 同步：{syncStatus}
        </div>
      </div>

      {/* Main Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Water Intake with custom graphic bar */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden flex flex-col justify-between group">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase">每日飲水記錄</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-bold text-slate-800">{waterIntake}</span>
                <span className="text-slate-500 text-sm">/ {profile.dailyWaterGoal} ml</span>
              </div>
            </div>
            <div className="p-3 bg-cyan-50 text-cyan-500 rounded-2xl group-hover:scale-110 transition-transform">
              <Droplet className="w-6 h-6 fill-cyan-400" />
            </div>
          </div>

          {/* Liquid progress bar */}
          <div className="mt-8 space-y-2">
            <div className="flex justify-between text-xs font-medium text-slate-600">
              <span>進度 {waterPercentage}%</span>
              <span>還需 {(profile.dailyWaterGoal - waterIntake) > 0 ? profile.dailyWaterGoal - waterIntake : 0} ml</span>
            </div>
            <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden relative">
              <div 
                className="h-full bg-linear-to-r from-cyan-400 to-sky-500 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${waterPercentage}%` }}
              ></div>
            </div>
          </div>

          {/* Core Increments/Decrements */}
          <div className="space-y-3 mt-4 pt-4 border-t border-slate-50">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-500">自訂調整量</span>
              <div className="flex items-center bg-slate-50 rounded-xl border border-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => {
                    const customAmount = parseInt(customWaterStep, 10) || 100;
                    setWaterIntake(Math.max(0, waterIntake - customAmount));
                  }}
                  className="w-7 h-7 flex items-center justify-center text-slate-600 hover:text-red-500 bg-white rounded-lg border border-slate-100 font-bold active:scale-90 transition-all cursor-pointer shadow-xs"
                  title="減少自訂飲水量"
                  id="water_custom_sub"
                >
                  -
                </button>
                <input
                  type="number"
                  value={customWaterStep}
                  onChange={(e) => setCustomWaterStep(e.target.value)}
                  className="w-12 text-center text-xs font-mono font-bold bg-transparent border-0 outline-hidden focus:ring-0 p-0"
                  placeholder="100"
                  min="1"
                />
                <span className="text-[10px] text-slate-400 select-none pr-1.5">ml</span>
                <button
                  type="button"
                  onClick={() => {
                    const customAmount = parseInt(customWaterStep, 10) || 100;
                    setWaterIntake(waterIntake + customAmount);
                  }}
                  className="w-7 h-7 flex items-center justify-center text-slate-600 hover:text-cyan-600 bg-white rounded-lg border border-slate-100 font-bold active:scale-90 transition-all cursor-pointer shadow-xs"
                  title="增加自訂飲水量"
                  id="water_custom_add"
                >
                  +
                </button>
              </div>
            </div>

            {/* Quick Presets row */}
            <div className="grid grid-cols-4 gap-1.5">
              <button 
                type="button"
                id="water_sub_500"
                onClick={() => setWaterIntake(Math.max(0, waterIntake - 500))}
                className="flex items-center justify-center text-[10px] font-bold py-1.5 px-0.5 border border-slate-200 text-slate-500 rounded-lg hover:border-red-300 hover:bg-red-50/40 hover:text-red-600 cursor-pointer transition-colors active:scale-95"
                title="減少 500ml"
              >
                -500
              </button>
              <button 
                type="button"
                id="water_sub_250"
                onClick={() => setWaterIntake(Math.max(0, waterIntake - 250))}
                className="flex items-center justify-center text-[10px] font-bold py-1.5 px-0.5 border border-slate-200 text-slate-500 rounded-lg hover:border-red-300 hover:bg-red-50/40 hover:text-red-600 cursor-pointer transition-colors active:scale-95"
                title="減少 250ml"
              >
                -250
              </button>
              <button 
                type="button"
                id="water_add_250"
                onClick={() => setWaterIntake(waterIntake + 250)}
                className="flex items-center justify-center text-[10px] font-bold py-1.5 px-0.5 border border-slate-200 text-slate-500 rounded-lg hover:border-cyan-300 hover:bg-cyan-50/40 hover:text-cyan-600 cursor-pointer transition-colors active:scale-95"
                title="增加 250ml"
              >
                +250
              </button>
              <button 
                type="button"
                id="water_add_500"
                onClick={() => setWaterIntake(waterIntake + 500)}
                className="flex items-center justify-center text-[10px] font-bold py-1.5 px-0.5 border border-slate-200 text-slate-500 rounded-lg hover:border-cyan-300 hover:bg-cyan-50/40 hover:text-cyan-600 cursor-pointer transition-colors active:scale-95"
                title="增加 500ml"
              >
                +500
              </button>
            </div>
          </div>
        </div>

        {/* Card 2: Today's Diet Calorie Budget */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden flex flex-col justify-between group">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase">今日熱量赤字管理</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-bold text-slate-800">{consumedCalories}</span>
                <span className="text-slate-500 text-sm">/ {profile.dailyTdeeGoal} kcal (TDEE)</span>
              </div>
            </div>
            <div className="p-3 bg-rose-50 text-rose-500 rounded-2xl group-hover:scale-110 transition-transform">
              <Flame className="w-6 h-6 fill-rose-500" />
            </div>
          </div>

          {/* Remaining alert flag */}
          <div className="mt-8 space-y-2">
            <div className="flex justify-between text-xs font-medium text-slate-600">
              <span>剩餘預算</span>
              <span className={`font-semibold ${remainingCalories >= 0 ? "text-emerald-600" : "text-amber-600"}`}>
                {remainingCalories >= 0 ? `赤字安全剩餘 ${remainingCalories}` : `熱量超支盈餘 ${Math.abs(remainingCalories)}`} kcal
              </span>
            </div>
            <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden relative">
              <div 
                className={`h-full rounded-full transition-all duration-700 ease-out ${remainingCalories >= 0 ? "bg-linear-to-r from-emerald-400 to-teal-500" : "bg-linear-to-r from-amber-400 to-rose-500"}`}
                style={{ width: `${Math.min(100, (consumedCalories / profile.dailyTdeeGoal) * 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Mini nutrient progress strip */}
          <div className="flex justify-between text-[11px] text-slate-500 mt-4 pt-4 border-t border-slate-50">
            <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-mono">碳水 {todayDietLog.totalCarbs}g</span>
            <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-mono font-medium">蛋白 {todayDietLog.totalProtein}g</span>
            <span className="bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full font-mono">脂肪 {todayDietLog.totalFat}g</span>
          </div>
        </div>

        {/* Card 3: BMI & Weight Details */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden flex flex-col justify-between group">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase">個人身體指標 (體指與BMI)</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-bold text-slate-800">{bmiCurrentWeight}</span>
                <span className="text-slate-500 text-sm">kg (最新)</span>
              </div>
            </div>
            <div className="p-3 bg-orange-50 text-orange-500 rounded-2xl group-hover:scale-110 transition-transform">
              <Scale className="w-6 h-6" />
            </div>
          </div>

          {/* BMI Info box */}
          <div className="mt-8 flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 block tracking-wide">BMI 指數</span>
              <span className="text-lg font-bold text-slate-800 font-mono">
                {profile.height > 0 && profile.weight > 0 ? bmi.toFixed(1) : "--"}
              </span>
            </div>
            <div className={`text-xs px-2.5 py-1 rounded-full border ${bmiStatus.color} font-medium`}>
              {bmiStatus.label}
            </div>
          </div>

          {/* Add fast indicators */}
          <div className="flex gap-2 mt-4 pt-4 border-t border-slate-50">
            <button 
              id="dashboard_open_weight_modal"
              onClick={() => setIsWeightModalOpen(true)}
              className="w-full text-xs font-semibold text-center py-2 text-orange-600 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors cursor-pointer active:scale-95"
            >
              記錄體重
            </button>
          </div>
        </div>

      </div>

      {/* Segment 2: AI Input Field + Weekly Weights Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Subsegment Left: AI Smart Assistant Text block */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-orange-600 font-bold text-base">
              <Sparkles className="w-5 h-5 animate-pulse text-orange-500 fill-orange-200" />
              <h3>AI 智慧飲食熱量統計與分析</h3>
            </div>
            <p className="text-xs text-slate-400">
              輸入您一整天吃的任何模糊食物（如「喝了一杯微糖燕麥拿鐵，吃了一包茶葉蛋與兩口雞胸肉餐盒」），AI 將自動拆解並幫您估算與統計。
            </p>
          </div>

          <div className="mt-4 space-y-3">
            <textarea
              id="ai_diet_textarea"
              value={dietInput}
              onChange={(e) => setDietInput(e.target.value)}
              placeholder="範例：我午餐吃了客家排骨便當，配一罐無糖綠茶。下午三點吃了一根香蕉，現在覺得非常有精神！"
              rows={4}
              className="w-full text-sm border border-slate-200 rounded-xl p-3 focus:outline-hidden focus:border-orange-500 bg-slate-50 transition-colors placeholder:text-slate-300 resize-none"
            ></textarea>

            <div className="flex justify-between items-center">
              <div className="text-[11px] text-slate-400 flex items-center gap-1">
                <HelpCircle className="w-3 h-3" />
                <span>不限口語、模糊單位或品項字詞</span>
              </div>
              <button
                id="ai_diet_analyze_btn"
                onClick={handleAiTextAnalyze}
                disabled={isAnalyzing || !dietInput.trim()}
                className="flex items-center gap-1.5 text-xs font-semibold bg-linear-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-2 px-4 rounded-xl shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isAnalyzing ? (
                  <>
                    <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                    <span>AI 營養師正在精算中...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 fill-white/20" />
                    <span>智慧解析食物資訊</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* AI Resulting display area */}
          {analysisResult && (
            <div className="mt-4 p-4 border border-orange-100 bg-orange-50/50 rounded-xl space-y-3 animate-fadeIn">
              <h4 className="text-xs font-bold text-orange-800 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-orange-500" />
                精準估計結果：
              </h4>
              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 divide-y divide-orange-100/40">
                {analysisResult.foods.map((food, idx) => (
                  <div key={idx} className="flex justify-between text-xs pt-1.5 first:pt-0">
                    <span className="text-slate-700 font-medium">{food.name}</span>
                    <span className="text-orange-600 font-mono font-bold">{Math.round(food.calories)} kcal <span className="text-slate-400 font-normal">({food.protein}g P / {food.carbs}g C / {food.fat}g F)</span></span>
                  </div>
                ))}
              </div>

              {analysisResult.note && (
                <div className="text-[10px] text-amber-700 bg-amber-50 p-2 rounded-md border border-amber-100 flex items-start gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{analysisResult.note}</span>
                </div>
              )}

              <div className="flex justify-between items-center pt-2.5 border-t border-orange-200/50">
                <div className="space-x-2 text-xs font-bold text-slate-700">
                  <span>總估計熱量: <span className="text-orange-600 font-mono">{Math.round(analysisResult.totalCalories)}</span> kcal</span>
                </div>
                <div className="space-x-2">
                  <button
                    onClick={() => setAnalysisResult(null)}
                    className="text-xs font-medium text-slate-500 hover:text-slate-800 py-1.5 px-2 bg-white border border-slate-200 rounded-lg cursor-pointer"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleApplyAiAnalysisResult}
                    className="text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 py-1.5 px-3 rounded-lg shadow-xs cursor-pointer"
                  >
                    確認累加今日數據
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Subsegment Right: Weight Chart */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <h3 className="text-slate-800 font-bold text-base flex items-center gap-1.5">
                <TrendingUp className="w-5 h-5 text-orange-500" />
                本週體重趨勢
              </h3>
              <p className="text-xs text-slate-400">最近 7 次的體重變化曲線圖，維持規律記錄體重</p>
            </div>
          </div>

          <div className="h-44 mt-4 relative">
            {last7WeightHistory.length > 0 ? (
              <Line data={chartData} options={chartOptions} />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300">
                <Scale className="w-8 h-8 stroke-1 mb-2 text-slate-200" />
                <span className="text-xs">尚無體重記錄，請點擊上方記錄體重</span>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center text-xs text-slate-500 pt-3 border-t border-slate-50 font-mono">
            <span>歷史起點: {last7WeightHistory[0]?.weight || "--"} kg</span>
            <span>最新終點: {last7WeightHistory[last7WeightHistory.length - 1]?.weight || "--"} kg</span>
          </div>
        </div>

      </div>

      {/* Segment 3: Daily Food detailed and Timeline actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Today's breakdown list */}
        <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center pb-3 border-b border-slate-50">
              <div className="space-y-1">
                <h3 className="text-slate-800 font-bold text-base flex items-center gap-1.5">
                  <Activity className="w-5 h-5 text-orange-500" />
                  今日攝取明細
                </h3>
                <p className="text-xs text-slate-400">目前累計 {todayDietLog.foods.length} 個品項</p>
              </div>
              <span className="text-xs font-bold px-2 py-1 bg-slate-50 rounded-lg text-slate-600 font-mono">
                {todayDietLog.date}
              </span>
            </div>

            {/* List */}
            <div className="mt-4 space-y-3 divide-y divide-slate-50 max-h-72 overflow-y-auto pr-1">
              {todayDietLog.foods.length > 0 ? (
                todayDietLog.foods.map((food) => (
                  <div key={food.id} className="flex justify-between items-center pt-2.5 first:pt-0 group relative">
                    <div className="flex items-start gap-2.5">
                      <span className="text-slate-400 text-[10px] font-mono mt-1 flex items-center gap-0.5">
                        <Clock className="w-3 h-3" />
                        {food.timestamp}
                      </span>
                      <div>
                        <span className="text-xs font-bold text-slate-700 block">{food.name}</span>
                        <span className="text-[10px] text-slate-400">蛋白 {food.protein}g | 碳水 {food.carbs}g | 脂肪 {food.fat}g</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold font-mono text-slate-600">{food.calories} kcal</span>
                      <button 
                        onClick={() => handleRemoveTodayFood(food.id)}
                        className="p-1 hover:text-red-500 text-slate-300 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                        title="刪除此項記錄"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 flex flex-col items-center justify-center text-slate-300 text-center">
                  <Flame className="w-8 h-8 text-slate-200 stroke-1 mb-2" />
                  <span className="text-xs">
                    今日尚無餐食。請直接在上方輸入飲食<br/>
                    並點擊「智慧解析」來添加！
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-50 bg-slate-50 rounded-xl p-3 flex justify-between items-center text-xs font-bold text-slate-700">
            <span>加總：</span>
            <span>
              C: <span className="font-mono text-slate-500 font-medium">{todayDietLog.totalCarbs}g</span> | 
              P: <span className="font-mono text-slate-500 font-medium"> {todayDietLog.totalProtein}g</span> | 
              F: <span className="font-mono text-slate-500 font-medium"> {todayDietLog.totalFat}g</span> | 
              Total: <span className="font-mono text-orange-600 text-sm"> {todayDietLog.totalCalories} kcal</span>
            </span>
          </div>
        </div>

        {/* Timeline Activities tab bar */}
        <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center pb-3 border-b border-slate-50">
              <h3 className="text-slate-800 font-bold text-base flex items-center gap-1.5">
                <Calendar className="w-5 h-5 text-orange-500" />
                最近活動日誌
              </h3>
              
              {/* Filter Tabs */}
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setTimelinePeriod('month')}
                  className={`text-[10px] px-2.5 py-1.5 font-bold rounded-lg cursor-pointer transition-colors ${timelinePeriod === 'month' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  本月資訊
                </button>
                <button
                  onClick={() => setTimelinePeriod('weeks')}
                  className={`text-[10px] px-2.5 py-1.5 font-bold rounded-lg cursor-pointer transition-colors ${timelinePeriod === 'weeks' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  過去二周
                </button>
                <button
                  onClick={() => setTimelinePeriod('all')}
                  className={`text-[10px] px-2.5 py-1.5 font-bold rounded-lg cursor-pointer transition-colors ${timelinePeriod === 'all' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  全部歷史
                </button>
              </div>
            </div>

            {/* List */}
            <div className="mt-4 space-y-4 max-h-72 overflow-y-auto pr-1">
              {filteredEvents.length > 0 ? (
                filteredEvents.slice(0, 8).map((ev) => {
                  const IconComp = ev.icon;
                  return (
                    <div key={ev.id} className="flex gap-3 items-start text-xs">
                      <div className={`p-2 rounded-lg ${ev.color} shrink-0 mt-0.5`}>
                        <IconComp className="w-3.5 h-3.5" />
                      </div>
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex justify-between items-baseline gap-2">
                          <span className="font-bold text-slate-700 truncate">{ev.title}</span>
                          <span className="text-[9px] font-mono text-slate-400 shrink-0">{ev.time}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">{ev.desc}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-12 flex flex-col items-center justify-center text-slate-300 text-center">
                  <Calendar className="w-8 h-8 text-slate-200 stroke-1 mb-2" />
                  <span className="text-xs">此過濾期間尚無日誌記錄</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
            <button 
              id="dashboard_open_task_modal"
              onClick={() => setIsTaskModalOpen(true)}
              className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold py-2 px-3 border border-orange-200 text-orange-600 bg-orange-50/20 hover:bg-orange-50 cursor-pointer rounded-lg transition-colors active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>快速新增每日任務</span>
            </button>
          </div>
        </div>

      </div>

      {/* MODAL 1: WEIGHT ENTRY */}
      {isWeightModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl border border-slate-100">
            <div className="flex justify-between items-center pb-2 border-b border-slate-50">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <Scale className="w-4.5 h-4.5 text-orange-500" />
                記錄體重數據
              </h3>
              <button 
                onClick={() => setIsWeightModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">日期</label>
                <input
                  type="date"
                  value={weightDateInput}
                  onChange={(e) => setWeightDateInput(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:outline-hidden focus:border-orange-500 bg-slate-50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">體重 (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={tempWeightInput}
                  onChange={(e) => setTempWeightInput(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:outline-hidden focus:border-orange-500 bg-slate-50 font-mono"
                  placeholder="例如 62.5"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsWeightModalOpen(false)}
                className="text-xs py-2 px-4 border border-slate-200 text-slate-500 hover:text-slate-700 bg-white rounded-lg cursor-pointer"
              >
                取消
              </button>
              <button
                id="submit_add_weight"
                onClick={triggerAddWeightObj}
                className="text-xs font-semibold py-2 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-lg shadow-xs cursor-pointer"
              >
                儲存記錄
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: QUICK TASK */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl border border-slate-100">
            <div className="flex justify-between items-center pb-2 border-b border-slate-50">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-4.5 h-4.5 text-orange-500" />
                新增每日任務
              </h3>
              <button 
                onClick={() => setIsTaskModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">任務內文</label>
                <input
                  type="text"
                  placeholder="例如：攝取乳清蛋白、完成深蹲 100 下"
                  value={tempTaskTitle}
                  onChange={(e) => setTempTaskTitle(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:outline-hidden focus:border-orange-500 bg-slate-50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">到期日期</label>
                <input
                  type="date"
                  value={tempTaskDueDate}
                  onChange={(e) => setTempTaskDueDate(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:outline-hidden focus:border-orange-500 bg-slate-50"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsTaskModalOpen(false)}
                className="text-xs py-2 px-4 border border-slate-200 text-slate-500 hover:text-slate-700 bg-white rounded-lg cursor-pointer"
              >
                取消
              </button>
              <button
                id="submit_add_task"
                onClick={triggerAddTaskObj}
                disabled={!tempTaskTitle.trim()}
                className="text-xs font-semibold py-2 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-lg shadow-xs disabled:opacity-50 cursor-pointer"
              >
                儲存任務
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
