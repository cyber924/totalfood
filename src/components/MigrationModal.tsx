import React, { useState } from 'react';
import {
  Database,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Copy,
  RefreshCw,
  X,
  FileText,
  Image as ImageIcon,
  Share2,
  Video,
  Users,
} from 'lucide-react';
import {
  runDatabaseMigration,
  getBackupDataSummary,
  MigrationProgress,
} from '../services/migrationService';

interface MigrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMigrationComplete?: () => void;
}

const FIRESTORE_RULES_CODE = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}`;

export const MigrationModal: React.FC<MigrationModalProps> = ({
  isOpen,
  onClose,
  onMigrationComplete,
}) => {
  const [progress, setProgress] = useState<MigrationProgress>({
    status: 'idle',
    message: '',
    current: 0,
    total: 24,
    details: {
      users: 2,
      saved_posts: 6,
      saved_sns: 1,
      saved_shorts: 1,
      shared_assets: 14,
    },
  });

  const [copied, setCopied] = useState(false);
  const summary = getBackupDataSummary();

  if (!isOpen) return null;

  const handleStartMigration = async () => {
    const result = await runDatabaseMigration((prog) => {
      setProgress(prog);
    });

    if (result.success) {
      if (onMigrationComplete) {
        onMigrationComplete();
      }
    }
  };

  const handleCopyRules = () => {
    navigator.clipboard.writeText(FIRESTORE_RULES_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden text-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                신규 Firebase 전용 DB 마이그레이션 센터
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  신규 프로젝트 연결됨
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                기존 공유 DB(5만 일일한도 초과)에서 신규 단독 DB(
                <code className="text-orange-300 font-mono">studio-1139705993-b3bee</code>)로 완전 이관
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-5">
          {/* Status Box */}
          <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">새 파이어베이스 대상:</span>
              <span className="font-mono text-xs px-2 py-1 rounded bg-slate-900 text-emerald-400 border border-slate-700">
                studio-1139705993-b3bee (단독 전용 프로젝트)
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">이전 준비된 백업 데이터 총량:</span>
              <span className="font-bold text-orange-400">총 {summary.totalCount}건 완전 보존됨</span>
            </div>

            {/* Data Breakdown Grid */}
            <div className="grid grid-cols-5 gap-2 pt-2">
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 text-center">
                <FileText className="w-4 h-4 mx-auto text-blue-400 mb-1" />
                <div className="text-xs text-slate-400">블로그</div>
                <div className="text-sm font-bold text-white">{summary.postsCount}건</div>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 text-center">
                <ImageIcon className="w-4 h-4 mx-auto text-amber-400 mb-1" />
                <div className="text-xs text-slate-400">에셋/이미지</div>
                <div className="text-sm font-bold text-white">{summary.assetsCount}건</div>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 text-center">
                <Share2 className="w-4 h-4 mx-auto text-pink-400 mb-1" />
                <div className="text-xs text-slate-400">SNS</div>
                <div className="text-sm font-bold text-white">{summary.snsCount}건</div>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 text-center">
                <Video className="w-4 h-4 mx-auto text-purple-400 mb-1" />
                <div className="text-xs text-slate-400">쇼츠</div>
                <div className="text-sm font-bold text-white">{summary.shortsCount}건</div>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 text-center">
                <Users className="w-4 h-4 mx-auto text-emerald-400 mb-1" />
                <div className="text-xs text-slate-400">회원계정</div>
                <div className="text-sm font-bold text-white">{summary.usersCount}명</div>
              </div>
            </div>
          </div>

          {/* Permission Error / Setup Guide Box */}
          {progress.status === 'permission_error' && (
            <div className="bg-amber-950/40 border border-amber-500/40 rounded-xl p-4 space-y-3 animate-in fade-in">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs text-amber-200">
                  <div className="font-bold text-sm text-amber-300">
                    신규 Firebase 콘솔에서 Firestore 보안 규칙(Rules) 게시가 필요합니다!
                  </div>
                  <p>
                    신규 생성된 Firestore는 기본적으로 모든 쓰기를 차단(Permission Denied)하므로, 아래 1단계만 진행하시면 즉시 마이그레이션이 성공합니다.
                  </p>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-semibold">1. 적용할 보안 규칙 코드:</span>
                  <button
                    onClick={handleCopyRules}
                    className="flex items-center gap-1 text-xs px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded border border-amber-500/30 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    {copied ? '복사됨!' : '규칙 코드 복사'}
                  </button>
                </div>
                <pre className="p-3 bg-black/60 rounded-lg text-xs font-mono text-emerald-400 border border-slate-800 overflow-x-auto">
                  {FIRESTORE_RULES_CODE}
                </pre>
                <div className="flex items-center gap-3 pt-1">
                  <a
                    href="https://console.firebase.google.com/project/studio-1139705993-b3bee/firestore/rules"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-xs bg-amber-600 hover:bg-amber-500 text-white font-medium px-3.5 py-2 rounded-lg transition-colors shadow-sm"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Firebase 콘솔 규칙 설정 페이지 바로가기
                  </a>
                  <span className="text-xs text-slate-400">
                    (위 링크에서 붙여넣고 [게시/Publish] 후 아래 버튼 재클릭)
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Success Box */}
          {progress.status === 'success' && (
            <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-4 flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
              <div>
                <div className="font-bold text-sm text-emerald-300">마이그레이션 100% 완료!</div>
                <p className="text-xs text-emerald-200/80">{progress.message}</p>
              </div>
            </div>
          )}

          {/* Running Progress Bar */}
          {progress.status === 'running' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-orange-400" />
                  {progress.message}
                </span>
                <span className="font-mono text-orange-400">
                  {progress.current} / {progress.total}
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-300"
                  style={{
                    width: `${Math.min(100, (progress.current / progress.total) * 100)}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            앱 환경설정: <code className="text-slate-300">studio-1139705993-b3bee</code> 적용 완료
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              닫기
            </button>
            <button
              onClick={handleStartMigration}
              disabled={progress.status === 'running'}
              className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 disabled:opacity-50 rounded-lg transition-all shadow-md flex items-center gap-2"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${progress.status === 'running' ? 'animate-spin' : ''}`}
              />
              {progress.status === 'running'
                ? '마이그레이션 전송 중...'
                : progress.status === 'success'
                ? '다시 동기화 실행'
                : '🚀 신규 DB로 마이그레이션 실행'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
