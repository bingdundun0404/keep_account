import { create } from 'zustand';
import { db } from '../lib/db';
import { ActiveSleepState, Profile, Settings, SleepSession } from '../lib/types';
import dayjs from '../lib/dayjs';
import { minutesBetween } from '../lib/time';
import type { SleepType } from '@/lib/types';

interface AppState {
  currentProfile?: Profile;
  settings?: Settings;
  active?: ActiveSleepState;
  profiles: Profile[];
  setProfile: (p: Profile) => Promise<void>;
  loadInitial: () => Promise<void>;
  loadAllProfiles: () => Promise<void>;
  deleteProfile: (id: string) => Promise<void>;
  startMainSleep: (note?: string) => Promise<void>;
  endMainSleep: (rating: number, note?: string) => Promise<void>;
  // 通用开始/结束睡眠（支持主睡眠与小睡）
  startSleep: (type: SleepType, note?: string) => Promise<void>;
  endSleep: (rating: number, note?: string) => Promise<void>;
  saveManualSession: (s: Omit<SleepSession, 'id' | 'profileId' | 'durationMinutes' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  updateSettings: (changes: Partial<Settings>) => Promise<void>;
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export const useAppStore = create<AppState>((set, get) => ({
  currentProfile: undefined,
  settings: undefined,
  active: undefined,
  profiles: [],

  async loadInitial() {
    // 优先使用持久化的当前账户，其次使用第一个账户
    const profiles = await db.profiles.toArray();
    let selected: Profile | undefined = profiles[0];
    try {
      if (typeof window !== 'undefined') {
        const storedId = localStorage.getItem('currentProfileId');
        if (storedId) {
          const found = await db.profiles.get(storedId);
          if (found) selected = found;
        }
      }
    } catch {}
    if (selected) {
      const settings = await db.settings.get(selected.id);
      const active = await db.active.get(selected.id);
      set({ currentProfile: selected, settings, active, profiles });
    } else {
      set({ profiles });
    }
  },

  async loadAllProfiles() {
    const profiles = await db.profiles.toArray();
    set({ profiles });
  },

  async deleteProfile(id: string) {
    const state = get();
    // Delete all related data
    await db.sessions.where('profileId').equals(id).delete();
    await db.settings.where('profileId').equals(id).delete();
    await db.active.where('profileId').equals(id).delete();
    await db.profiles.delete(id);
    // 写入删除日志
    try {
      const logId = uid();
      await db.logs.put({ id: logId, type: 'profile_delete', profileId: id, createdAt: dayjs().toISOString(), details: '二次校验通过后删除账户' });
    } catch {}
    
    // Update profiles list
    const profiles = await db.profiles.toArray();
    
    // If deleted profile was current, switch to first available or clear
    if (state.currentProfile?.id === id) {
      const newProfile = profiles[0];
      if (newProfile) {
        const settings = await db.settings.get(newProfile.id);
        const active = await db.active.get(newProfile.id);
        set({ currentProfile: newProfile, settings, active, profiles });
        try {
          if (typeof window !== 'undefined') {
            localStorage.setItem('currentProfileId', newProfile.id);
          }
        } catch {}
      } else {
        set({ currentProfile: undefined, settings: undefined, active: undefined, profiles });
        try {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('currentProfileId');
          }
        } catch {}
      }
    } else {
      set({ profiles });
    }
  },

  async setProfile(p: Profile) {
    await db.profiles.put(p);
    const existing = await db.settings.get(p.id);
    if (!existing) {
      await db.settings.put({ profileId: p.id, theme: 'dark', sleepGoalHours: 8, sleepGoalMinutes: 8 * 60, dayBoundaryHHmm: '02:00' });
    }
    const settings = await db.settings.get(p.id);
    const active = await db.active.get(p.id);
    set({ currentProfile: p, settings, active });
    // 持久化当前账户并写入切换日志
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('currentProfileId', p.id);
      }
      const logId = uid();
      await db.logs.put({ id: logId, type: 'profile_switch', profileId: p.id, createdAt: dayjs().toISOString(), details: `切换到账户: ${p.name}` });
    } catch {}
  },

  async updateSettings(changes) {
    const profile = get().currentProfile;
    if (!profile) return;
    const existing = await db.settings.get(profile.id);
    // 兼容：若传入分钟级目标则优先使用，并同步回写小时级字段；否则根据传入的小时或现有值换算分钟
    const next: Settings = {
      profileId: profile.id,
      theme: existing?.theme ?? 'dark',
      sleepGoalHours: (() => {
        if (typeof changes.sleepGoalMinutes === 'number') return Math.round(changes.sleepGoalMinutes / 60);
        if (typeof changes.sleepGoalHours === 'number') return changes.sleepGoalHours;
        return existing?.sleepGoalHours ?? 8;
      })(),
      sleepGoalMinutes: (() => {
        if (typeof changes.sleepGoalMinutes === 'number') return changes.sleepGoalMinutes;
        const hours = (typeof changes.sleepGoalHours === 'number') ? changes.sleepGoalHours : (existing?.sleepGoalHours ?? 8);
        const fallback = existing?.sleepGoalMinutes ?? hours * 60;
        return fallback;
      })(),
      dayBoundaryHHmm: changes.dayBoundaryHHmm ?? existing?.dayBoundaryHHmm ?? '02:00',
    };
    await db.settings.put(next);
    set({ settings: next });
  },
  async startMainSleep(note?: string) {
    const profile = get().currentProfile;
    if (!profile) throw new Error('No profile');
    const activeExisting = await db.active.get(profile.id);
    if (activeExisting) throw new Error('Already sleeping');
    const nowISO = dayjs().toISOString();
    const active: ActiveSleepState = { profileId: profile.id, start: nowISO, note, type: 'main', createdAt: nowISO };
    await db.active.put(active);
    set({ active });
  },

  async endMainSleep(rating: number, note?: string) {
    const profile = get().currentProfile;
    if (!profile) throw new Error('No profile');
    const active = await db.active.get(profile.id);
    if (!active) throw new Error('No active sleep');
    const endISO = dayjs().toISOString();
    const durationMinutes = minutesBetween(active.start, endISO);
    const id = uid();
    const session: SleepSession = {
      id,
      profileId: profile.id,
      type: 'main',
      start: active.start,
      end: endISO,
      durationMinutes,
      rating,
      note,
      createdAt: endISO,
      updatedAt: endISO,
    };
    await db.sessions.put(session);
    await db.active.delete(profile.id);
    set({ active: undefined });
  },

  async startSleep(type: SleepType, note?: string) {
    const state = get();
    const profile = state.currentProfile;
    if (!profile) return;
    const nowISO = dayjs().toISOString();
    const active = await db.active.get(profile.id);
    if (active) {
      return; // already sleeping
    }
    await db.active.put({ profileId: profile.id, start: nowISO, note, type, createdAt: nowISO });
    set({ active: { profileId: profile.id, start: nowISO, note, type, createdAt: nowISO } });
  },
  async endSleep(rating: number, note?: string) {
    const state = get();
    const profile = state.currentProfile;
    if (!profile) return;
    const active = await db.active.get({ profileId: profile.id });
    if (!active) {
      return; // no active sleep
    }
    const endISO = dayjs().toISOString();
    const durationMinutes = minutesBetween(active.start, endISO);
    const now = endISO;
    const newSession: SleepSession = {
      id: uid(),
      profileId: profile.id,
      type: active.type ?? 'main',
      start: active.start,
      end: endISO,
      durationMinutes,
      rating,
      note: note ?? active.note,
      createdAt: now,
      updatedAt: now,
    };
    await db.sessions.put(newSession);
    await db.active.delete(profile.id);
    set({ active: undefined });
  },
  async saveManualSession(input) {
    const profile = get().currentProfile;
    if (!profile) throw new Error('No profile');
    const startISO = input.start;
    const endISO = input.end;
    const newStart = dayjs(startISO);
    const newEnd = dayjs(endISO);
    const durationMinutes = minutesBetween(startISO, endISO);
    if (durationMinutes <= 0) throw new Error('结束时间必须晚于开始时间');
    // 与进行中睡眠的重叠校验
    const active = await db.active.get({ profileId: profile.id });
    if (active) {
      const activeStart = dayjs(active.start);
      const nowTime = dayjs();
      if (newStart.isBefore(nowTime) && newEnd.isAfter(activeStart)) {
        throw new Error(`与当前账户进行中的睡眠重叠：${activeStart.format('MM-DD HH:mm')} — 现在`);
      }
    }
    // 重叠校验：新会话与任何已有会话有交集则禁止
    const existing = await db.sessions.where('profileId').equals(profile.id).toArray();
    const conflict = existing.find((s) => {
      const sStart = dayjs(s.start);
      const sEnd = dayjs(s.end);
      return newStart.isBefore(sEnd) && newEnd.isAfter(sStart);
    });
    if (conflict) {
      throw new Error(`与当前账户已有记录时间重叠：${dayjs(conflict.start).format('MM-DD HH:mm')} — ${dayjs(conflict.end).format('MM-DD HH:mm')}`);
    }
    const id = uid();
    const now = dayjs().toISOString();
    const session: SleepSession = {
      id,
      profileId: profile.id,
      type: input.type,
      start: startISO,
      end: endISO,
      durationMinutes,
      rating: input.rating,
      note: input.note,
      createdAt: now,
      updatedAt: now,
    };
    await db.sessions.put(session);
  },
  async deleteSession(id: string) {
    const profile = get().currentProfile;
    if (!profile) return;
    await db.sessions.delete(id);
    // 写入删除日志
    try {
      const logId = uid();
      await db.logs.put({ id: logId, type: 'session_delete', profileId: profile.id, sessionId: id, createdAt: dayjs().toISOString(), details: '用户确认后删除会话' });
    } catch {}
  },
  // 移除清空全部记录功能
  // async clearAllSessions() {
  //   const profile = get().currentProfile;
  //   if (!profile) return;
  //   await db.sessions.where('profileId').equals(profile.id).delete();
  // },
}));