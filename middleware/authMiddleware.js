const jwt = require("jsonwebtoken");
const prisma = require("../db"); // Adjust path if needed

const protect = async (req, res, next) => {
  let token;

  // 1. Check if Authorization header exists and starts with Bearer
  if (
    req.headers.authorization && // Corrected typo: authorization
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // 2. Extract token
      token = req.headers.authorization.split(" ")[1]; // Get token part

      // 3. Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 4. Find user based on token payload (excluding password)
      req.user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          username: true,
          email: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // 5. Check if user exists
      if (!req.user) {
        // If user ID in a valid token doesn't exist in DB
        return res.status(401).json({ message: "Not authorized, user not found" }); // Or more generic: "Not authorized"
      }

      // 6. User is valid, proceed to the next middleware/route handler
      next();

    } catch (error) {
      // Handle errors during token verification or user fetching
      console.error("Authentication error:", error.name, error.message); // Log specific error

      if (error.name === "JsonWebTokenError") {
        return res.status(401).json({ message: "Not authorized, token invalid" });
      }
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Not authorized, token expired" });
      }
      // Fallback for other errors within the try block
      return res.status(401).json({ message: "Not authorized" });
    }
  } else {
    // 7. Handle case where header is missing or malformed
    return res.status(401).json({ message: "Not authorized, no token provided or invalid format" });
  }
};

module.exports = { protect };
