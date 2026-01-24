#!/bin/bash

echo "🔧 共有型定義パッケージのセットアップ"

# shared-types をビルド
cd shared-types
npm install
npm run build
cd ..

# ルートプロジェクトに共有型をリンク
npm install ./shared-types

echo "✅ セットアップ完了"
echo ""
echo "次のステップ:"
echo "1. サーバー側: server/types/index.ts から共有型をimport"
echo "2. クライアント側: src/shared/types/index.ts から共有型をimport"
echo "3. 開発時: cd shared-types && npm run watch で型の変更を監視"
