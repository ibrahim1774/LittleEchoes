import Dexie, { type Table } from 'dexie';
import type {
  ParentProfile,
  ChildProfile,
  Question,
  RecordingSession,
  Recording,
  Streak,
} from '@/types';
import { STARTER_QUESTIONS } from '@/data/questions';

class LittleEchoesDB extends Dexie {
  parents!: Table<ParentProfile>;
  children!: Table<ChildProfile>;
  questions!: Table<Question>;
  sessions!: Table<RecordingSession>;
  recordings!: Table<Recording>;
  streaks!: Table<Streak>;

  constructor() {
    super('LittleEchoesDB');
    this.version(1).stores({
      parents: 'id, createdAt',
      children: 'id, parentId, createdAt',
      questions: 'id, category, isCustom, createdBy',
      sessions: 'id, childId, date, createdAt',
      recordings: 'id, sessionId, childId, questionId, createdAt',
      streaks: 'childId',
    });

    // Seed starter questions on first open
    this.on('ready', async () => {
      const count = await this.questions.count();
      if (count === 0) {
        await this.questions.bulkAdd(STARTER_QUESTIONS);
      }
    });
  }
}

export const db = new LittleEchoesDB();
