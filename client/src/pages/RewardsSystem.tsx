import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Star, Zap, Target, Flame, Award } from "lucide-react";

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  unlockedAt?: Date;
  isUnlocked: boolean;
}

interface Reward {
  id: string;
  type: "point" | "badge";
  title: string;
  description: string;
  points?: number;
  awardedAt: Date;
}

/**
 * 報酬・バッジシステム画面
 * ポイント、バッジ、モチベーション維持機能
 */
export default function RewardsSystem() {
  const currentPoints = 2850;
  const nextLevelPoints = 5000;

  const badges: Badge[] = [
    {
      id: "1",
      name: "初心者",
      description: "記録を始めた",
      icon: <Star className="w-6 h-6" />,
      color: "bg-blue-100",
      isUnlocked: true,
      unlockedAt: new Date("2026-01-15"),
    },
    {
      id: "2",
      name: "7日連続",
      description: "7日間連続で食事を記録",
      icon: <Flame className="w-6 h-6" />,
      color: "bg-orange-100",
      isUnlocked: true,
      unlockedAt: new Date("2026-02-20"),
    },
    {
      id: "3",
      name: "目標達成者",
      description: "1週間の目標を達成",
      icon: <Target className="w-6 h-6" />,
      color: "bg-green-100",
      isUnlocked: true,
      unlockedAt: new Date("2026-03-10"),
    },
    {
      id: "4",
      name: "パワーアップ",
      description: "タンパク質目標を5回達成",
      icon: <Zap className="w-6 h-6" />,
      color: "bg-yellow-100",
      isUnlocked: false,
    },
    {
      id: "5",
      name: "完璧な週間",
      description: "1週間すべての日で目標達成",
      icon: <Trophy className="w-6 h-6" />,
      color: "bg-purple-100",
      isUnlocked: false,
    },
    {
      id: "6",
      name: "マスター",
      description: "30日間連続で記録",
      icon: <Award className="w-6 h-6" />,
      color: "bg-pink-100",
      isUnlocked: false,
    },
  ];

  const recentRewards: Reward[] = [
    {
      id: "1",
      type: "point",
      title: "朝食を記録",
      description: "朝食を記録しました",
      points: 50,
      awardedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
    {
      id: "2",
      type: "point",
      title: "昼食を記録",
      description: "昼食を記録しました",
      points: 50,
      awardedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
    },
    {
      id: "3",
      type: "badge",
      title: "目標達成者",
      description: "1週間の目標を達成しました",
      awardedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
    {
      id: "4",
      type: "point",
      title: "夕食を記録",
      description: "夕食を記録しました",
      points: 50,
      awardedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
  ];

  const pointMilestones = [
    { points: 1000, label: "シルバー会員", unlocked: true },
    { points: 2500, label: "ゴールド会員", unlocked: true },
    { points: 5000, label: "プラチナ会員", unlocked: false },
    { points: 10000, label: "ダイヤモンド会員", unlocked: false },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* ヘッダー */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">報酬・バッジシステム</h1>
          <p className="text-gray-600 mt-1">
            継続的な記録でポイントとバッジを獲得してモチベーションを維持
          </p>
        </div>

        {/* ポイント情報 */}
        <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <CardHeader>
            <CardTitle className="text-2xl">現在のポイント</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-5xl font-bold">{currentPoints}</div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>次のレベルまで</span>
                <span>{nextLevelPoints - currentPoints} ポイント</span>
              </div>
              <Progress
                value={(currentPoints / nextLevelPoints) * 100}
                className="h-2 bg-white/20"
              />
            </div>
            <p className="text-sm opacity-90">
              あと {nextLevelPoints - currentPoints} ポイントでプラチナ会員になります！
            </p>
          </CardContent>
        </Card>

        {/* 会員ランク */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">会員ランク</CardTitle>
            <CardDescription>ポイント累積でランクアップ</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {pointMilestones.map((milestone, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-lg border-2 ${
                    milestone.unlocked
                      ? "bg-blue-50 border-blue-300"
                      : "bg-gray-50 border-gray-300 opacity-50"
                  }`}
                >
                  <p className="font-semibold text-gray-900">{milestone.label}</p>
                  <p className="text-sm text-gray-600">{milestone.points} ポイント</p>
                  {milestone.unlocked && (
                    <Badge className="mt-2 bg-green-100 text-green-800">
                      達成済み
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* バッジ一覧 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">バッジコレクション</CardTitle>
            <CardDescription>
              {badges.filter((b) => b.isUnlocked).length} / {badges.length} バッジ獲得
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {badges.map((badge) => (
                <div
                  key={badge.id}
                  className={`p-4 rounded-lg text-center ${
                    badge.isUnlocked
                      ? badge.color
                      : "bg-gray-100 opacity-50"
                  }`}
                >
                  <div className="flex justify-center mb-2">
                    <div className={badge.isUnlocked ? "text-gray-800" : "text-gray-400"}>
                      {badge.icon}
                    </div>
                  </div>
                  <p className="font-semibold text-sm text-gray-900">{badge.name}</p>
                  <p className="text-xs text-gray-600 mt-1">{badge.description}</p>
                  {badge.isUnlocked && badge.unlockedAt && (
                    <p className="text-xs text-gray-500 mt-2">
                      {badge.unlockedAt.toLocaleDateString("ja-JP")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 最近の報酬 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">最近の報酬</CardTitle>
            <CardDescription>最近獲得した報酬の履歴</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentRewards.map((reward) => (
                <div
                  key={reward.id}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{reward.title}</p>
                    <p className="text-sm text-gray-600">{reward.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {reward.awardedAt.toLocaleDateString("ja-JP", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  {reward.type === "point" ? (
                    <Badge className="bg-yellow-100 text-yellow-800 text-lg">
                      +{reward.points}
                    </Badge>
                  ) : (
                    <Badge className="bg-purple-100 text-purple-800">バッジ</Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 次のチャレンジ */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">次のチャレンジ</CardTitle>
            <CardDescription>バッジ獲得に向けた進捗</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-start gap-3">
                <Flame className="w-5 h-5 text-orange-500 mt-1" />
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">7日連続記録チャレンジ</p>
                  <p className="text-sm text-gray-600 mt-1">
                    連続で食事を記録して「7日連続」バッジを獲得しましょう
                  </p>
                  <Progress value={71} className="mt-3 h-2" />
                  <p className="text-xs text-gray-600 mt-1">5/7 日達成</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-start gap-3">
                <Zap className="w-5 h-5 text-purple-500 mt-1" />
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">パワーアップチャレンジ</p>
                  <p className="text-sm text-gray-600 mt-1">
                    タンパク質目標を達成して「パワーアップ」バッジを獲得しましょう
                  </p>
                  <Progress value={40} className="mt-3 h-2" />
                  <p className="text-xs text-gray-600 mt-1">2/5 回達成</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
