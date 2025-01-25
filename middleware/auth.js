const jwt = require("jsonwebtoken");

const auth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No auth token found",
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWTSECRETKEY);
    req.owner = decoded;
    next();
  } catch (error) {
    console.error("Auth error:", error);
    res.status(401).json({
      success: false,
      message: "Invalid auth token",
    });
  }
};

module.exports = auth;
