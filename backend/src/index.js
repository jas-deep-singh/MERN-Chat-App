import express from "express";
import dotenv from "dotenv";
import connectDB from "./lib/connectDb.js";
import cookieParser from "cookie-parser";

dotenv.config();

const port = process.env.PORT || 3000;

const app = express();

app.use(cookieParser());
app.use(express.json());

import authRoutes from "./routes/auth.routes.js";
app.use("/api/auth", authRoutes);

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