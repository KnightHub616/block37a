const express = require('express');
const prisma = require('../db');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/me', protect, async (req, res, next) => {
  const userId = req.user.id;
  try {
    const userReviews = await prisma.review.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        item: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    res.status(200).json(userReviews);
  } catch (error) {
    next(error);
  }
});

router.get('/:reviewId', async (req, res, next) => {
  const { reviewId } = req.params;
  try {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        user: { select: { id: true, username: true } },
        item: { select: { id: true, name: true } },
      },
    });
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    res.status(200).json(review);
  } catch (error) {
     if (error.code === 'P2023' || error.message.includes('Malformed UUID')) {
         return res.status(400).json({ message: 'Invalid review ID format' });
    }
    next(error);
  }
});

router.put('/:reviewId', protect, async (req, res, next) => {
  const { reviewId } = req.params;
  const { text, rating } = req.body;
  const userId = req.user.id;

  if (text === undefined && rating === undefined) {
    return res.status(400).json({ message: 'Review text or rating must be provided for update' });
  }
  let ratingNum;
  if (rating !== undefined) {
      ratingNum = parseInt(rating, 10);
      if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
        return res.status(400).json({ message: 'Rating must be a number between 1 and 5' });
      }
  }

  try {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    if (review.userId !== userId) {
      return res.status(403).json({ message: 'Forbidden: You are not authorized to update this review' });
    }

    const updateData = {};
    if (text !== undefined) {
        updateData.text = text;
    }
    if (ratingNum !== undefined) {
        updateData.rating = ratingNum;
    }

    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: updateData,
      include: {
        user: { select: { id: true, username: true } },
        item: { select: { id: true, name: true } }
      }
    });
    res.status(200).json(updatedReview);
  } catch (error) {
     if (error.code === 'P2023' || error.message.includes('Malformed UUID')) {
         return res.status(400).json({ message: 'Invalid review ID format' });
    }
    next(error);
  }
});

router.delete('/:reviewId', protect, async (req, res, next) => {
  const { reviewId } = req.params;
  const userId = req.user.id;

  try {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    if (review.userId !== userId) {
      return res.status(403).json({ message: 'Forbidden: You are not authorized to delete this review' });
    }

    await prisma.review.delete({
      where: { id: reviewId },
    });

    res.status(200).json({ message: 'Review deleted successfully' });

  } catch (error) {
     if (error.code === 'P2023' || error.message.includes('Malformed UUID')) {
         return res.status(400).json({ message: 'Invalid review ID format' });
    }
    if (error.code === 'P2014') {
         return res.status(409).json({ message: 'Cannot delete review, related data exists (e.g., comments)' });
    }
    next(error);
  }
});

module.exports = router;
