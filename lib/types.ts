export type SleepType = 'main' | 'nap';

export interface Profile {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Settings {
  profileId: string;
  theme: 'dark';
  sleepGoalHours: number; // default 8 (兼容旧字段)
  sleepGoalMinutes?: number; // 新增：分钟级目标，默认 480
  dayBoundaryHHmm: string; // default '02:00'
}

export interface SleepSession {
  id: string;
  profileId: string;
  type: SleepType; // main or nap
  start: string; // ISO
  end: string;   // ISO
  durationMinutes?: number; // 统一分钟数存储（便于统计），保留可选以兼容旧数据
  rating?: number; // 1-5
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActiveSleepState {
  profileId: string;
  start: string; // ISO
  note?: string;
  type: SleepType; // current sleep mode
  createdAt: string;
}

export interface DeleteLog {
  id: string;
  type: 'session_delete' | 'profile_delete' | 'profile_switch';
  profileId?: string;
  sessionId?: string;
  createdAt: string;
  details?: string;
}