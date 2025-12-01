# Resume API

一個基於 Express 的履歷生成 API，支援生成 HTML 和 PDF 格式的履歷。

## 功能

- 接收 JSON Resume 格式的履歷資料
- 生成 HTML 格式的履歷
- 生成 PDF 格式的履歷
- 支援查看和下載生成的履歷

## 本地開發

### 安裝依賴

```bash
npm install
```

### 啟動開發伺服器

```bash
npm run dev
```

伺服器將在 `http://localhost:3000` 運行。

### 測試 API

```bash
npm test
```

## 部署到 Vercel

### 前置需求

1. 安裝 Vercel CLI：
```bash
npm i -g vercel
```

2. 登入 Vercel：
```bash
vercel login
```

### 部署步驟

1. 在專案根目錄執行：
```bash
vercel
```

2. 首次部署會詢問一些問題，按照提示回答即可。

3. 部署到生產環境：
```bash
vercel --prod
```

### 環境變數

Vercel 會自動設置 `VERCEL` 環境變數，應用程式會自動使用內存存儲模式。

### 注意事項

- **Puppeteer 在 Vercel 上的限制**：
  - Vercel 的 serverless 函數對 Puppeteer 有一些限制，因為標準的 Puppeteer 會下載完整的 Chromium（約 300MB）
  - 應用程式已配置為在 Vercel 環境中自動檢測並使用 `@sparticuz/chromium`（如果可用）
  - 如果遇到 PDF 生成問題，可以安裝 `@sparticuz/chromium`：
    ```bash
    npm install @sparticuz/chromium
    ```
  - 或者考慮使用其他 PDF 生成服務（如外部 API）

- **存儲限制**：
  - 在 Vercel 上使用內存存儲，資料不會持久化（每次函數冷啟動會清空）
  - 如果需要持久化存儲，建議使用：
    - Vercel KV (Redis) - 適合小型資料
    - 外部存儲服務（如 AWS S3） - 適合檔案存儲
    - 資料庫存儲 - 適合結構化資料

- **函數超時**：
  - 已設置 `maxDuration: 30` 秒（Vercel Pro 計劃）
  - 免費計劃限制為 10 秒，可能需要升級計劃以支援 PDF 生成

## API 端點

### POST /resume

創建新的履歷。

**請求體**：JSON Resume 格式的陣列

**回應**：
```json
[
  {
    "id": "uuid",
    "theme": "consultant-polished",
    "viewUrl": "/resume/{id}",
    "pdfUrl": "/resume/{id}?format=pdf",
    "html": "..."
  }
]
```

### GET /resume/:id

取得履歷的 HTML 版本。

### GET /resume/:id?format=pdf

取得履歷的 PDF 版本。

## 使用 Postman

匯入 `Resume_API.postman_collection.json` 到 Postman 中即可開始測試。

## 專案結構

```
resume-api/
├── api/
│   └── index.js          # Vercel serverless 函數入口
├── src/
│   ├── app.js            # Express 應用程式（本地開發）
│   ├── services/
│   │   ├── generator.js  # HTML/PDF 生成服務
│   │   └── storage.js    # 存儲服務（自動適配本地/serverless）
│   └── templates/
│       └── resume.hbs    # Handlebars 模板
├── storage/              # 本地開發時的檔案存儲目錄
├── vercel.json           # Vercel 配置
└── package.json
```

