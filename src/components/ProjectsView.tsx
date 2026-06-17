/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  FolderHeart, 
  Plus, 
  Trash2, 
  Edit3, 
  Calendar, 
  Briefcase, 
  Sparkles,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { FitProject, getLocalTodayDateStr } from "../types";

interface ProjectsViewProps {
  projects: FitProject[];
  onAddProject: (name: string, dueDate: string, status?: 'ongoing' | 'completed') => void;
  onUpdateProject: (id: string, updatedFields: Partial<FitProject>) => void;
  onDeleteProject: (id: string) => void;
}

export default function ProjectsView({
  projects,
  onAddProject,
  onUpdateProject,
  onDeleteProject
}: ProjectsViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<FitProject | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [dueDate, setDueDate] = useState(getLocalTodayDateStr());
  const [status, setStatus] = useState<'ongoing' | 'completed'>('ongoing');

  const handleOpenCreateModal = () => {
    setEditingProject(null);
    setName("");
    setDueDate(getLocalTodayDateStr());
    setStatus("ongoing");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (proj: FitProject) => {
    setEditingProject(proj);
    setName(proj.name);
    setDueDate(proj.dueDate);
    setStatus(proj.status);
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!name.trim()) return;

    if (editingProject) {
      // Edit
      onUpdateProject(editingProject.id, {
        name: name.trim(),
        dueDate,
        status
      });
    } else {
      // Create
      onAddProject(name.trim(), dueDate, status);
    }
    setIsModalOpen(false);
  };

  // Remaining days helper
  const getRemainingDaysText = (dueStr: string, statusText: string) => {
    if (statusText === 'completed') return "已順利完成";
    const dueTime = new Date(dueStr).getTime();
    const nowTime = new Date().getTime();
    const diff = Math.ceil((dueTime - nowTime) / (1000 * 60 * 60 * 24));
    if (diff < 0) return `已逾期 ${Math.abs(diff)} 天`;
    if (diff === 0) return "今天截止";
    return `剩餘 ${diff} 天`;
  };

  return (
    <div className="space-y-6">
      {/* Upper info strip */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-xl border border-slate-100 shadow-sm gap-2">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            健身專案管理 <span className="text-xs font-normal text-slate-400">/ 宏觀核心目標</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">規劃您的長期健身或消脂目標。每個專案代表您努力奮鬥的一個宏觀方向。</p>
        </div>
        <button
          id="project_add_btn"
          onClick={handleOpenCreateModal}
          className="flex items-center gap-1.5 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 py-2.5 px-4 rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>新增健身專案</span>
        </button>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.length > 0 ? (
          projects.map((proj) => {
            const isCompleted = proj.status === 'completed';
            const daysText = getRemainingDaysText(proj.dueDate, proj.status);
            const isOverdue = daysText.includes("已逾期");

            return (
              <div 
                key={proj.id} 
                className={`bg-white rounded-2xl p-6 border transition-all hover:shadow-md flex flex-col justify-between space-y-4 relative overflow-hidden group ${
                  isCompleted ? "border-slate-100 opacity-90" : isOverdue ? "border-rose-100" : "border-slate-100 hover:border-orange-100"
                }`}
              >
                {/* Accent colored vertical bar */}
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                  isCompleted ? "bg-slate-300" : isOverdue ? "bg-rose-400" : "bg-orange-500"
                }`}></div>

                {/* Card header */}
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <span className={`text-[10px] uppercase font-bold py-1 px-2 rounded-lg border tracking-wider font-mono ${
                      isCompleted ? "bg-slate-100 text-slate-500 border-slate-200" : "bg-orange-50 text-orange-600 border-orange-100"
                    }`}>
                      {isCompleted ? "已完成" : "進行中"}
                    </span>
                    
                    {/* Expiry alerts */}
                    <span className={`text-xs font-semibold ${
                      isCompleted ? "text-slate-400" : isOverdue ? "text-rose-600" : "text-emerald-600"
                    }`}>
                      {daysText}
                    </span>
                  </div>

                  <h3 className={`text-sm font-bold text-slate-800 group-hover:text-orange-600 transition-colors ${
                    isCompleted ? "line-through text-slate-400" : ""
                  }`}>
                    {proj.name}
                  </h3>
                </div>

                {/* Card bottom details */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>目標截止日：{proj.dueDate}</span>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-50 text-xs">
                    <span className="text-[10px] text-slate-300 font-mono">
                      建立於 {proj.createdAt || "--"}
                    </span>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const nextStatusObj = isCompleted ? 'ongoing' : 'completed';
                          onUpdateProject(proj.id, { status: nextStatusObj });
                        }}
                        className={`p-1.5 rounded-lg border cursor-pointer transition-colors ${
                          isCompleted 
                            ? "bg-slate-100 text-slate-500 hover:bg-slate-200 border-slate-200" 
                            : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-emerald-100"
                        }`}
                        title={isCompleted ? "標記為進行中" : "標記為已完成"}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleOpenEditModal(proj)}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 cursor-pointer transition-colors"
                        title="編輯此專案"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onDeleteProject(proj.id)}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors"
                        title="刪除"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-1 md:col-span-2 lg:col-span-3 py-16 text-center bg-white rounded-2xl border border-slate-100 flex flex-col items-center justify-center">
            <FolderHeart className="w-10 h-10 text-slate-200 stroke-1 mb-2" />
            <h4 className="font-bold text-slate-700 text-sm">目前尚無健身專案</h4>
            <p className="text-xs text-slate-400 mt-1">點擊上方按鈕，開啟您第一個宏觀計畫目標吧！</p>
          </div>
        )}
      </div>

      {/* FORM DIALOG MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl border border-slate-100">
            <div className="flex justify-between items-center pb-2 border-b border-slate-50">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <Briefcase className="w-4.5 h-4.5 text-orange-500" />
                {editingProject ? "編輯健身專案" : "規劃新健身專案"}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">專案計畫名稱</label>
                <input
                  type="text"
                  placeholder="如：夏季大消脂計畫 (-5kg)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:outline-hidden focus:border-orange-500 bg-slate-50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">目標完成期限</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:outline-hidden focus:border-orange-500 bg-slate-50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">目前執行狀態</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:outline-hidden focus:focus:border-orange-500 bg-slate-50"
                >
                  <option value="ongoing">進行中 (Ongoing)</option>
                  <option value="completed">已順利完成 (Completed)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-xs py-2 px-4 border border-slate-200 text-slate-500 hover:text-slate-700 bg-white rounded-lg cursor-pointer"
              >
                取消
              </button>
              <button
                id="submit_project_details"
                onClick={handleSave}
                disabled={!name.trim()}
                className="text-xs font-semibold py-2 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-lg shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {editingProject ? "儲存更新" : "確認新增專案"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
