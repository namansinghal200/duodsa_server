import jwt from "jsonwebtoken";
import User from "../models/User.js"; // Make sure you have a User model

/**
 * @desc    Middleware to protect routes by verifying JWT
 */
export const protect = async (req, res, next) => {
  let token;

  // Check if the authorization header exists and starts with "Bearer"
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Get token from header (format: "Bearer <token>")
      token = req.headers.authorization.split(" ")[1];

      // Verify the token using your secret key
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Attach the user's information to the request object for later use
      // This is useful if you want to know WHO is submitting the code
      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        return res
          .status(401)
          .json({ message: "Not authorized, user not found" });
      }

      // If token is valid and user exists, proceed to the next function (the controller)
      next();
    } catch (error) {
      console.error("Token verification failed:", error);
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  // If there's no token at all
  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }
};
