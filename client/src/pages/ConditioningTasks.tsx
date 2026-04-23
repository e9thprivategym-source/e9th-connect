/**
 * コンディショニング・タスク管理ページ
 * 
 * 顧客がトレーナーから割り当てられたタスク（ストレッチ動画など）を管理するページです。
 */

import { useState } from 'react';
import { trpc } from '../lib/trpc';
import { useToast } from '../components/Toast';

export function ConditioningTasksPage() {
  const { showToast } = useToast();
  const [expandedTaskId, setExpandedTaskId] = useState<number | null>(null);

  // 割り当てられたタスク一覧を取得
  const { data: allTasks, isLoading, refetch } = trpc.conditioning.getAssignedTasks.useQuery();

  // 未完了タスク一覧を取得
  const { data: incompleteTasks } = trpc.conditioning.getIncompleteTasks.useQuery();

  // タスク完了ミューテーション
  const completeTaskMutation = trpc.conditioning.completeTask.useMutation({
    onSuccess: () => {
      showToast('タスクを完了しました！', 'success');
      refetch();
    },
    onError: (error) => {
      showToast(`エラー: ${error.message}`, 'error');
    },
  });

  const handleCompleteTask = async (taskId: number) => {
    await completeTaskMutation.mutateAsync({ taskId });
  };

  const completedTasks = allTasks?.filter((task) => task.is_completed) ?? [];
  const pendingTasks = allTasks?.filter((task) => !task.is_completed) ?? [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">コンディショニング・タスク</h1>
          <p className="text-gray-600">トレーナーから割り当てられたストレッチなどのタスクを完了しましょう</p>
        </div>

        {/* 統計情報 */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-blue-500">{allTasks?.length ?? 0}</div>
            <div className="text-sm text-gray-600">全タスク</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-yellow-500">{pendingTasks.length}</div>
            <div className="text-sm text-gray-600">未完了</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-green-500">{completedTasks.length}</div>
            <div className="text-sm text-gray-600">完了</div>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center text-gray-500 py-8">読み込み中...</div>
        ) : allTasks && allTasks.length > 0 ? (
          <>
            {/* 未完了タスク */}
            {pendingTasks.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">📋 未完了のタスク</h2>
                <div className="space-y-3">
                  {pendingTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      isExpanded={expandedTaskId === task.id}
                      onToggleExpand={() =>
                        setExpandedTaskId(expandedTaskId === task.id ? null : task.id)
                      }
                      onComplete={() => handleCompleteTask(task.id)}
                      isCompleting={completeTaskMutation.isPending}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* 完了済みタスク */}
            {completedTasks.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">✅ 完了済みのタスク</h2>
                <div className="space-y-3">
                  {completedTasks.map((task) => (
                    <div
                      key={task.id}
                      className="bg-white rounded-lg shadow p-4 opacity-60 border-l-4 border-green-500"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800 line-through">
                            {task.task_description}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            完了日: {task.completed_at ? new Date(task.completed_at).toLocaleDateString('ja-JP') : '—'}
                          </p>
                        </div>
                        <span className="text-2xl">✨</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="text-5xl mb-4">🎉</div>
            <p className="text-gray-600 text-lg">
              現在、割り当てられたタスクはありません。
            </p>
            <p className="text-gray-500 mt-2">
              トレーナーから新しいタスクが割り当てられると、ここに表示されます。
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * タスクカードコンポーネント
 */
interface TaskCardProps {
  task: any;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onComplete: () => void;
  isCompleting: boolean;
}

function TaskCard({
  task,
  isExpanded,
  onToggleExpand,
  onComplete,
  isCompleting,
}: TaskCardProps) {
  const daysUntilDue = task.due_date
    ? Math.ceil(
        (new Date(task.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      )
    : null;

  const isOverdue = daysUntilDue !== null && daysUntilDue < 0;
  const isDueSoon = daysUntilDue !== null && daysUntilDue <= 3 && daysUntilDue >= 0;

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow border-l-4 border-purple-500">
      <div
        className="p-4 cursor-pointer flex items-start justify-between"
        onClick={onToggleExpand}
      >
        <div className="flex-1">
          <h3 className="font-semibold text-gray-800 text-lg">{task.task_description}</h3>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {task.due_date && (
              <span
                className={`text-xs font-semibold px-3 py-1 rounded-full ${
                  isOverdue
                    ? 'bg-red-100 text-red-800'
                    : isDueSoon
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                {isOverdue
                  ? `⚠️ 期限切れ (${Math.abs(daysUntilDue)}日前)`
                  : isDueSoon
                  ? `⏰ あと${daysUntilDue}日`
                  : `📅 ${task.due_date}`}
              </span>
            )}
            {task.video_url && (
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-green-100 text-green-800">
                🎥 動画あり
              </span>
            )}
          </div>
        </div>
        <button
          className="text-gray-500 hover:text-gray-700 text-xl ml-4"
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand();
          }}
        >
          {isExpanded ? '▼' : '▶'}
        </button>
      </div>

      {/* 展開時の詳細情報 */}
      {isExpanded && (
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          {task.video_url && (
            <div className="mb-4">
              <p className="text-sm font-semibold text-gray-700 mb-2">📹 動画リンク:</p>
              <a
                href={task.video_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-700 underline break-all text-sm"
              >
                {task.video_url}
              </a>
            </div>
          )}

          <div className="mb-4">
            <p className="text-sm text-gray-600">
              作成日: {new Date(task.created_at).toLocaleDateString('ja-JP')}
            </p>
          </div>

          {/* 完了ボタン */}
          <button
            onClick={onComplete}
            disabled={isCompleting}
            className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all ${
              isCompleting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-500 hover:bg-green-600 active:scale-95'
            }`}
          >
            {isCompleting ? '完了処理中...' : '✅ このタスクを完了'}
          </button>
        </div>
      )}
    </div>
  );
}
