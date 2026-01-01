import express from "express"
import cookieParser from "cookie-parser";
import cors from 'cors'

const app = express();
const PORT = process.env.PORT || 8000;
const allowedOrigins = ['http://localhost:3000'];

app.listen(PORT, () => { console.log(`🚀 Server running on http://localhost:${PORT}`) })

// Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: allowedOrigins }));

// Specific controllers imports
import userRouter from './routes/auth.route';
import schoolRouter from './routes/institute.route'
import adminRouter from './routes/admin.routes'
import enrollRouter from './routes/addmission.routes'
import financeRouter from './routes/finance.routes'
import studentRouter from './routes/student.routes'

// Routes
app.use('/api/v1/auth/', userRouter);
app.use('/api/v1/institute', schoolRouter);
app.use('/api/v1/admin', adminRouter);
app.use('/api/v1/addmission', enrollRouter);
app.use('/api/v1/finance', financeRouter);
app.use('/api/v1/student', studentRouter);
