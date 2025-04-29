const jwt = require("jsonwebtoken");
const prisma = require("../db");

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      if (!token || typeof token !== 'string' || token.trim() === '') {
          return res.status(401).json({ message: "Not authorized, invalid token format in header" });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await prisma.user.findUnique({
        where: {
          id: decoded.userId
        },
        select: {
          id: true,
          username: true,
          email: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!req.user) {
        return res.status(401).json({ message: "Not authorized, user not found" });
      }

      next();

    } catch (error) {
      if (error.name === "JsonWebTokenError") {
        return res.status(401).json({ message: `Not authorized, token error: ${error.message}` });
      }
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Not authorized, token expired" });
      }
      return res.status(401).json({ message: "Not authorized" });
    }
  } else {
    return res.status(401).json({ message: "Not authorized, no token provided or invalid format" });
  }
};

module.exports = { protect };
