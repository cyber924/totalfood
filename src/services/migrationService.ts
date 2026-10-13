import { doc, setDoc, getDocs, collection } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { MIGRATION_BACKUP_DATA } from '../data/migrationSourceData';

export interface MigrationProgress {
  status: 'idle' | 'running' | 'success' | 'permission_error' | 'error';
  message: string;
  current: number;
  total: number;
  details: {
    users: number;
    saved_posts: number;
    saved_sns: number;
    saved_shorts: number;
    shared_assets: number;
  };
}

export const getBackupDataSummary = () => {
  return {
    usersCount: (MIGRATION_BACKUP_DATA.users || []).length,
    postsCount: (MIGRATION_BACKUP_DATA.saved_posts || []).length,
    snsCount: (MIGRATION_BACKUP_DATA.saved_sns || []).length,
    shortsCount: (MIGRATION_BACKUP_DATA.saved_shorts || []).length,
    assetsCount: (MIGRATION_BACKUP_DATA.shared_assets || []).length,
    totalCount:
      (MIGRATION_BACKUP_DATA.users || []).length +
      (MIGRATION_BACKUP_DATA.saved_posts || []).length +
      (MIGRATION_BACKUP_DATA.saved_sns || []).length +
      (MIGRATION_BACKUP_DATA.saved_shorts || []).length +
      (MIGRATION_BACKUP_DATA.shared_assets || []).length,
  };
};

export const runDatabaseMigration = async (
  onProgress?: (progress: MigrationProgress) => void
): Promise<{ success: boolean; message: string }> => {
  const summary = getBackupDataSummary();
  let completed = 0;
  const total = summary.totalCount;

  const update = (
    status: MigrationProgress['status'],
    message: string,
    current: number
  ) => {
    if (onProgress) {
      onProgress({
        status,
        message,
        current,
        total,
        details: {
          users: (MIGRATION_BACKUP_DATA.users || []).length,
          saved_posts: (MIGRATION_BACKUP_DATA.saved_posts || []).length,
          saved_sns: (MIGRATION_BACKUP_DATA.saved_sns || []).length,
          saved_shorts: (MIGRATION_BACKUP_DATA.saved_shorts || []).length,
          shared_assets: (MIGRATION_BACKUP_DATA.shared_assets || []).length,
        },
      });
    }
  };

  update('running', '신규 파이어베이스(studio-1139705993-b3bee) 마이그레이션 준비 중...', 0);

  const collections = [
    { name: 'users', items: MIGRATION_BACKUP_DATA.users || [] },
    { name: 'saved_posts', items: MIGRATION_BACKUP_DATA.saved_posts || [] },
    { name: 'saved_sns', items: MIGRATION_BACKUP_DATA.saved_sns || [] },
    { name: 'saved_shorts', items: MIGRATION_BACKUP_DATA.saved_shorts || [] },
    { name: 'shared_assets', items: MIGRATION_BACKUP_DATA.shared_assets || [] },
  ];

  try {
    for (const col of collections) {
      for (const rawItem of col.items) {
        const item = rawItem as any;
        const docId = item._id || item.id;
        const { _id, ...cleanData } = item;

        update(
          'running',
          `[${col.name}] 컬렉션 데이터 전송 중 (${completed + 1}/${total})...`,
          completed
        );

        await setDoc(doc(db, col.name, docId), cleanData);
        completed++;
      }
    }

    localStorage.setItem('firebase_migrated_new_db', 'true');
    update('success', `모든 데이터(${total}건)가 신규 Firebase DB로 안전하게 마이그레이션되었습니다!`, total);
    return {
      success: true,
      message: `성공적으로 ${total}건의 데이터가 신규 데이터베이스로 복구/이전되었습니다.`,
    };
  } catch (err: any) {
    console.error('Migration failed:', err);
    const isPermission =
      err?.code === 'permission-denied' ||
      (err?.message && err.message.includes('Missing or insufficient permissions'));

    if (isPermission) {
      update(
        'permission_error',
        '신규 Firebase 콘솔의 Firestore 보안 규칙(Rules) 권한 승인이 필요합니다.',
        completed
      );
      return {
        success: false,
        message:
          '신규 Firebase Firestore의 보안 규칙(Rules)이 쓰기를 차단하고 있습니다. Firebase 콘솔에서 규칙을 게시(Publish)해주세요.',
      };
    }

    update('error', `오류 발생: ${err.message || err.code}`, completed);
    return {
      success: false,
      message: `마이그레이션 도중 오류가 발생했습니다: ${err.message || err.code}`,
    };
  }
};
