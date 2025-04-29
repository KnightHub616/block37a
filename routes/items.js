const express = require("express");
const prisma = require("../db");
const { protect } = require("../middleware/authMiddleware");


const router = express.Router();

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
          select: { id: true, username: true },
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

router.post("/:itemId/reviews", protect, async (req, res, next) => {
  const { itemId } = req.params;
  const { text, rating } = req.body;
  const userId = req.user.id;

  if (!text || rating === undefined) {
    return res
      .status(400)
      .json({ message: "Review text and rating are required" });
  }
  const ratingNum = parseInt(rating, 10);
  if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    return res
      .status(400)
      .json({ message: "Rating must be a number between 1 and 5" });
  }

  try {
    const itemExists = await prisma.item.findUnique({
      where: { id: itemId },
      select: { id: true },
    });
    if (!itemExists) {
      return res.status(404).json({ message: "Item not found" });
    }

    const newReview = await prisma.review.create({
      data: {
        text: text,
        rating: ratingNum,
        userId: userId,
        itemId: itemId,
      },
      include: {
        user: { select: { id: true, username: true } },
        item: { select: { id: true, name: true } },
      },
    });
    res.status(201).json(newReview);
  } catch (error) {
    if (error.code === "P2002") {
      return res
        .status(409)
        .json({ message: "You have already reviewed this item" });
    }
    if (error.code === "P2023" || error.message.includes("Malformed UUID")) {
      return res.status(400).json({ message: "Invalid item ID format" });
    }
    next(error);
  }
});

module.exports = router;
