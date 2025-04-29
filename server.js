const express = require("express");
const dotenv = require("dotenv");
const prisma = require("./db");
const authRoutes = require("./routes/auth");
const itemRoutes = require("./routes/items");
const reviewRoutes = require("./routes/reviews");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use((req, res, next) => {
  console.log(`>>> Incoming Request: ${req.method} ${req.originalUrl}`);
  next();
});

app.get("/api/health", (req, res) => {
  res.send({ status: "UP", timestamp: new Date() });
});

app.use("/api/auth", authRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/reviews", reviewRoutes);

app.use((err, req, res, next) => {
  console.error("Error caught by middleware:", err);
  res.status(err.status || 500).send({
    message: err.message || "Something went wrong!",
  });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  console.log("Prisma Client disconnected. Shutting down server.");
  process.exit(0);
});
process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  console.log("Prisma Client disconnected. Shutting down server.");
  process.exit(0);
});

module.exports = app;
