import "dotenv/config";
import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import helmet from "helmet";
import cors from "cors";
import dotenv from "dotenv";
import {
  userRouter,
} from "./routes/index.js";
const app = express();

app.use(cors());
app.use(helmet());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ extended: true }));


app.get("/backend/ping", (req, res) => res.send("Hello World!"));

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("connected to db");
  })
  .catch((e) => {
    console.error("Error connecting to MongoDB:", e);
  });



app.use("/backend/user", userRouter);




app.listen(4000, () => console.log(`Express app running on port ${4000}!`));
