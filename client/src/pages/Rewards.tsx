import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Star, Gift, Zap, Target, Flame } from "lucide-react";
import { useState } from "react";

/**
 * 報酬システム画面
 * ポイント・バッジ付与ロジックと報酬履歴表示
 */
export default function Rewards() {
  const [selectedTab, setSelectedTab] = useState("overview");

  // ダミーデータ
  const userRewards = {
    totalPoints: 2850,
    level: 5,
    nextLevelPoints: 3000,
    badges: [
      { id: 1, name: "7日連続記録", icon: "🔥", earned: true, earnedDate: "2024-04-15" },
      { id: 2, name: "目標達成マスター", icon: "🎯", earned: true, earnedDate: "2024-04-10" },
      { id: 3, name: "AI コーチ活用者", icon: "🤖", earned: true, earnedDate: "2024-04-05" },
      { id: 4, name: "30日連続記録", icon: "⭐", earned: false, earnedDate: null },
      { id: 5, name: "完璧な栄養管理", icon: "💯", earned: false, earnedDate: null },
      { id: 6, name: "ボディメイク達成", icon: "💪", earned: false, earnedDate: null },
    ],
  };

  const pointHistory = [
    { id: 1, action: "食事記録", points: 10, date: "2024-04-20", time: "14:30" },
    { id: 2, action: "AIコーチフィードバック確認", points: 5, date: "2024-04-20", time: "12:15" },
    { id: 3, action: "週間目標達成", points: 50, date: "2024-04-19", time: "23:59" },
    { id: 4, action: "トレーナーメッセージ返信", points: 15, date: "2024-04-19", time: "18:45" },
    { id: 5, action: "食事記録", points: 10, date: "2024-04-19", time: "12:30" },
    { id: 6, action: "バッジ獲得: 7日連続記録", points: 100, date: "2024-04-15", time: "00:00" },
  ];

  const achievements = [
    {
      id: 1,
      title: "食事記録マスター",
      description: "100回の食事記録を完成させる",
      progress: 67,
      reward: "100ポイント",
      icon: <Flame className="h-6 w-6" />,
    },
    {
      id: 2,
      title: "完璧な栄養管理",
      description: "30日間、毎日の栄養目標を達成する",
      progress: 15,
      reward: "200ポイント",
      icon: <Target className="h-6 w-6" />,
    },
    {
      id: 3,
      title: "AIコーチ活用者",
      description: "50回のAIコーチフィードバックを受ける",
      progress: 32,
      reward: "150ポイント",
      icon: <Zap className="h-6 w-6" />,
    },
  ];

  const rewardShop = [
    {
      id: 1,
      name: "プロテインシェイク（1ヶ月分）",
      cost: 500,
      description: "高品質のプロテインシェイク",
      icon: "🥤",
    },
    {
      id: 2,
      name: "トレーニング用グローブ",
      cost: 300,
      description: "プレミアムトレーニンググローブ",
      icon: "🧤",
    },
    {
      id: 3,
      name: "栄養管理コンサルティング（1回）",
      cost: 400,
      description: "トレーナーとの個別栄養相談",
      icon: "📋",
    },
    {
      id: 4,
      name: "サプリメントセット",
      cost: 600,
      description: "ビタミン・ミネラルセット",
      icon: "💊",
    },
  ];

  const handleRedeemReward = (rewardId: number) => {
    alert(`報酬を交換しました！`);
    // TODO: API連携
  };

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div>
        <h1 className="text-3xl font-bold">報酬システム</h1>
        <p className="text-gray-600 mt-1">ポイント、バッジ、アチーブメントを獲得</p>
      </div>

      {/* ポイント・レベル概要 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-yellow-50 to-orange-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-600" />
              総ポイント
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{userRewards.totalPoints}</div>
            <p className="text-xs text-gray-600 mt-2">
              次のレベルまで: {userRewards.nextLevelPoints - userRewards.totalPoints} ポイント
            </p>
            <Progress
              value={(userRewards.totalPoints / userRewards.nextLevelPoints) * 100}
              className="mt-2 h-2"
            />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-pink-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Star className="h-5 w-5 text-purple-600" />
              レベル
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{userRewards.level}</div>
            <p className="text-xs text-gray-600 mt-2">ゴールド会員</p>
            <div className="flex gap-1 mt-2">
              {[...Array(userRewards.level)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-purple-600 text-purple-600" />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Gift className="h-5 w-5 text-green-600" />
              バッジ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {userRewards.badges.filter((b) => b.earned).length}/{userRewards.badges.length}
            </div>
            <p className="text-xs text-gray-600 mt-2">獲得済みバッジ</p>
          </CardContent>
        </Card>
      </div>

      {/* タブ */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">概要</TabsTrigger>
          <TabsTrigger value="badges">バッジ</TabsTrigger>
          <TabsTrigger value="achievements">アチーブメント</TabsTrigger>
          <TabsTrigger value="shop">報酬ショップ</TabsTrigger>
        </TabsList>

        {/* 概要タブ */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>ポイント履歴</CardTitle>
              <CardDescription>最近のポイント獲得履歴</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pointHistory.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.action}</p>
                      <p className="text-xs text-gray-600">
                        {item.date} {item.time}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">+{item.points}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* バッジタブ */}
        <TabsContent value="badges" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>獲得バッジ</CardTitle>
              <CardDescription>達成したバッジ一覧</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {userRewards.badges.map((badge) => (
                  <div
                    key={badge.id}
                    className={`p-4 rounded-lg text-center ${
                      badge.earned
                        ? "bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-300"
                        : "bg-gray-100 border-2 border-gray-300 opacity-50"
                    }`}
                  >
                    <div className="text-4xl mb-2">{badge.icon}</div>
                    <h3 className="font-semibold text-sm">{badge.name}</h3>
                    {badge.earned && (
                      <p className="text-xs text-gray-600 mt-2">
                        {badge.earnedDate}に獲得
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* アチーブメントタブ */}
        <TabsContent value="achievements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>アチーブメント</CardTitle>
              <CardDescription>進行中のアチーブメント一覧</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {achievements.map((achievement) => (
                <div key={achievement.id} className="p-4 border rounded-lg">
                  <div className="flex items-start gap-4">
                    <div className="text-3xl">{achievement.icon}</div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{achievement.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{achievement.description}</p>
                      <div className="mt-3 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">進捗</span>
                          <span className="font-semibold">{achievement.progress}%</span>
                        </div>
                        <Progress value={achievement.progress} className="h-2" />
                      </div>
                      <p className="text-xs text-green-600 mt-2 font-semibold">
                        報酬: {achievement.reward}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 報酬ショップタブ */}
        <TabsContent value="shop" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>報酬ショップ</CardTitle>
              <CardDescription>ポイントで報酬と交換</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {rewardShop.map((reward) => (
                  <div key={reward.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="text-3xl">{reward.icon}</div>
                      <Badge variant="default">{reward.cost}pt</Badge>
                    </div>
                    <h3 className="font-semibold">{reward.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{reward.description}</p>
                    <Button
                      onClick={() => handleRedeemReward(reward.id)}
                      disabled={userRewards.totalPoints < reward.cost}
                      className="w-full mt-3"
                    >
                      {userRewards.totalPoints >= reward.cost ? "交換する" : "ポイント不足"}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 情報 */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-sm">💡 ポイント獲得方法</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>• 食事記録：1回につき10ポイント</p>
          <p>• AIコーチフィードバック確認：1回につき5ポイント</p>
          <p>• 週間目標達成：1回につき50ポイント</p>
          <p>• バッジ獲得：バッジごとに50～100ポイント</p>
          <p>• トレーナーメッセージ返信：1回につき15ポイント</p>
        </CardContent>
      </Card>
    </div>
  );
}
