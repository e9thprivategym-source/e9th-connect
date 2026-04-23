import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Users, TrendingUp, AlertCircle, Settings } from "lucide-react";
import { toast } from "sonner";

interface TrainerStats {
  id: number;
  name: string;
  customersCount: number;
  avgCustomerAchievementRate: number;
  totalCoachingMessages: number;
  lastActivity: string;
}

interface CoachingSession {
  id: number;
  trainerName: string;
  customerName: string;
  lastMessageTime: string;
  status: "active" | "inactive";
}

interface User {
  id: number;
  name: string;
  email: string;
  role: "customer" | "trainer" | "admin";
  joinDate: string;
  status: "active" | "inactive";
}

/**
 * 管理者パネル
 * 全トレーナーの指導状況監査、顧客割り当て、引き継ぎ機能
 */
export default function AdminPanel() {
  const [selectedTrainer, setSelectedTrainer] = useState<string>("");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedTrainerDetail, setSelectedTrainerDetail] = useState<TrainerStats | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingTrainer, setEditingTrainer] = useState<TrainerStats | null>(null);
  const [showEditUserDialog, setShowEditUserDialog] = useState(false);
  const [showEditTrainerDialog, setShowEditTrainerDialog] = useState(false);
  const [defaultCalories, setDefaultCalories] = useState("2000");
  const [defaultPFC, setDefaultPFC] = useState("30:25:45");

  // ダミーデータ
  const trainers: TrainerStats[] = [
    {
      id: 1,
      name: "太郎トレーナー",
      customersCount: 8,
      avgCustomerAchievementRate: 88,
      totalCoachingMessages: 234,
      lastActivity: "2分前",
    },
    {
      id: 2,
      name: "花子トレーナー",
      customersCount: 6,
      avgCustomerAchievementRate: 82,
      totalCoachingMessages: 156,
      lastActivity: "15分前",
    },
    {
      id: 3,
      name: "次郎トレーナー",
      customersCount: 5,
      avgCustomerAchievementRate: 75,
      totalCoachingMessages: 98,
      lastActivity: "1時間前",
    },
  ];

  const coachingSessions: CoachingSession[] = [
    {
      id: 1,
      trainerName: "太郎トレーナー",
      customerName: "田中太郎",
      lastMessageTime: "今日 18:30",
      status: "active",
    },
    {
      id: 2,
      trainerName: "太郎トレーナー",
      customerName: "鈴木花子",
      lastMessageTime: "今日 17:15",
      status: "active",
    },
    {
      id: 3,
      trainerName: "花子トレーナー",
      customerName: "佐藤次郎",
      lastMessageTime: "昨日 19:45",
      status: "inactive",
    },
    {
      id: 4,
      trainerName: "次郎トレーナー",
      customerName: "山田美咲",
      lastMessageTime: "今日 20:00",
      status: "active",
    },
  ];

  const users: User[] = [
    {
      id: 1,
      name: "田中太郎",
      email: "tanaka@example.com",
      role: "customer",
      joinDate: "2026-01-15",
      status: "active",
    },
    {
      id: 2,
      name: "鈴木花子",
      email: "suzuki@example.com",
      role: "customer",
      joinDate: "2026-02-20",
      status: "active",
    },
    {
      id: 3,
      name: "太郎トレーナー",
      email: "taro.trainer@example.com",
      role: "trainer",
      joinDate: "2025-12-01",
      status: "active",
    },
    {
      id: 4,
      name: "花子トレーナー",
      email: "hanako.trainer@example.com",
      role: "trainer",
      joinDate: "2025-12-15",
      status: "active",
    },
  ];

  // ボタンハンドラー
  const handleAssignTrainer = () => {
    if (!selectedTrainer) {
      toast.error("トレーナーを選択してください");
      return;
    }
    toast.success(`トレーナーを割り当てました`);
  };

  const handleTransferCustomer = () => {
    toast.success("顧客を引き継ぎました");
  };

  const handleTrainerDetail = (trainer: TrainerStats) => {
    setSelectedTrainerDetail(trainer);
    setActiveTab("audit");
  };

  const handleTrainerAudit = (trainer: TrainerStats) => {
    toast.info(`${trainer.name}の監査を開始しました`);
    setSelectedTrainerDetail(trainer);
    setActiveTab("audit");
  };

  const handleSettings = () => {
    setActiveTab("settings");
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setShowEditUserDialog(true);
  };

  const handleDeleteUser = (user: User) => {
    toast.success(`${user.name}を削除しました`);
  };

  const handleSaveUser = () => {
    if (editingUser) {
      toast.success(`${editingUser.name}を更新しました`);
      setShowEditUserDialog(false);
      setEditingUser(null);
    }
  };

  const handleEditTrainer = (trainer: TrainerStats) => {
    setEditingTrainer(trainer);
    setShowEditTrainerDialog(true);
  };

  const handleDeleteTrainer = (trainer: TrainerStats) => {
    toast.success(`${trainer.name}を削除しました`);
  };

  const handleSaveTrainer = () => {
    if (editingTrainer) {
      toast.success(`${editingTrainer.name}を更新しました`);
      setShowEditTrainerDialog(false);
      setEditingTrainer(null);
    }
  };

  const handleSaveSettings = () => {
    toast.success("設定を保存しました");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* ヘッダー */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">管理者パネル</h1>
            <p className="text-gray-600 mt-1">トレーナーの指導状況監査・顧客管理</p>
          </div>
          <Button variant="outline" size="icon" onClick={handleSettings}>
            <Settings className="w-5 h-5" />
          </Button>
        </div>

        {/* タブナビゲーション */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard">ダッシュボード</TabsTrigger>
            <TabsTrigger value="users">ユーザー管理</TabsTrigger>
            <TabsTrigger value="trainers">トレーナー管理</TabsTrigger>
            <TabsTrigger value="audit">監査</TabsTrigger>
            <TabsTrigger value="settings">設定</TabsTrigger>
          </TabsList>

          {/* ダッシュボードタブ */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* 統計サマリー */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    総トレーナー数
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{trainers.length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    平均達成率
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">
                    {Math.round(
                      trainers.reduce((sum, t) => sum + t.avgCustomerAchievementRate, 0) /
                        trainers.length
                    )}
                    %
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    非アクティブセッション
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-orange-600">
                    {coachingSessions.filter((s) => s.status === "inactive").length}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* トレーナー一覧 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">トレーナー指導状況</CardTitle>
                <CardDescription>各トレーナーの指導状況と顧客管理</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {trainers.map((trainer) => (
                    <div
                      key={trainer.id}
                      className="flex justify-between items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{trainer.name}</h3>
                        <div className="flex gap-4 mt-2 text-sm text-gray-600">
                          <span>顧客数：{trainer.customersCount}</span>
                          <span>平均達成率：{trainer.avgCustomerAchievementRate}%</span>
                          <span>指導メッセージ：{trainer.totalCoachingMessages}</span>
                          <span>最終活動：{trainer.lastActivity}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTrainerDetail(trainer)}
                        >
                          詳細
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTrainerAudit(trainer)}
                        >
                          監査
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 指導セッション一覧 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">指導セッション一覧</CardTitle>
                <CardDescription>トレーナーと顧客間の指導状況</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {coachingSessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {session.trainerName} → {session.customerName}
                        </p>
                        <p className="text-sm text-gray-600">
                          最終メッセージ：{session.lastMessageTime}
                        </p>
                      </div>
                      <Badge
                        className={
                          session.status === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }
                      >
                        {session.status === "active" ? "アクティブ" : "非アクティブ"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 顧客割り当て・引き継ぎ */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">顧客管理</CardTitle>
                <CardDescription>トレーナー割り当て・引き継ぎ機能</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* トレーナー割り当て */}
                  <div className="space-y-3 p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-semibold text-gray-900">トレーナー割り当て</h3>
                    <div className="space-y-2">
                      <label className="text-sm text-gray-600">顧客を選択</label>
                      <Input placeholder="顧客名を入力..." />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-gray-600">トレーナーを選択</label>
                      <Select value={selectedTrainer} onValueChange={setSelectedTrainer}>
                        <SelectTrigger>
                          <SelectValue placeholder="トレーナーを選択" />
                        </SelectTrigger>
                        <SelectContent>
                          {trainers.map((trainer) => (
                            <SelectItem key={trainer.id} value={trainer.id.toString()}>
                              {trainer.name} ({trainer.customersCount}人)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleAssignTrainer} className="w-full">
                      割り当てる
                    </Button>
                  </div>

                  {/* 顧客引き継ぎ */}
                  <div className="space-y-3 p-4 bg-purple-50 rounded-lg">
                    <h3 className="font-semibold text-gray-900">顧客引き継ぎ</h3>
                    <p className="text-sm text-gray-600">
                      トレーナー変更時に過去の食事ログと指導チャットを引き継ぎます
                    </p>
                    <div className="space-y-2">
                      <label className="text-sm text-gray-600">引き継ぎ元トレーナー</label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="トレーナーを選択" />
                        </SelectTrigger>
                        <SelectContent>
                          {trainers.map((trainer) => (
                            <SelectItem key={trainer.id} value={trainer.id.toString()}>
                              {trainer.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-gray-600">引き継ぎ先トレーナー</label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="トレーナーを選択" />
                        </SelectTrigger>
                        <SelectContent>
                          {trainers.map((trainer) => (
                            <SelectItem key={trainer.id} value={trainer.id.toString()}>
                              {trainer.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleTransferCustomer} className="w-full">
                      引き継ぎ実行
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ユーザー管理タブ */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">ユーザー管理</CardTitle>
                <CardDescription>全ユーザーの一覧と管理</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className="flex justify-between items-center p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        <div className="flex gap-4 mt-2 text-xs text-gray-600">
                          <span>
                            ロール：
                            {user.role === "customer"
                              ? "顧客"
                              : user.role === "trainer"
                                ? "トレーナー"
                                : "管理者"}
                          </span>
                          <span>参加日：{user.joinDate}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 items-center">
                        <Badge
                          className={
                            user.status === "active"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }
                        >
                          {user.status === "active" ? "アクティブ" : "非アクティブ"}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditUser(user)}
                        >
                          編集
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteUser(user)}
                        >
                          削除
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* トレーナー管理タブ */}
          <TabsContent value="trainers" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">トレーナー管理</CardTitle>
                <CardDescription>トレーナーの詳細情報と管理</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {trainers.map((trainer) => (
                    <div key={trainer.id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">{trainer.name}</h3>
                          <p className="text-sm text-gray-600">顧客数：{trainer.customersCount}名</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditTrainer(trainer)}
                          >
                            編集
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteTrainer(trainer)}
                          >
                            削除
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">平均達成率</p>
                          <p className="font-semibold text-gray-900">
                            {trainer.avgCustomerAchievementRate}%
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">指導メッセージ</p>
                          <p className="font-semibold text-gray-900">
                            {trainer.totalCoachingMessages}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">最終活動</p>
                          <p className="font-semibold text-gray-900">{trainer.lastActivity}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 監査タブ */}
          <TabsContent value="audit" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">監査ログ</CardTitle>
                <CardDescription>
                  {selectedTrainerDetail
                    ? `${selectedTrainerDetail.name}の監査情報`
                    : "全トレーナーの監査情報"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedTrainerDetail ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h3 className="font-semibold text-gray-900 mb-2">
                        {selectedTrainerDetail.name}
                      </h3>
                      <div className="space-y-2 text-sm">
                        <p>
                          <span className="text-gray-600">顧客数：</span>
                          <span className="font-medium">{selectedTrainerDetail.customersCount}名</span>
                        </p>
                        <p>
                          <span className="text-gray-600">平均達成率：</span>
                          <span className="font-medium">
                            {selectedTrainerDetail.avgCustomerAchievementRate}%
                          </span>
                        </p>
                        <p>
                          <span className="text-gray-600">指導メッセージ数：</span>
                          <span className="font-medium">
                            {selectedTrainerDetail.totalCoachingMessages}
                          </span>
                        </p>
                        <p>
                          <span className="text-gray-600">最終活動：</span>
                          <span className="font-medium">{selectedTrainerDetail.lastActivity}</span>
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" onClick={() => setSelectedTrainerDetail(null)}>
                      戻る
                    </Button>
                  </div>
                ) : (
                  <p className="text-gray-600">トレーナーを選択して監査情報を表示します</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 設定タブ */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">システム設定</CardTitle>
                <CardDescription>アプリケーション全体の設定</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-900">
                    アプリケーション名
                  </label>
                  <Input value="E9th connect" readOnly />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-900">
                    デフォルトカロリー目標
                  </label>
                  <Input
                    type="number"
                    value={defaultCalories}
                    onChange={(e) => setDefaultCalories(e.target.value)}
                    placeholder="2000"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-900">
                    デフォルトPFC比率（タンパク質:脂質:炭水化物）
                  </label>
                  <Input
                    value={defaultPFC}
                    onChange={(e) => setDefaultPFC(e.target.value)}
                    placeholder="30:25:45"
                  />
                </div>
                <Button className="w-full" onClick={handleSaveSettings}>
                  設定を保存
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* ユーザー編集ダイアログ */}
        <Dialog open={showEditUserDialog} onOpenChange={setShowEditUserDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>ユーザー編集</DialogTitle>
              <DialogDescription>ユーザー情報を編集します</DialogDescription>
            </DialogHeader>
            {editingUser && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">名前</label>
                  <Input
                    value={editingUser.name}
                    onChange={(e) =>
                      setEditingUser({ ...editingUser, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">メール</label>
                  <Input
                    value={editingUser.email}
                    onChange={(e) =>
                      setEditingUser({ ...editingUser, email: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">ステータス</label>
                  <Select
                    value={editingUser.status}
                    onValueChange={(value) =>
                      setEditingUser({
                        ...editingUser,
                        status: value as "active" | "inactive",
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">アクティブ</SelectItem>
                      <SelectItem value="inactive">非アクティブ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleSaveUser} className="w-full">
                  保存
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* トレーナー編集ダイアログ */}
        <Dialog open={showEditTrainerDialog} onOpenChange={setShowEditTrainerDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>トレーナー編集</DialogTitle>
              <DialogDescription>トレーナー情報を編集します</DialogDescription>
            </DialogHeader>
            {editingTrainer && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">名前</label>
                  <Input
                    value={editingTrainer.name}
                    onChange={(e) =>
                      setEditingTrainer({ ...editingTrainer, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">顧客数</label>
                  <Input
                    type="number"
                    value={editingTrainer.customersCount}
                    onChange={(e) =>
                      setEditingTrainer({
                        ...editingTrainer,
                        customersCount: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
                <Button onClick={handleSaveTrainer} className="w-full">
                  保存
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
