const express = require("express");
const prisma = require("../db");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/me", protect, async (req, res, next) => {
  const userId = req.user.id;
  try {
    const userComments = await prisma.comment.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        review: {
          select: {
            id: true,
            text: true,
            itemId: true,
            item: {
              select: { name: true },
            },
          },
        },
      },
    });
    res.status(200).json(userComments);
  } catch (error) {
    next(error);
  }
});

router.put("/:commentId", protect, async (req, res, next) => {
  const { commentId } = req.params;
  const { text } = req.body;
  const userId = req.user.id;

  if (text === undefined || text.trim() === "") {
    return res.status(400).json({ message: "Comment text cannot be empty" });
  }

  try {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (comment.userId !== userId) {
      return res
        .status(403)
        .json({
          message: "Forbidden: You are not authorized to update this comment",
        });
    }

    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: { text: text },
      include: {
        user: { select: { id: true, username: true } },
        review: { select: { id: true, itemId: true } },
      },
    });
    res.status(200).json(updatedComment);
  } catch (error) {
    if (error.code === "P2023" || error.message.includes("Malformed UUID")) {
      return res.status(400).json({ message: "Invalid comment ID format" });
    }
    next(error);
  }
});

router.delete("/:commentId", protect, async (req, res, next) => {
  const { commentId } = req.params;
  const userId = req.user.id;

  try {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (comment.userId !== userId) {
      return res
        .status(403)
        .json({
          message: "Forbidden: You are not authorized to delete this comment",
        });
    }

    await prisma.comment.delete({
      where: { id: commentId },
    });

    res.status(200).json({ message: "Comment deleted successfully" });
  } catch (error) {
    if (error.code === "P2023" || error.message.includes("Malformed UUID")) {
      return res.status(400).json({ message: "Invalid comment ID format" });
    }
    next(error);
  }
});

module.exports = router;
