import express from 'express';
import cors from 'cors';
import path from 'path';
import apiRouter from './routes';
import './config/supabase'; // Supabaseクライアントの初期化（環境変数の読み込みも含む）

const app = express();
const port = process.env.PORT || 3001;

// --- Middlewares ---
app.use(cors());
app.use(express.json());

// --- API Routes ---
app.use('/api', apiRouter);

// --- Health Check ---
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        env: process.env.NODE_ENV 
    });
});

// --- Static Files and Frontend Routing ---
const webBuildPath = path.resolve(__dirname, '../../../apps/web/build');
const mobileBuildPath = path.resolve(__dirname, '../../../apps/mobile/build');

// Web版の静的ファイル配信（デフォルト）
app.use(express.static(webBuildPath));

// Mobile版の静的ファイル配信（/mobile パス）
app.use('/mobile', express.static(mobileBuildPath));

// Mobile版のルーティング
app.get('/mobile/*', (req, res) => {
    res.sendFile(path.join(mobileBuildPath, 'index.html'));
});

// Web版のフロントエンドルーティング（その他すべて）
app.get('*', (req, res) => {
    res.sendFile(path.join(webBuildPath, 'index.html'));
});

// --- Server Startup ---
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
