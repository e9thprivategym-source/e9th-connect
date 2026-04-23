import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { Apple, BarChart3, MessageSquare, Trophy, Users, Shield, AlertCircle } from "lucide-react";

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  missing_params: "ログインパラメータが不正です。もう一度お試しください。",
  server_config: "サーバー設定に問題があります。管理者にお問い合わせください。",
  no_user_id: "LINE ユーザー情報の取得に失敗しました。",
  oauth_failed: "LINE 認証に失敗しました。もう一度お試しください。",
  access_denied: "LINE 認証がキャンセルされました。",
};

/**
 * ロール別ホームページ
 * 認証状態に応じて、顧客・トレーナー・管理者のホームページにリダイレクト
 */
export default function Home() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  // OAuth コールバックからのエラーパラメータを読み取る
  const searchParams = new URLSearchParams(window.location.search);
  const oauthError = searchParams.get("error");
  const errorMessage = oauthError ? (OAUTH_ERROR_MESSAGES[oauthError] ?? `認証エラー: ${oauthError}`) : null;

  useEffect(() => {
    if (!loading && user) {
      // ロールに応じてリダイレクト
      if (user.role === 'customer') {
        setLocation('/customer/home');
      } else if (user.role === 'trainer') {
        setLocation('/trainer/dashboard');
      } else if (user.role === 'admin') {
        setLocation('/admin/dashboard');
      }
    }
  }, [user, loading, setLocation]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4 py-12">
          {/* OAuth エラーバナー */}
          {errorMessage && (
            <div className="flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive mb-6">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* ヘッダー */}
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-white font-bold text-lg">E9</span>
              </div>
              <h1 className="text-2xl font-bold">E9th connect</h1>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  window.location.href = getLoginUrl();
                }}
              >
                ログイン
              </Button>
              <Button
                onClick={() => {
                  window.location.href = getLoginUrl();
                }}
              >
                サインアップ
              </Button>
            </div>
          </div>

          {/* メインコンテンツ */}
          <div className="grid gap-12 mb-16">
            {/* ヒーロー */}
            <div className="text-center space-y-6 py-12">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                科学的根拠に基づいた
                <br />
                ボディメイク管理
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                E9th PRIVATE GYM向けAI食事管理＆コーチングアプリ。
                トレーナーと密に連携しながら、減量・増量を成功させます。
              </p>
              <Button
                onClick={() => {
                  window.location.href = getLoginUrl();
                }}
                size="lg"
                className="mt-4"
              >
                今すぐ始める
              </Button>
            </div>

            {/* 機能紹介 */}
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center mb-4">
                    <Apple className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <CardTitle>AI食事解析</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    写真をアップロードするだけで、AI が栄養情報を自動解析。PFC（タンパク質・脂質・炭水化物）を正確に計算します。
                  </CardDescription>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center mb-4">
                    <MessageSquare className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <CardTitle>AIコーチング</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    E9th AI Coach があなたの食事をリアルタイム分析。科学的根拠に基づいた個別フィードバックを提供します。
                  </CardDescription>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center mb-4">
                    <BarChart3 className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <CardTitle>進捗トラッキング</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    日々の食事記録から週間達成率を自動集計。グラフで可視化し、目標達成をサポートします。
                  </CardDescription>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-orange-100 dark:bg-orange-900 flex items-center justify-center mb-4">
                    <Users className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <CardTitle>トレーナー連携</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    トレーナーとリアルタイムでチャット。食事記録時に自動通知され、個別指導がスムーズに進みます。
                  </CardDescription>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-red-100 dark:bg-red-900 flex items-center justify-center mb-4">
                    <Trophy className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                  <CardTitle>報酬システム</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    毎日の記録達成でポイント・バッジを獲得。ゲーミフィケーションで継続をサポートします。
                  </CardDescription>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center mb-4">
                    <Shield className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <CardTitle>ダイエットモード</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    バルクアップ・ケトジェニック・通常モードから選択。モードに応じてマクロ目標が自動調整されます。
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center py-12 border-t">
            <h3 className="text-2xl font-bold mb-4">今すぐ始めましょう</h3>
            <p className="text-muted-foreground mb-6">
              E9th PRIVATE GYM の顧客・トレーナーの方はログインしてください
            </p>
            <Button
              onClick={() => {
                window.location.href = getLoginUrl();
              }}
              size="lg"
              className="mb-8"
            >
              ログイン / サインアップ
            </Button>

            {/* 管理者・トレーナーログインリンク */}
            <div className="flex justify-center gap-4 text-sm">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  window.location.href = getLoginUrl();
                }}
              >
                管理者ログイン
              </Button>
              <span className="text-muted-foreground">|</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  window.location.href = getLoginUrl();
                }}
              >
                トレーナーログイン
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ユーザーが認証されている場合は、useEffect でリダイレクト済み
  return null;
}
