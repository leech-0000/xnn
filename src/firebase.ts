/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  getDocs, 
  collection, 
  deleteDoc, 
  updateDoc,
  query,
  where,
  orderBy,
  getDocFromServer
} from "firebase/firestore";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider
} from "firebase/auth";
import { UserProfile, DietLog, FitProject, FitTask, WeightEntry } from "./types";

import firebaseConfig from "../firebase-applet-config.json";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId); /* CRITICAL: The app will break without this line */
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Error structure required by Firebase Integration Skill guidelines
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || "default_user",
      email: auth.currentUser?.email || "guest@example.com",
      emailVerified: auth.currentUser?.emailVerified || false,
      isAnonymous: auth.currentUser?.isAnonymous || false,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Simple test connectivity as required by skills guidelines
export async function testConnection() {
  const path = 'test/connection';
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration or network status.");
    }
  }
}

// Collection constants
const USERS_COLL = "users";
const DIET_COLL = "diet_logs";
const PROJECTS_COLL = "projects";
const TASKS_COLL = "tasks";
const WEIGHTS_COLL = "weight_history";

/**
 * 1. User Profile Sync
 */
export async function saveProfile(userId: string, profile: UserProfile): Promise<void> {
  if (userId === "default_user") return;
  const path = `${USERS_COLL}/${userId}`;
  try {
    await setDoc(doc(db, USERS_COLL, userId), profile);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function fetchProfile(userId: string): Promise<UserProfile | null> {
  if (userId === "default_user") return null;
  const path = `${USERS_COLL}/${userId}`;
  try {
    const docRef = doc(db, USERS_COLL, userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

/**
 * 2. Diet Logs Sync (Key is date YYYY-MM-DD or simple generated doc)
 */
export async function saveDietLog(userId: string, log: DietLog): Promise<void> {
  if (userId === "default_user") return;
  // Use date as doc ID to overwrite matching daily logs
  const path = `${DIET_COLL}/${userId}_${log.date}`;
  try {
    await setDoc(doc(db, DIET_COLL, `${userId}_${log.date}`), log);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function fetchDietLogs(userId: string): Promise<DietLog[]> {
  if (userId === "default_user") return [];
  const path = DIET_COLL;
  try {
    const q = query(collection(db, DIET_COLL), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    const logs: DietLog[] = [];
    querySnapshot.forEach((doc) => {
      logs.push(doc.data() as DietLog);
    });
    return logs;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

/**
 * 3. Fit Project Sync
 */
export async function saveProject(project: FitProject): Promise<void> {
  if (project.userId === "default_user") return;
  const path = `${PROJECTS_COLL}/${project.id}`;
  try {
    await setDoc(doc(db, PROJECTS_COLL, project.id), project);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateProject(projectId: string, updateData: Partial<FitProject>): Promise<void> {
  const path = `${PROJECTS_COLL}/${projectId}`;
  try {
    const docRef = doc(db, PROJECTS_COLL, projectId);
    await updateDoc(docRef, updateData);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteProject(projectId: string): Promise<void> {
  const path = `${PROJECTS_COLL}/${projectId}`;
  try {
    await deleteDoc(doc(db, PROJECTS_COLL, projectId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function fetchProjects(userId: string): Promise<FitProject[]> {
  if (userId === "default_user") return [];
  const path = PROJECTS_COLL;
  try {
    const q = query(collection(db, PROJECTS_COLL), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    const projects: FitProject[] = [];
    querySnapshot.forEach((doc) => {
      projects.push(doc.data() as FitProject);
    });
    return projects;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

/**
 * 4. Fit Task Sync
 */
export async function saveTask(task: FitTask): Promise<void> {
  if (task.userId === "default_user") return;
  const path = `${TASKS_COLL}/${task.id}`;
  try {
    await setDoc(doc(db, TASKS_COLL, task.id), task);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateTask(taskId: string, updateData: Partial<FitTask>): Promise<void> {
  const path = `${TASKS_COLL}/${taskId}`;
  try {
    const docRef = doc(db, TASKS_COLL, taskId);
    await updateDoc(docRef, updateData);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteTask(taskId: string): Promise<void> {
  const path = `${TASKS_COLL}/${taskId}`;
  try {
    await deleteDoc(doc(db, TASKS_COLL, taskId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function fetchTasks(userId: string): Promise<FitTask[]> {
  if (userId === "default_user") return [];
  const path = TASKS_COLL;
  try {
    const q = query(collection(db, TASKS_COLL), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    const tasks: FitTask[] = [];
    querySnapshot.forEach((doc) => {
      tasks.push(doc.data() as FitTask);
    });
    return tasks;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

/**
 * 5. Weight History Sync
 */
export async function saveWeightEntry(entry: WeightEntry): Promise<void> {
  if (entry.userId === "default_user") return;
  const path = `${WEIGHTS_COLL}/${entry.userId}_${entry.date}`;
  try {
    await setDoc(doc(db, WEIGHTS_COLL, `${entry.userId}_${entry.date}`), entry);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteWeightEntry(userId: string, date: string): Promise<void> {
  if (userId === "default_user") return;
  const path = `${WEIGHTS_COLL}/${userId}_${date}`;
  try {
    await deleteDoc(doc(db, WEIGHTS_COLL, `${userId}_${date}`));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function fetchWeightHistory(userId: string): Promise<WeightEntry[]> {
  if (userId === "default_user") return [];
  const path = WEIGHTS_COLL;
  try {
    const q = query(collection(db, WEIGHTS_COLL), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    const weights: WeightEntry[] = [];
    querySnapshot.forEach((doc) => {
      weights.push(doc.data() as WeightEntry);
    });
    // Sort by date ascending
    return weights.sort((a, b) => a.date.localeCompare(b.date));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}
