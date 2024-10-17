module.exports = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      console.error("Access denied for user:", req.user.userId);
      return res.status(403).json({ message: "Access denied" });
    }
    next();
  };
};
