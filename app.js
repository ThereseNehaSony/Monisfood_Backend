require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors"); 
const logger = require("morgan");
const mongoose = require("mongoose");

const app = express();


app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// Setting up cors
const corsOptions = {
  origin: [
    "https://monis-food.vercel.app",
    "http://localhost:5173",
    "https://www.monis-food.vercel.app"
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
};

app.use(express.json());
app.use(logger("dev"));

// Loading Routes



const userRoutes = require("./routes/userRoutes");
// const adminRoutes = require("./routes/admin");
// const superAdminRoutes = require("./routes/superAdmin");
// const publicRoutes = require("./routes/public");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes")

// // Auth middleware

// const { requireAuth, requireAdminAuth } = require("./middleware/requireAuth");

// // Mounting the routes

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoutes);
// app.use("/api/super-admin", requireAdminAuth, superAdminRoutes);
// app.use("/api/public", publicRoutes);

// // Public Api for accessing images
// app.use("/api/img", express.static(__dirname + "/public/products/"));
// app.use("/api/off", express.static(__dirname + "/public/official/"));


mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(process.env.PORT, () => {
      console.log(`Listening on Port: ${process.env.PORT} - DB Connected`);
    });
  })
  .catch((error) => {
    console.log(error);
  });