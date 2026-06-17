/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  auth, 
  googleProvider, 
  saveProfile 
} from "../firebase";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup 
} from "firebase/auth";
import { 
  Dumbbell, 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  ShieldAlert, 
  Sparkles, 
  UserCheck, 
  Scale, 
  Maximize2 
} from "lucide-react";
import { UserProfile } from "../types";

interface AuthViewProps {
  onGuestAccess: () => void;
  onAuthSuccess: (uid: string) => void;
}

export default function AuthView({ onGuestAccess, onAuthSuccess }: AuthViewProps) {
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [firebaseErrorCode, setFirebaseErrorCode] = useState<string | null>(null);

  // Detect if running inside an iframe
  const isInIframe = typeof window !== "undefined" && window.self !== window.top;

  // Form states
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  
  // Extra states for registration profile creation
  const [name, setName] = useState<string>("");
  const [gender, setGender] = useState<'male' | 'female' | 'other'>("male");
  const [age, setAge] = useState<number>(25);
  const [height, setHeight] = useState<number>(0);
  const [weight, setWeight] = useState<number>(0);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    setFirebaseErrorCode(null);

    try {
      if (isLogin) {
        // Sign In
        const credential = await signInWithEmailAndPassword(auth, email, password);
        setSuccessMsg("登入成功！正在引導前往儀表板...");
        setTimeout(() => {
          onAuthSuccess(credential.user.uid);
        }, 1000);
      } else {
        // Sign Up Validation
        if (password !== confirmPassword) {
          throw new Error("兩次輸入的密碼不一致！");
        }
        if (password.length < 6) {
          throw new Error("密碼長度必須至少 6 個字元！");
        }
        if (!name.trim()) {
          throw new Error("姓名/暱稱不得空白！");
        }

        // Register in Auth
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        
        // Save profile in Firestore
        const newProfile: UserProfile = {
          name: name.trim(),
          gender,
          age: Number(age),
          height: Number(height),
          weight: Number(weight),
          dailyWaterGoal: Math.round(Number(weight) * 35), // Default calculated goal
          dailyTdeeGoal: Math.round(
            gender === "male"
              ? (10 * Number(weight) + 6.25 * Number(height) - 5 * Number(age) + 5) * 1.375
              : (10 * Number(weight) + 6.25 * Number(height) - 5 * Number(age) - 161) * 1.375
          ) // Default TDEE estimation for light activity
        };

        await saveProfile(credential.user.uid, newProfile);
        setSuccessMsg("註冊成功！已為您套用個人健康基準...")
        setTimeout(() => {
          onAuthSuccess(credential.user.uid);
        }, 1200);
      }
    } catch (err: any) {
      console.error(err);
      let tMsg = err.message || "發生未知錯誤";
      if (err.code) {
        setFirebaseErrorCode(err.code);
      }
      
      // Translate typical Firebase error codes to readable Traditional Chinese
      if (err.code === "auth/invalid-email") tMsg = "無效的電子信箱格式！";
      else if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        tMsg = "電子信箱或密碼錯誤，請重新確認！";
      } else if (err.code === "auth/email-already-in-use") tMsg = "此電子信箱已被註冊使用！";
      else if (err.code === "auth/weak-password") tMsg = "密碼強度太弱，請至少輸入 6 位數！";
      else if (err.code === "auth/popup-closed-by-user") tMsg = "登入視窗已被關閉，請重新點選。";
      else if (err.code === "auth/operation-not-allowed") {
        tMsg = "此登入方式尚未在您的 Firebase Console 中啟用，請依下方引導開啟服務。";
      }

      setErrorMsg(tMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    setFirebaseErrorCode(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      
      // Generate standard default profile if new user
      const defaultProfile: UserProfile = {
        name: result.user.displayName || "健身愛好者",
        gender: "other",
        age: 28,
        height: 0,
        weight: 0,
        dailyWaterGoal: 2000,
        dailyTdeeGoal: 1500
      };

      // Try saving profile if document doesn't exist yet, ignore rewrite if it exists
      try {
        await saveProfile(result.user.uid, defaultProfile);
      } catch (err) {
        console.warn("User profile already exists or skipping sync:", err);
      }

      setSuccessMsg("Google 登入成功！");
      setTimeout(() => {
        onAuthSuccess(result.user.uid);
      }, 1000);
    } catch (err: any) {
      console.error(err);
      let tMsg = err.message || "Google 登入失敗";
      if (err.code) {
        setFirebaseErrorCode(err.code);
      }
      if (err.code === "auth/popup-closed-by-user") {
        tMsg = "登入視窗已被關閉，請重試。";
      } else if (err.code === "auth/operation-not-allowed") {
        tMsg = "Google 登入服務尚未在您的 Firebase Console 中啟用！請依下方引導開啟服務。";
      } else if (err.code === "auth/popup-blocked") {
        tMsg = "登入彈出視窗被瀏覽器封鎖了！請啟用彈出視窗權限，或點選右上角『在新分頁中開啟』。";
      }
      setErrorMsg(tMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="auth-container" className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-12 antialiased">
      <div className="w-full max-w-md space-y-6">
        
        {/* Brand App Branding Header */}
        <div className="flex flex-col items-center text-center">
          <div className="p-4 bg-orange-600 rounded-2xl flex items-center justify-center shadow-lg text-white mb-4 transform hover:rotate-12 transition-transform duration-300">
            <Dumbbell className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 font-sans">
            AI健身數據
          </h2>
          <p className="text-sm text-slate-500 mt-1.5 max-w-xs leading-relaxed">
            個人智慧健康追蹤、運動補水與膳食熱量管理面板
          </p>
        </div>

        {/* Iframe tip */}
        {isInIframe && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-800 text-xs shadow-xs space-y-1.5 max-w-md mx-auto">
            <span className="font-bold flex items-center gap-1.5 text-amber-900">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
              💡 預覽環境重要提示
            </span>
            <p className="leading-relaxed text-[11px]">
              您目前正在 <strong>iframe 內嵌視窗</strong> 中預覽本系統。由於瀏覽器的第三方隱私保護限制，雙向的 <strong>Google 快速登入彈出視窗</strong>可能會遭到瀏覽器阻擋或失效。
            </p>
            <p className="font-semibold text-amber-950 text-[11px]">
              👉 建議點選右上方<strong>「在新分頁中開啟 / Open in new window」</strong>按鈕，在獨立分頁中即可完美使用 Google 登入功能！
            </p>
          </div>
        )}

        {/* Auth form card */}
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl space-y-6 relative overflow-hidden">
          
          {/* Header tabs toggle */}
          <div className="bg-slate-100 p-1.5 rounded-2xl flex items-center">
            <button
              id="tab-btn-signin"
              onClick={() => { setIsLogin(true); setErrorMsg(null); setSuccessMsg(null); setFirebaseErrorCode(null); }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                isLogin 
                  ? "bg-white text-slate-800 shadow-xs" 
                  : "text-slate-400 hover:text-slate-600 cursor-pointer"
              }`}
            >
              登入帳號
            </button>
            <button
              id="tab-btn-signup"
              onClick={() => { setIsLogin(false); setErrorMsg(null); setSuccessMsg(null); setFirebaseErrorCode(null); }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                !isLogin 
                  ? "bg-white text-slate-800 shadow-xs" 
                  : "text-slate-400 hover:text-slate-600 cursor-pointer"
              }`}
            >
              規劃新註冊
            </button>
          </div>

          {/* Feedback messages */}
          {errorMsg && (
            <div id="auth-err-box" className="p-4 bg-red-50 rounded-2xl border border-red-100 flex flex-col gap-2.5 text-red-700 text-xs leading-relaxed">
              <div className="flex items-start gap-3">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                <div>
                  <p className="font-semibold">操作提示</p>
                  <p className="mt-0.5">{errorMsg}</p>
                </div>
              </div>
              
              {/* Detailed step-by-step instructions for enabling auth methods when we get operation-not-allowed */}
              {firebaseErrorCode === "auth/operation-not-allowed" && (
                <div className="p-3.5 bg-white rounded-xl border border-red-100 text-red-900 text-[11px] space-y-2 mt-1">
                  <p className="font-bold text-red-950 flex items-center gap-1">
                    🛠️ 解決方式：請在您的 Firebase 控制台啟用登入方法：
                  </p>
                  <ol className="list-decimal pl-4.5 space-y-1 text-red-800 font-medium">
                    <li>
                      前往您的 <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="underline font-bold text-orange-600 hover:text-orange-700">Firebase 控制台</a> 並選擇本專案。
                    </li>
                    <li>
                      在左側選單中點選 <strong>「建置 (Build)」➡「Authentication」</strong>。
                    </li>
                    <li>
                      點擊 <strong>「Sign-in method」</strong>（登入方法）頁籤。
                    </li>
                    <li>
                      點選 <strong>「新增提供者 (Add new provider)」</strong> 或 <strong>「啟用 (Enable)」</strong>，依需求啟用 <strong>「電子郵件/密碼 (Email/Password)」</strong> 以及 <strong>「Google」</strong> 登入。
                    </li>
                    <li>
                      點選儲存後回到本頁面重新整理，即可順暢體驗註冊與登入！
                    </li>
                  </ol>
                </div>
              )}
            </div>
          )}

          {successMsg && (
            <div id="auth-ok-box" className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-start gap-3 text-emerald-800 text-xs leading-relaxed">
              <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500 animate-bounce" />
              <div>
                <p className="font-semibold">成功</p>
                <p className="mt-0.5">{successMsg}</p>
              </div>
            </div>
          )}

          {/* Core Fields Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            
            {!isLogin && (
              <div className="space-y-3.5">
                {/* Name */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">您的姓名 / 暱稱</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      id="signup-name"
                      type="text"
                      required
                      placeholder="例：健身小幫手"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 pl-11 pr-4 text-xs font-semibold focus:outline-hidden focus:border-orange-500 focus:bg-white transition-all text-slate-800"
                    />
                  </div>
                </div>

                {/* Grid for dynamic measurements to calculate default goals */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">性別</label>
                    <select
                      id="signup-gender"
                      value={gender}
                      onChange={(e: any) => setGender(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-3 py-3 text-xs font-semibold focus:outline-hidden focus:border-orange-500 focus:bg-white transition-all text-slate-800"
                    >
                      <option value="male">男性</option>
                      <option value="female">女性</option>
                      <option value="other">多元/其他</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">年齡 (歲)</label>
                    <input
                      id="signup-age"
                      type="number"
                      min="0"
                      max="120"
                      required
                      value={age === 0 ? "" : age}
                      onChange={(e) => setAge(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-3 py-3 text-xs font-semibold focus:outline-hidden focus:border-orange-500 focus:bg-white transition-all text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">身高 (cm)</label>
                    <input
                      id="signup-height"
                      type="number"
                      min="0"
                      max="250"
                      required
                      value={height === 0 ? "" : height}
                      onChange={(e) => setHeight(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-3 py-3 text-xs font-semibold focus:outline-hidden focus:border-orange-500 focus:bg-white transition-all text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">體重 (kg)</label>
                    <input
                      id="signup-weight"
                      type="number"
                      min="0"
                      max="300"
                      required
                      value={weight === 0 ? "" : weight}
                      onChange={(e) => setWeight(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-3 py-3 text-xs font-semibold focus:outline-hidden focus:border-orange-500 focus:bg-white transition-all text-slate-800"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Email field */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">電子郵件信箱</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="auth-email-input"
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 pl-11 pr-4 text-xs font-semibold focus:outline-hidden focus:border-orange-500 focus:bg-white transition-all text-slate-800"
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">密碼</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="auth-password-input"
                  type="password"
                  required
                  placeholder="請輸入至少 6 位密碼"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 pl-11 pr-4 text-xs font-semibold focus:outline-hidden focus:border-orange-500 focus:bg-white transition-all text-slate-800"
                />
              </div>
            </div>

            {/* Confirm password context */}
            {!isLogin && (
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">確認密碼</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="signup-confirmpass"
                    type="password"
                    required
                    placeholder="請再次輸入相同密碼"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 pl-11 pr-4 text-xs font-semibold focus:outline-hidden focus:border-orange-500 focus:bg-white transition-all text-slate-800"
                  />
                </div>
              </div>
            )}

            {/* Action Submit button */}
            <button
              id="auth-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white py-3.5 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 shadow-md shadow-orange-600/10"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>{isLogin ? "立即登入" : "建立帳號並套用健康基準"}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Spacer divider */}
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-100"></div>
            <span className="flex-shrink mx-4 text-slate-350 text-[10px] font-bold uppercase tracking-widest">或</span>
            <div className="flex-grow border-t border-slate-100"></div>
          </div>

          {/* Google Sign-in button */}
          <button
            id="google-login-btn"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 py-3 rounded-2xl font-semibold text-xs transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-xs"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.91h6.61c-.28 1.5-.113 2.76-1.4 3.6v3h2.25c4.78-4.4 7.28-10.9 7.28-18.44z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.97-1.1 7.96-2.9l-3.87-3c-1.1.75-2.5 1.2-4.09 1.2-3.14 0-5.8-2.1-6.75-5H1.1v3.1A11.96 11.96 0 0 0 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.25 14.3c-.24-.75-.38-1.55-.38-2.3s.14-1.55.38-2.3V6.6H1.1A11.96 11.96 0 0 0 0 12c0 2.22.613 4.3 1.69 6.1l3.56-2.8z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.6 4.6 1.8l3.43-3.41c-2.73-2.55-6.3-4.14-9.97-4.14A11.96 11.96 0 0 0 1.1 6.6l4.15 3.3c.95-2.9 3.61-5.15 6.75-5.15z"
              />
            </svg>
            <span>使用 Google 快速登入</span>
          </button>

          {/* Dynamic Developer Console instructions */}
          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 space-y-1">
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-amber-800 flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 shrink-0" />
              免安裝/快速體驗
            </span>
            <p className="text-[11px] leading-relaxed text-amber-700 font-medium">
              想跳過認證直接瀏覽？點擊下方「訪客模式」即可載入極致精美的在地化測試數據！
            </p>
          </div>

          <button
            id="guest-login-btn"
            onClick={onGuestAccess}
            className="w-full bg-slate-900 shadow-lg shadow-slate-900/10 hover:bg-slate-950 text-white py-3.5 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <User className="w-3.5 h-3.5" />
            <span>以訪客/測試模式直接登入</span>
          </button>
          
        </div>

        {/* Console Config guidelines footer */}
        <p className="text-center text-[11px] text-slate-400 font-medium leading-relaxed max-w-sm mx-auto">
          🔒 提醒：依 Firebase 規範，登入與註冊將對接配置的 Firestore 資料庫節點。
          專案已開啟極致安全的 Tiered Identity 資料防護。
        </p>

      </div>
    </div>
  );
}
