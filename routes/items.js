const express = require("express");
const prisma = require("../db");
const router = express.Router();

// GET /api/items - Get a list of all items
router.get("/", async (req, res, next) => {
  try {
    const items = await prisma.item.findMany({
      orderBy: {
        name: "asc",
      },
    });
    res.status(200).json(items);
  } catch (error) {
    next(error);
  }
});

// GET /api/items/:itemId - Get details for a specific item
router.get("/:itemId", async (req, res, next) => {
  const { itemId } = req.params;
  try {
    const item = await prisma.item.findUnique({
      where: {
        id: itemId,
      },
    });
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }
    res.status(200).json(item);
  } catch (error) {
    if (error.code === "P2023" || error.message.includes("Malformed UUID")) {
      return res.status(400).json({ message: "Invalid item ID format" });
    }
    next(error);
  }
});

// GET /api/items/:itemId/reviews - Get all reviews for a specific item
router.get("/:itemId/reviews", async (req, res, next) => {
  const { itemId } = req.params;
  try {
    const itemExists = await prisma.item.findUnique({
      where: { id: itemId },
      select: { id: true },
    });

    if (!itemExists) {
      return res.status(404).json({ message: "Item not found" });
    }

    const reviews = await prisma.review.findMany({
      where: {
        itemId: itemId,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    res.status(200).json(reviews);
  } catch (error) {
    if (error.code === "P2023" || error.message.includes("Malformed UUID")) {
      return res.status(400).json({ message: "Invalid item ID format" });
    }
    next(error);
  }
});

module.exports = router;

