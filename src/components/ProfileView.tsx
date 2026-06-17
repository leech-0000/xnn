/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  User, 
  Save, 
  Droplet, 
  Flame, 
  Scale, 
  Sparkles,
  Smile,
  Activity,
  Heart,
  CheckCircle2
} from "lucide-react";
import { UserProfile } from "../types";

interface ProfileViewProps {
  profile: UserProfile;
  onSaveProfile: (profile: UserProfile) => void;
}

export default function ProfileView({
  profile,
  onSaveProfile
}: ProfileViewProps) {
  // Local Form state
  const [name, setName] = useState(profile.name);
  const [gender, setGender] = useState(profile.gender);
  const [age, setAge] = useState(profile.age);
  const [height, setHeight] = useState(profile.height);
  const [weight, setWeight] = useState(profile.weight);
  const [dailyWaterGoal, setDailyWaterGoal] = useState(profile.dailyWaterGoal);
  const [dailyTdeeGoal, setDailyTdeeGoal] = useState(profile.dailyTdeeGoal);

  // Set-up customize checks (if initial goal is not equal to recommended baseline, we assume customized)
  const initHasBase = profile.weight > 0 && profile.height > 0;
  const initRecommendWater = initHasBase ? Math.round(profile.weight * 35) : 2000;
  const initRecommendBmrMap = profile.gender === 'male' 
    ? (10 * profile.weight) + (6.25 * profile.height) - (5 * profile.age) + 5
    : (10 * profile.weight) + (6.25 * profile.height) - (5 * profile.age) - 161;
  const initRecommendTdee = initHasBase ? Math.max(1200, Math.round(initRecommendBmrMap * 1.375)) : 1650;

  const [isWaterGoalCustomized, setIsWaterGoalCustomized] = useState(profile.dailyWaterGoal !== initRecommendWater);
  const [isTdeeGoalCustomized, setIsTdeeGoalCustomized] = useState(profile.dailyTdeeGoal !== initRecommendTdee);

  // Success banner feedback state
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile({
      name,
      gender,
      age: Number(age),
      height: Number(height),
      weight: Number(weight),
      dailyWaterGoal: Number(dailyWaterGoal),
      dailyTdeeGoal: Number(dailyTdeeGoal)
    });
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
    }, 4000);
  };

  // Safe calculations for recommendations based on actual inputs (which may have changed)
  const hasBaseInfo = weight > 0 && height > 0;
  const recommendedWater = hasBaseInfo ? Math.round(weight * 35) : 2000;
  // Harris-Benedict formula basic estimate for recommendations
  const recommendedBmrMap = gender === 'male' 
    ? (10 * weight) + (6.25 * height) - (5 * age) + 5
    : (10 * weight) + (6.25 * height) - (5 * age) - 161;
  const recommendedTdee = hasBaseInfo ? Math.max(1200, Math.round(recommendedBmrMap * 1.375)) : 1650; // Light exercise multiplier

  // Automatically update goals if not customized by user
  useEffect(() => {
    if (!isWaterGoalCustomized) {
      setDailyWaterGoal(recommendedWater);
    }
  }, [recommendedWater, isWaterGoalCustomized]);

  useEffect(() => {
    if (!isTdeeGoalCustomized) {
      setDailyTdeeGoal(recommendedTdee);
    }
  }, [recommendedTdee, isTdeeGoalCustomized]);

  const handleApplyWaterAdvise = () => {
    setDailyWaterGoal(recommendedWater);
    setIsWaterGoalCustomized(false);
  };

  const handleApplyTdeeAdvise = () => {
    setDailyTdeeGoal(recommendedTdee);
    setIsTdeeGoalCustomized(false);
  };

  return (
    <div className="space-y-6">
      {/* View Ribbon */}
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          個人檔案設定 <span className="text-xs font-normal text-slate-400">/ 健康基準管理</span>
        </h2>
        <p className="text-sm text-slate-500 mt-1">更新您的身體特徵指標與每日目標，系統將據此精準演算並即時更新您的 BMI 及每日攝取進度值。</p>
      </div>

      {/* Success notification banner */}
      {showSuccess && (
        <div className="bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-xl p-4 flex items-center gap-3 animate-fadeIn">
          <CheckCircle2 className="w-5.5 h-5.5 text-emerald-500 shrink-0" />
          <div>
            <span className="font-bold text-sm block">變更儲存成功！</span>
            <span className="text-xs opacity-90">您的個人健康基礎信息、TDEE、以及水分目標等數質已全站即時套用。</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left column: Main health edit form */}
        <form onSubmit={handleSubmit} className="lg:col-span-8 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-6">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 pb-3 border-b border-slate-50">
            <User className="w-4.5 h-4.5 text-orange-500" />
            更新核心身體基本設定
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Field: Name */}
            <div className="space-y-1.5 col-span-1">
              <label className="text-xs font-bold text-slate-500">使用者姓名</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:outline-hidden focus:border-orange-500 focus:bg-white transition-all font-medium text-slate-700"
              />
            </div>

            {/* Field: Sex */}
            <div className="space-y-1.5 col-span-1">
              <label className="text-xs font-bold text-slate-500">生理性別</label>
              <div className="grid grid-cols-3 gap-2">
                {(['female', 'male', 'other'] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGender(g)}
                    className={`text-xs py-2.5 px-3 font-semibold rounded-xl border cursor-pointer capitalize transition-all ${
                      gender === g 
                        ? 'border-orange-500 bg-orange-50/50 text-orange-600' 
                        : 'border-slate-200 hover:bg-slate-50 text-slate-500'
                    }`}
                  >
                    {g === 'female' ? "女性" : g === 'male' ? "男性" : "其他"}
                  </button>
                ))}
              </div>
            </div>

            {/* Field: Age */}
            <div className="space-y-1.5 col-span-1">
              <label className="text-xs font-bold text-slate-500">年齡 (歲)</label>
              <input
                type="number"
                required
                min="0"
                max="120"
                value={age === 0 ? "" : age}
                onChange={(e) => setAge(Number(e.target.value))}
                className="w-full text-sm border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:outline-hidden focus:border-orange-500 focus:bg-white transition-all font-mono font-medium text-slate-700"
              />
            </div>

            {/* Field: Height */}
            <div className="space-y-1.5 col-span-1">
              <label className="text-xs font-bold text-slate-500">目前身高 (cm)</label>
              <input
                type="number"
                required
                min="0"
                max="250"
                step="0.1"
                value={height === 0 ? "" : height}
                onChange={(e) => setHeight(Number(e.target.value))}
                className="w-full text-sm border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:outline-hidden focus:border-orange-500 focus:bg-white transition-all font-mono font-medium text-slate-700"
              />
            </div>

            {/* Field: Weight */}
            <div className="space-y-1.5 col-span-1">
              <label className="text-xs font-bold text-slate-500">目前體重 (kg)</label>
              <input
                type="number"
                required
                min="0"
                max="300"
                step="0.1"
                value={weight === 0 ? "" : weight}
                onChange={(e) => setWeight(Number(e.target.value))}
                className="w-full text-sm border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:outline-hidden focus:border-orange-500 focus:bg-white transition-all font-mono font-medium text-slate-700"
              />
            </div>

            {/* Field: Water Target */}
            <div className="space-y-1.5 col-span-1">
              <label className="text-xs font-bold text-slate-500">每日喝水目標 (ml)</label>
              <input
                type="number"
                required
                min="100"
                max="10000"
                step="50"
                value={dailyWaterGoal}
                onChange={(e) => {
                  setDailyWaterGoal(Number(e.target.value));
                  setIsWaterGoalCustomized(true);
                }}
                className="w-full text-sm border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:outline-hidden focus:border-orange-500 focus:bg-white transition-all font-mono font-medium text-slate-700"
              />
            </div>

            {/* Field: TDEE Goal */}
            <div className="space-y-1.5 col-span-1 sm:col-span-2">
              <label className="text-xs font-bold text-slate-500">每日卡路里 TDEE 攝取上限或目標值 (kcal)</label>
              <input
                type="number"
                required
                min="100"
                max="10000"
                step="10"
                value={dailyTdeeGoal}
                onChange={(e) => {
                  setDailyTdeeGoal(Number(e.target.value));
                  setIsTdeeGoalCustomized(true);
                }}
                className="w-full text-sm border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:outline-hidden focus:border-orange-500 focus:bg-white transition-all font-mono font-medium text-slate-700"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              id="profile_save_btn"
              type="submit"
              className="flex items-center gap-1.5 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 py-3 px-6 rounded-xl shadow-xs transition-all cursor-pointer hover:shadow-md active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>儲存變更設定</span>
            </button>
          </div>
        </form>

        {/* Right column: Dynamic calculation and health tips widget */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 pb-3 border-b border-slate-50">
              <Sparkles className="w-4.5 h-4.5 text-orange-500" />
              智慧健康與代謝微諮詢
            </h3>

            <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                <span className="font-bold text-slate-700 block text-xs">水分攝取建議：</span>
                <p>根據您 {weight} kg 的體重，為了維持理想高代謝率，建議每日至少需飲水量為：</p>
                <div className="flex justify-between items-center pt-2.5">
                  <span className="text-sm font-bold text-orange-600 font-mono">{recommendedWater} ml</span>
                  <button 
                    type="button" 
                    onClick={handleApplyWaterAdvise}
                    className="text-[10px] font-bold text-orange-600 bg-orange-50 hover:bg-orange-100/80 px-2 py-1 rounded cursor-pointer transition-colors"
                  >
                    套用此建議值
                  </button>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                <span className="font-bold text-slate-700 block text-xs">卡路里與 TDEE 估算值：</span>
                <p>根據 Harris-Benedict 基礎代謝乘上輕微活動估算，您的每日總熱量消耗 TDEE 評估約為：</p>
                <div className="flex justify-between items-center pt-2.5">
                  <span className="text-sm font-bold text-orange-600 font-mono">{recommendedTdee} kcal</span>
                  <button 
                    type="button" 
                    onClick={handleApplyTdeeAdvise}
                    className="text-[10px] font-bold text-orange-600 bg-orange-50 hover:bg-orange-100/80 px-2 py-1 rounded cursor-pointer transition-colors"
                  >
                    套用此建議值
                  </button>
                </div>
              </div>

              <div className="p-3 bg-orange-50/40 text-orange-800 border border-orange-100/30 rounded-xl space-y-1">
                <span className="font-bold block text-xs text-orange-900">💡 減脂赤字提示：</span>
                <p>若您目前的目標是進行減重，建議將每日攝取卡路里上限（TDEE）設定在與實際消耗差距 <b>300 至 500 kcal</b> 的熱量赤字區間，以利脂肪燃燒且不流失核心肌肉！</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
