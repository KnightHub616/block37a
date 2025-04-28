const express = require("express");
const dotenv = require("dotenv");
const prisma = require("./db");
const authRoutes = require("./routes/auth");
const itemRoutes = require("./routes/items");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get("/api/health", (req, res) => {
  res.send({ status: "UP", timestamp: new Date() });
});

app.use("/api/auth", authRoutes);
app.use("/api/items", itemRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ message: "Something broke!", error: err.message });
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
