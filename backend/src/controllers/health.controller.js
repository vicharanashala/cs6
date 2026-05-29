// src/controllers/health.controller.js
// Handler for the health check endpoint

export const getHealthStatus = (req, res) => {
  res.status(200).json({
    success: true,
    message: "API running",
  });
};
