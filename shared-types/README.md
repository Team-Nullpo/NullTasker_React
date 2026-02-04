# @nulltasker/shared-types

サーバーとクライアント間で共有する型定義パッケージ。

## セットアップ

```bash
cd shared-types
npm install
npm run build
```

## 使用方法

### サーバー側

```typescript
import type { User, LoginResponse } from "@nulltasker/shared-types";
```

### クライアント側

```typescript
import type { User, LoginResponse } from "@nulltasker/shared-types";
```

## ビルド

```bash
npm run build    # 一度だけビルド
npm run watch    # 変更を監視
```

## 型の追加・変更

1. `src/index.ts` を編集
2. `npm run build` でビルド
3. サーバー・クライアント側で自動的に型が更新される
