const jwt = require("jsonwebtoken");
const Owner = require("../models/owner.schema");

const auth = async (req, res, next) => {
  try {
    // Check for token in both header and cookies
    const tokenFromHeader = req.header("Authorization")?.replace("Bearer ", "");
    const tokenFromCookie = req.cookies?.token;
    const token = tokenFromHeader || tokenFromCookie;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    try {
      // Verify token
      console.log("checking2", token, process.env.JWTSECRETKEY);
      const decoded = jwt.verify(token, process.env.JWTSECRETKEY);

      // Find owner and exclude sensitive fields
      const owner = await Owner.findById(decoded._id).select("-password");

      if (!owner) {
        throw new Error("Owner not found");
      }

      if (owner.isVerified !== "true") {
        return res.status(403).json({
          success: false,
          message: "Account is pending verification",
        });
      }

      // Add owner and token to request object
      req.token = token;
      req.owner = owner;

      next();
    } catch (err) {
      if (err.name === "JsonWebTokenError") {
        return res.status(401).json({
          success: false,
          message: "Invalid token",
        });
      }
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Token expired",
        });
      }
      throw err;
    }
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = auth;
