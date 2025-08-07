import express from 'express';
import cors from 'cors';
import path from 'path';
import apiRouter from './routes';
import './config/environment'; // .envの読み込みを最初に行う

const app = express();
const port = process.env.PORT || 3001;

// --- Middlewares ---
app.use(cors());
app.use(express.json());

// --- API Routes ---
app.use('/api', apiRouter);

// --- Static Files and Frontend Routing for Production ---
if (process.env.NODE_ENV === 'production') {
    const webBuildPath = path.resolve(__dirname, '../../../apps/web/build');
    
    // 静的ファイルの配信
    app.use(express.static(webBuildPath));
    
    // フロントエンドのルーティングに対応
    app.get('*', (req, res) => {
        res.sendFile(path.join(webBuildPath, 'index.html'));
    });
}

// --- Server Startup ---
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
