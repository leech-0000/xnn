/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Dumbbell, 
  LayoutDashboard, 
  CheckCircle2, 
  FolderHeart, 
  User as UserIcon, 
  Droplet, 
  Flame, 
  Scale,
  RefreshCw,
  Award,
  LogOut
} from "lucide-react";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { auth } from "./firebase";
import AuthView from "./components/AuthView";
import { UserProfile, DietLog, FitProject, FitTask, WeightEntry, getLocalTodayDateStr } from "./types";
import { 
  initialProfile, 
  initialDietLogs, 
  initialProjects, 
  initialTasks, 
  initialWeights 
} from "./mockData";
import {
  fetchProfile,
  saveProfile,
  fetchDietLogs,
  saveDietLog,
  fetchProjects,
  saveProject,
  updateProject,
  deleteProject,
  fetchTasks,
  saveTask,
  updateTask,
  deleteTask,
  fetchWeightHistory,
  saveWeightEntry
} from "./firebase";
import DashboardView from "./components/DashboardView";
import ProjectsView from "./components/ProjectsView";
import TasksView from "./components/TasksView";
import ProfileView from "./components/ProfileView";

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'projects' | 'tasks' | 'profile'>('dashboard');
  
  // Auth state tracking
  const [user, setUser] = useState<User | null>(null);
  const [isGuest, setIsGuest] = useState<boolean>(false);
  const [userId, setUserId] = useState<string>("");
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);

  // App primary States
  const [profile, setProfile] = useState<UserProfile>(initialProfile);
  const [dietLogs, setDietLogs] = useState<DietLog[]>(initialDietLogs);
  const [projects, setProjects] = useState<FitProject[]>(initialProjects);
  const [tasks, setTasks] = useState<FitTask[]>(initialTasks);
  const [weightHistory, setWeightHistory] = useState<WeightEntry[]>(initialWeights);
  const [waterIntake, setWaterIntake] = useState(0); // initial default
  
  // Sync Status
  const [syncStatus, setSyncStatus] = useState<string>("正在載入預設數據...");

  // Auth state listener on boot
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setUserId(currentUser.uid);
        setIsGuest(false);
      } else {
        setUser(null);
        // Fall back to localStorage if was guest is cached
        const wasGuest = localStorage.getItem("auth_is_guest") === "true";
        if (wasGuest) {
          setIsGuest(true);
          setUserId("default_user");
        } else {
          setIsGuest(false);
          setUserId("");
        }
      }
      setIsAuthChecking(false);
    });
    return () => unsubscribe();
  }, []);

  const handleGuestAccess = () => {
    localStorage.setItem("auth_is_guest", "true");
    setIsGuest(true);
    setUserId("default_user");
  };

  const handleAuthSuccess = (uid: string) => {
    localStorage.removeItem("auth_is_guest");
    setUserId(uid);
    setIsGuest(false);
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("auth_is_guest");
      setIsGuest(false);
      setUser(null);
      setUserId("");
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  // Format today YYYY-MM-DD
  const getTodayDateStr = () => getLocalTodayDateStr();

  // Derive today's DietLog or make an empty template
  const todayDateStr = getTodayDateStr();
  const [todayDietLog, setTodayDietLog] = useState<DietLog>({
    id: "today_log",
    userId: "default_user",
    date: todayDateStr,
    foods: [],
    totalCalories: 0,
    totalCarbs: 0,
    totalProtein: 0,
    totalFat: 0
  });

  // Keep today's diet log userId updated
  useEffect(() => {
    if (userId) {
      setTodayDietLog(prev => ({ ...prev, userId }));
    }
  }, [userId]);

  // Load from Firestore or fallback to localStorage / MockData on mount
  useEffect(() => {
    if (!userId) return;
    let active = true;
    
    async function loadData() {
      try {
        setSyncStatus("同步載入中...");
        
        // 1. Load User Profile
        const remoteProfile = await fetchProfile(userId);
        if (remoteProfile && active) {
          setProfile(remoteProfile);
        }

        // 2. Load Diet Logs
        const remoteDietLogs = await fetchDietLogs(userId);
        if (remoteDietLogs && remoteDietLogs.length > 0 && active) {
          setDietLogs(remoteDietLogs);
          // Find if today already has a log in remote
          const todayRemote = remoteDietLogs.find(log => log.date === todayDateStr);
          if (todayRemote) {
            setTodayDietLog(todayRemote);
          } else {
            // Find in initial mock logs
            const todayMock = initialDietLogs.find(log => log.date === todayDateStr);
            if (todayMock) {
              setTodayDietLog(todayMock);
            }
          }
        } else if (active) {
          // Set to Today's standard log from Initial Data
          const todayMock = initialDietLogs.find(log => log.date === todayDateStr);
          if (todayMock) {
            setTodayDietLog(todayMock);
          }
        }

        // 3. Load Projects
        const remoteProjects = await fetchProjects(userId);
        if (remoteProjects && remoteProjects.length > 0 && active) {
          setProjects(remoteProjects);
        }

        // 4. Load Tasks
        const remoteTasks = await fetchTasks(userId);
        if (remoteTasks && remoteTasks.length > 0 && active) {
          setTasks(remoteTasks);
        }

        // 5. Load Weights
        const remoteWeights = await fetchWeightHistory(userId);
        if (remoteWeights && remoteWeights.length > 0 && active) {
          setWeightHistory(remoteWeights);
        }

        // Load water intake for today from localStorage or set default
        const cachedWater = localStorage.getItem(`water_${todayDateStr}`);
        if (cachedWater && active) {
          setWaterIntake(parseInt(cachedWater, 10));
        } else if (active) {
          setWaterIntake(0); // fallback default
        }

        if (active) {
          setSyncStatus("已連接 (雲端雲同步開啟)");
        }
      } catch (err) {
        console.warn("Could not sync with Firestore (likely permissions or offline mode). Falling back to Offline Local Storage.");
        if (active) {
          setSyncStatus("離線模式 (資料暫存於瀏覽器中)");
          // Load from localStorage fallbacks if present
          const localProfileStr = localStorage.getItem("local_profile");
          const localTasksStr = localStorage.getItem("local_tasks");
          const localProjectsStr = localStorage.getItem("local_projects");
          const localWeightsStr = localStorage.getItem("local_weights");
          const localTodayDietStr = localStorage.getItem(`local_diet_${todayDateStr}`);

          if (localProfileStr) setProfile(JSON.parse(localProfileStr));
          if (localTasksStr) setTasks(JSON.parse(localTasksStr));
          if (localProjectsStr) setProjects(JSON.parse(localProjectsStr));
          if (localWeightsStr) setWeightHistory(JSON.parse(localWeightsStr));
          if (localTodayDietStr) setTodayDietLog(JSON.parse(localTodayDietStr));

          // Also load or default waterIntake
          const cachedWater = localStorage.getItem(`water_${todayDateStr}`);
          if (cachedWater) {
            setWaterIntake(parseInt(cachedWater, 10));
          } else {
            setWaterIntake(0);
          }
        }
      }
    }

    loadData();
    return () => {
      active = false;
    };
  }, [userId, todayDateStr]);

  // Keep water value persisted in local storage on modification
  const handleSetWaterIntake = (amount: number) => {
    const nextAmount = Math.max(0, amount);
    setWaterIntake(nextAmount);
    localStorage.setItem(`water_${todayDateStr}`, nextAmount.toString());
  };

  // Sync today's diet log modifications
  useEffect(() => {
    if (!userId) return;
    if (userId === "default_user") return;
    // CRITICAL: Ensure the diet log's userId matches the authenticated userId before syncing to Firestore
    if (todayDietLog.userId !== userId) {
      console.log("Postponing Firestore sync: todayDietLog.userId does not yet match authenticated userId", { todayDietLogUserId: todayDietLog.userId, authenticatedUserId: userId });
      return;
    }
    if (todayDietLog.foods.length > 0 || todayDietLog.totalCalories > 0) {
      localStorage.setItem(`local_diet_${todayDateStr}`, JSON.stringify(todayDietLog));
      saveDietLog(userId, todayDietLog).catch(err => {
        console.warn("Async Firestore save diet log skipped:", err);
      });
    }
  }, [todayDietLog, userId, todayDateStr]);

  /**
   * Action Handlers
   */

  // Add macro project
  const handleAddProjectObj = (name: string, dueDate: string, statusText?: 'ongoing' | 'completed') => {
    const newProj: FitProject = {
      id: `proj_${Date.now()}`,
      userId,
      name,
      status: statusText || "ongoing",
      dueDate,
      createdAt: getTodayDateStr()
    };

    const updated = [...projects, newProj];
    setProjects(updated);
    localStorage.setItem("local_projects", JSON.stringify(updated));

    saveProject(newProj).catch(err => {
      console.warn("Async Firestore save project failed:", err);
    });
  };

  // Update macro project details
  const handleUpdateProjectObj = (id: string, updatedFields: Partial<FitProject>) => {
    const updated = projects.map(p => p.id === id ? { ...p, ...updatedFields } : p);
    setProjects(updated);
    localStorage.setItem("local_projects", JSON.stringify(updated));

    updateProject(id, updatedFields).catch(err => {
      console.warn("Async Firestore update project failed:", err);
    });
  };

  // Delete macro project
  const handleDeleteProjectObj = (id: string) => {
    const updated = projects.filter(p => p.id !== id);
    setProjects(updated);
    localStorage.setItem("local_projects", JSON.stringify(updated));

    deleteProject(id).catch(err => {
      console.warn("Async Firestore delete project failed:", err);
    });
  };

  // Add micro task
  const handleAddTaskObj = (title: string, dueDate: string) => {
    const newTask: FitTask = {
      id: `task_${Date.now()}`,
      userId,
      title,
      completed: false,
      dueDate,
      createdAt: getTodayDateStr()
    };

    const updated = [...tasks, newTask];
    setTasks(updated);
    localStorage.setItem("local_tasks", JSON.stringify(updated));

    saveTask(newTask).catch(err => {
      console.warn("Async Firestore save task failed:", err);
    });
  };

  // Update micro task completion state or status
  const handleUpdateTaskObj = (id: string, updatedFields: Partial<FitTask>) => {
    const updated = tasks.map(t => t.id === id ? { ...t, ...updatedFields } : t);
    setTasks(updated);
    localStorage.setItem("local_tasks", JSON.stringify(updated));

    updateTask(id, updatedFields).catch(err => {
      console.warn("Async Firestore update task failed:", err);
    });
  };

  // Delete task
  const handleDeleteTaskObj = (id: string) => {
    const updated = tasks.filter(t => t.id !== id);
    setTasks(updated);
    localStorage.setItem("local_tasks", JSON.stringify(updated));

    deleteTask(id).catch(err => {
      console.warn("Async Firestore delete task failed:", err);
    });
  };

  // Add/Update Weight Historical log
  const handleAddWeightObj = (weightVal: number, dateVal: string) => {
    const newEntry: WeightEntry = {
      id: `wt_${userId}_${dateVal}`,
      userId,
      date: dateVal,
      weight: weightVal
    };

    // Replace if exists on same date, otherwise append
    let updated = [...weightHistory];
    const existingIndex = updated.findIndex(w => w.date === dateVal);
    if (existingIndex > -1) {
      updated[existingIndex] = newEntry;
    } else {
      updated.push(newEntry);
    }

    // Sort chronologically
    updated = updated.sort((a, b) => a.date.localeCompare(b.date));

    setWeightHistory(updated);
    localStorage.setItem("local_weights", JSON.stringify(updated));

    // Also update current profile weight
    const nextProfile = { ...profile, weight: weightVal };
    setProfile(nextProfile);
    localStorage.setItem("local_profile", JSON.stringify(nextProfile));
    saveProfile(userId, nextProfile).catch(err => console.warn(err));

    saveWeightEntry(newEntry).catch(err => {
      console.warn("Async Firestore save weight failed:", err);
    });
  };

  // Save profile settings
  const handleSaveProfileObj = (updatedProfile: UserProfile) => {
    setProfile(updatedProfile);
    localStorage.setItem("local_profile", JSON.stringify(updatedProfile));

    // If weight is set / updated to something non-zero, ensure today's weight is added/updated in the history, keeping graph synchronized
    if (updatedProfile.weight > 0) {
      const todayStr = getTodayDateStr();
      const existingIndex = weightHistory.findIndex(w => w.date === todayStr);
      const newEntry: WeightEntry = {
        id: `wt_${userId}_${todayStr}`,
        userId,
        date: todayStr,
        weight: updatedProfile.weight
      };
      let updated = [...weightHistory];
      if (existingIndex > -1) {
        updated[existingIndex] = newEntry;
      } else {
        updated.push(newEntry);
      }
      updated = updated.sort((a, b) => a.date.localeCompare(b.date));
      setWeightHistory(updated);
      localStorage.setItem("local_weights", JSON.stringify(updated));
      saveWeightEntry(newEntry).catch(err => console.warn(err));
    }

    saveProfile(userId, updatedProfile).catch(err => {
      console.warn("Async Firestore save profile update failed:", err);
    });
  };

  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-slate-500 animate-pulse">正在載入專屬健康健身數據中...</p>
        </div>
      </div>
    );
  }

  if (!userId) {
    return <AuthView onGuestAccess={handleGuestAccess} onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col md:flex-row antialiased">
      
      {/* 1. LEFT SIDEBAR FOR DESKTOP */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-white min-h-screen px-4 py-6 justify-between fixed left-0 top-0 z-30 shadow-lg">
        <div className="space-y-6">
          {/* Logo Brand Header */}
          <div className="flex items-center gap-2.5 px-3">
            <div className="p-2.5 bg-orange-600 rounded-xl flex items-center justify-center shadow-md">
              <Dumbbell className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-wider uppercase font-sans">AI健身數據</h1>
              <span className="text-[10px] text-slate-400 font-mono tracking-wider font-semibold">LEAN & FIT v2.0</span>
            </div>
          </div>

          {/* Separation divider */}
          <div className="h-px bg-slate-800/85"></div>

          {/* Navigation Navigation Tabs */}
          <nav className="space-y-1.5">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 py-3 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'dashboard' 
                  ? 'bg-orange-600 text-white shadow-xs' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              <span>主控台首頁</span>
            </button>

            <button
              onClick={() => setActiveTab('projects')}
              className={`w-full flex items-center gap-3 py-3 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'projects' 
                  ? 'bg-orange-600 text-white shadow-xs' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <FolderHeart className="w-4 h-4 shrink-0" />
              <span>健身專案規劃</span>
            </button>

            <button
              onClick={() => setActiveTab('tasks')}
              className={`w-full flex items-center gap-3 py-3 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'tasks' 
                  ? 'bg-orange-600 text-white shadow-xs' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>每日打卡任務</span>
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-3 py-3 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'profile' 
                  ? 'bg-orange-600 text-white shadow-xs' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <UserIcon className="w-4 h-4 shrink-0" />
              <span>健康基本資料</span>
            </button>
          </nav>
        </div>

        {/* Small Admin profile card inside sidebar footer */}
        <div className="space-y-3.5 mt-8">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 py-2.5 px-4 rounded-xl text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer transition-all border border-transparent hover:border-red-500/10"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>登出系統</span>
          </button>

          <div className="bg-slate-850 p-3 rounded-2xl border border-slate-800 flex items-center gap-3.5">
            <div className="p-2 bg-orange-50/10 rounded-xl text-orange-400">
              <Award className="w-5 h-5 fill-orange-400/20" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-100 block truncate">{profile.name}</span>
              <span className="text-[10px] text-slate-500 font-medium font-mono">{isGuest ? "離線測試/訪客" : "雲端資料同步中"}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* 2. BOTTOM NAV FOR MOBILE SMARTPHONES */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 py-2.5 px-4 flex justify-around items-center z-40 shadow-xl rounded-t-2xl">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center gap-1 cursor-pointer ${activeTab === 'dashboard' ? 'text-orange-600 font-bold' : 'text-slate-400'}`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[9px] font-bold">主控台</span>
        </button>

        <button
          onClick={() => setActiveTab('projects')}
          className={`flex flex-col items-center gap-1 cursor-pointer ${activeTab === 'projects' ? 'text-orange-600 font-bold' : 'text-slate-400'}`}
        >
          <FolderHeart className="w-5 h-5" />
          <span className="text-[9px] font-bold">專案規劃</span>
        </button>

        <button
          onClick={() => setActiveTab('tasks')}
          className={`flex flex-col items-center gap-1 cursor-pointer ${activeTab === 'tasks' ? 'text-orange-600 font-bold' : 'text-slate-400'}`}
        >
          <CheckCircle2 className="w-5 h-5" />
          <span className="text-[9px] font-bold">打卡任務</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center gap-1 cursor-pointer ${activeTab === 'profile' ? 'text-orange-600 font-bold' : 'text-slate-400'}`}
        >
          <UserIcon className="w-5 h-5" />
          <span className="text-[9px] font-bold">資料</span>
        </button>

        <button
          onClick={handleSignOut}
          className="flex flex-col items-center gap-1 cursor-pointer text-red-500 hover:text-red-600"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-[9px] font-bold">登出</span>
        </button>
      </nav>

      {/* 3. MAIN WORKSPACE */}
      <main className="flex-1 md:pl-64 min-h-screen bg-slate-50 text-slate-800 pb-24 md:pb-6 relative transition-all">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 space-y-6">

          {/* Render target active view tab */}
          {activeTab === 'dashboard' && (
            <DashboardView
              profile={profile}
              todayDietLog={todayDietLog}
              setTodayDietLog={setTodayDietLog}
              tasks={tasks}
              onAddTask={handleAddTaskObj}
              weightHistory={weightHistory}
              onAddWeight={handleAddWeightObj}
              onDeleteWeight={(date) => {}} // Simple callback
              waterIntake={waterIntake}
              setWaterIntake={handleSetWaterIntake}
              syncStatus={syncStatus}
            />
          )}

          {activeTab === 'projects' && (
            <ProjectsView
              projects={projects}
              onAddProject={handleAddProjectObj}
              onUpdateProject={handleUpdateProjectObj}
              onDeleteProject={handleDeleteProjectObj}
            />
          )}

          {activeTab === 'tasks' && (
            <TasksView
              tasks={tasks}
              onAddTask={handleAddTaskObj}
              onUpdateTask={handleUpdateTaskObj}
              onDeleteTask={handleDeleteTaskObj}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileView
              profile={profile}
              onSaveProfile={handleSaveProfileObj}
            />
          )}

        </div>
      </main>

    </div>
  );
}
