import express from "express";
import dotenv from "dotenv";
import connectDB from "./lib/connectDb.js";
import cookieParser from "cookie-parser";
import cors from "cors";

dotenv.config();

const port = process.env.PORT || 3000;

const app = express();

app.use(cookieParser());
app.use(express.json());
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));

import authRoutes from "./routes/auth.routes.js";
app.use("/api/auth", authRoutes);

import messageRoutes from "./routes/message.routes.js";
app.use("/api/message", messageRoutes);

connectDB()
    .then(() => {
        app.listen(port, () => {
            console.log(`Listening on http://localhost:${port}`)
        })
    })
    .catch((error) => {
        console.log("MongoDB connection failed: ", error);
        process.exit(0);
    });