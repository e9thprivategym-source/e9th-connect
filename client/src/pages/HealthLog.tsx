/**
 * 体調ログページ
 * 
 * ユーザーが毎日の体調（疲労度、むくみ、睡眠時間）を記録できるページです。
 */

import { useState, useEffect } from 'react';
import { trpc } from '../lib/trpc';
import { useToast } from '../components/Toast';

export function HealthLogPage() {
  const [logDate, setLogDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [fatigueLevel, setFatigueLevel] = useState<'Good' | 'Normal' | 'Bad'>('Normal');
  const [swellingStatus, setSwellingStatus] = useState<boolean>(false);
  const [sleepHours, setSleepHours] = useState<number>(7);
  const [notes, setNotes] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const { showToast } = useToast();

  // 本日の体調ログを取得
  const { data: todayLog } = trpc.health.getTodayHealthLog.useQuery();

  // 体調ログを記録
  const recordHealthLogMutation = trpc.health.recordHealthLog.useMutation({
    onSuccess: () => {
      showToast('体調ログを保存しました', 'success');
      setIsLoading(false);
    },
    onError: (error) => {
      showToast(`エラー: ${error.message}`, 'error');
      setIsLoading(false);
    },
  });

  // 初期値を設定
  useEffect(() => {
    if (todayLog) {
      setFatigueLevel(todayLog.fatigue_level as 'Good' | 'Normal' | 'Bad');
      setSwellingStatus(todayLog.swelling_status ?? false);
      setSleepHours(todayLog.sleep_hours ? parseFloat(todayLog.sleep_hours) : 7);
      setNotes(todayLog.notes ?? '');
    }
  }, [todayLog]);

  const handleSave = async () => {
    setIsLoading(true);
    await recordHealthLogMutation.mutateAsync({
      log_date: logDate,
      fatigue_level: fatigueLevel,
      swelling_status: swellingStatus,
      sleep_hours: sleepHours,
      notes: notes || undefined,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">体調ログ</h1>
          <p className="text-gray-600">毎日の体調を記録して、トレーニング効果を最大化しましょう</p>
        </div>

        {/* カード */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          {/* 日付選択 */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              記録日
            </label>
            <input
              type="date"
              value={logDate}
              onChange={(e) => setLogDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 疲労度 */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              疲労度
            </label>
            <div className="flex gap-3">
              {(['Good', 'Normal', 'Bad'] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => setFatigueLevel(level)}
                  className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                    fatigueLevel === level
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {level === 'Good' && '✨ 良好'}
                  {level === 'Normal' && '😊 普通'}
                  {level === 'Bad' && '😴 疲れている'}
                </button>
              ))}
            </div>
          </div>

          {/* むくみ */}
          <div className="mb-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={swellingStatus}
                onChange={(e) => setSwellingStatus(e.target.checked)}
                className="w-5 h-5 text-blue-500 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm font-semibold text-gray-700">
                むくみがある
              </span>
            </label>
          </div>

          {/* 睡眠時間 */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              睡眠時間: <span className="text-blue-500">{sleepHours.toFixed(1)} 時間</span>
            </label>
            <input
              type="range"
              min="0"
              max="12"
              step="0.5"
              value={sleepHours}
              onChange={(e) => setSleepHours(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>0時間</span>
              <span>6時間</span>
              <span>12時間</span>
            </div>
          </div>

          {/* メモ */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              メモ（任意）
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="今日の体調について、気になることがあれば記入してください"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={4}
            />
          </div>

          {/* 保存ボタン */}
          <button
            onClick={handleSave}
            disabled={isLoading}
            className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all ${
              isLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600 active:scale-95'
            }`}
          >
            {isLoading ? '保存中...' : '体調ログを保存'}
          </button>
        </div>

        {/* 過去のログ表示 */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">過去7日間の体調</h2>
          <HealthLogHistory />
        </div>
      </div>
    </div>
  );
}

/**
 * 過去のログ履歴を表示するコンポーネント
 */
function HealthLogHistory() {
  const [startDate, setStartDate] = useState<string>(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split('T')[0];
  });

  const endDate = new Date().toISOString().split('T')[0];

  const { data: logs, isLoading } = trpc.health.getHealthLogsByDateRange.useQuery({
    start_date: startDate,
    end_date: endDate,
  });

  if (isLoading) {
    return <div className="text-center text-gray-500">読み込み中...</div>;
  }

  if (!logs || logs.length === 0) {
    return <div className="text-center text-gray-500">体調ログがまだありません</div>;
  }

  return (
    <div className="space-y-3">
      {logs.map((log) => (
        <div
          key={log.id}
          className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-gray-800">{log.log_date}</span>
            <span
              className={`px-3 py-1 rounded-full text-sm font-semibold ${
                log.fatigue_level === 'Good'
                  ? 'bg-green-100 text-green-800'
                  : log.fatigue_level === 'Normal'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {log.fatigue_level === 'Good' && '✨ 良好'}
              {log.fatigue_level === 'Normal' && '😊 普通'}
              {log.fatigue_level === 'Bad' && '😴 疲れている'}
            </span>
          </div>
          <div className="text-sm text-gray-600 space-y-1">
            {log.swelling_status && <p>• むくみあり</p>}
            <p>• 睡眠時間: {log.sleep_hours} 時間</p>
            {log.notes && <p>• メモ: {log.notes}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
