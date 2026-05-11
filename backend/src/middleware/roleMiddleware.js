const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    const normalizedRole = String(req.user?.role || "").toLowerCase();
    const normalizedAllowedRoles = roles.map((role) => String(role).toLowerCase());

    if (!req.user || !normalizedAllowedRoles.includes(normalizedRole)) {
      return res.status(403).json({ message: "Access denied" });
    }
    next();
  };
};

module.exports = { authorizeRoles };
