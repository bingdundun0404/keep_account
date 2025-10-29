import Dexie, { Table } from 'dexie';
import { Profile, Settings, SleepSession, ActiveSleepState, DeleteLog } from './types';

export class SleepDB extends Dexie {
  profiles!: Table<Profile, string>;
  settings!: Table<Settings, string>;
  sessions!: Table<SleepSession, string>;
  active!: Table<ActiveSleepState, string>; // one per profile
  logs!: Table<DeleteLog, string>;

  constructor() {
    super('sleep_db');
    // bump schema version to add logs table
    this.version(2).stores({
      profiles: 'id',
      settings: 'profileId',
      sessions: 'id, profileId, end',
      active: 'profileId',
      logs: 'id, type, profileId, sessionId, createdAt'
    });
  }
}

export const db = new SleepDB();