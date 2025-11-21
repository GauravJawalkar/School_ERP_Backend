import express from "express"
import { db } from "./db";

const app = express();
const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    db
})

// Middleware to parse JSON requests
app.use(express.json());