import express from "express"
import cookieParser from "cookie-parser";
import cors from 'cors'

const app = express();
const PORT = process.env.PORT || 8000;
const allowedOrigins = ['http://localhost:3000'];

app.listen(PORT, () => { console.log(`🚀 Server running on http://localhost:${PORT}`); })

// Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: allowedOrigins }));

// Specific controllers imports
import userRouter from './routes/user.route';
import instituteRouter from './routes/institute.route'

// Routes
app.use('/api/v1/user/', userRouter);
app.use('/api/v1/institute', instituteRouter);