/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  CheckSquare, 
  Square, 
  Trash2, 
  Edit3, 
  Plus, 
  Calendar,
  Sparkles,
  ClipboardList
} from "lucide-react";
import { FitTask, getLocalTodayDateStr } from "../types";

interface TasksViewProps {
  tasks: FitTask[];
  onAddTask: (title: string, dueDate: string) => void;
  onUpdateTask: (id: string, updatedFields: Partial<FitTask>) => void;
  onDeleteTask: (id: string) => void;
}

export default function TasksView({
  tasks,
  onAddTask,
  onUpdateTask,
  onDeleteTask
}: TasksViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<FitTask | null>(null);

  // Form Fields
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState(getLocalTodayDateStr());

  const handleOpenCreateModal = () => {
    setEditingTask(null);
    setTitle("");
    setDueDate(getLocalTodayDateStr());
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (task: FitTask) => {
    setEditingTask(task);
    setTitle(task.title);
    setDueDate(task.dueDate);
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!title.trim()) return;

    if (editingTask) {
      onUpdateTask(editingTask.id, {
        title: title.trim(),
        dueDate
      });
    } else {
      onAddTask(title.trim(), dueDate);
    }
    setIsModalOpen(false);
  };

  // Sort tasks: uncompleted first, then by due date
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }
    return a.dueDate.localeCompare(b.dueDate);
  });

  return (
    <div className="space-y-6">
      {/* Upper info ribbon */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-xl border border-slate-100 shadow-sm gap-2">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            每日任務管理 <span className="text-xs font-normal text-slate-400">/ 行動打卡清單</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">追蹤並完成您的每日具體動作，點擊左側勾選框即可快速更新狀態。</p>
        </div>
        <button
          id="task_add_btn"
          onClick={handleOpenCreateModal}
          className="flex items-center gap-1.5 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 py-2.5 px-4 rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>新增打卡任務</span>
        </button>
      </div>

      {/* Task List container */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-100">
        {sortedTasks.length > 0 ? (
          sortedTasks.map((task) => {
            const isCompleted = task.completed;
            const isOverdue = !isCompleted && task.dueDate < getLocalTodayDateStr();

            return (
              <div 
                key={task.id} 
                className={`p-4 flex justify-between items-center group transition-colors hover:bg-slate-50/50 ${
                  isCompleted ? "bg-slate-50/20" : ""
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Custom animated checkbox */}
                  <button
                    onClick={() => onUpdateTask(task.id, { completed: !isCompleted })}
                    className={`p-1 rounded-lg transition-colors cursor-pointer shrink-0 ${
                      isCompleted ? "text-emerald-500" : "text-slate-300 hover:text-orange-500 hover:bg-slate-100"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckSquare className="w-5.5 h-5.5" />
                    ) : (
                      <Square className="w-5.5 h-5.5" />
                    )}
                  </button>

                  <div className="space-y-1 min-w-0">
                    <span className={`text-sm font-bold block truncate transition-all duration-300 ${
                      isCompleted ? "line-through text-slate-400" : "text-slate-700"
                    }`}>
                      {task.title}
                    </span>
                    <div className="flex items-center gap-3 text-[10px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        到期日：<span className={isOverdue ? "text-rose-500 font-bold" : ""}>{task.dueDate}</span>
                      </span>
                      {isOverdue && (
                        <span className="text-rose-500 font-semibold bg-rose-50 border border-rose-100 px-1.5 py-0.2 rounded">
                          已過期 ⚠️
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Operations buttons */}
                <div className="flex items-center gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleOpenEditModal(task)}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-white cursor-pointer transition-colors"
                    title="編輯"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onDeleteTask(task.id)}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors"
                    title="刪除"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-20 text-center flex flex-col items-center justify-center">
            <ClipboardList className="w-10 h-10 text-slate-200 stroke-1 mb-2" />
            <h4 className="font-bold text-slate-700 text-sm">目前尚無每日打卡任務</h4>
            <p className="text-xs text-slate-400 mt-1">點擊上方按鈕建立新任務，養成自律打卡的優良習慣！</p>
          </div>
        )}
      </div>

      {/* FORM DIALOG MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl border border-slate-100">
            <div className="flex justify-between items-center pb-2 border-b border-slate-50">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <CheckSquare className="w-4.5 h-4.5 text-orange-500" />
                {editingTask ? "編輯每日打卡任務" : "新增每日打卡任務"}
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
                <label className="text-xs font-bold text-slate-500">打卡任務名稱</label>
                <input
                  type="text"
                  placeholder="如：晨跑 30 分鐘、深蹲 60 下"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:outline-hidden focus:border-orange-500 bg-slate-50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">規劃執行到期日期</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:outline-hidden focus:border-orange-500 bg-slate-50"
                />
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
                id="submit_task_details"
                onClick={handleSave}
                disabled={!title.trim()}
                className="text-xs font-semibold py-2 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-lg shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {editingTask ? "儲存更新" : "確認新增打卡"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
