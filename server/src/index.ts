import express from 'express';
import cors from 'cors';
import apiRouter from './routes';
import './config/supabase'; // Supabaseクライアントの初期化（環境変数の読み込みも含む）

const app = express();
const port = 3001;

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

// --- Server Startup ---
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
