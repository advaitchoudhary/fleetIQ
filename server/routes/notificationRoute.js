const express = require("express");

const {
  createNotification,  
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  deleteNotification,
} = require("../controller/notificationController.js");

const { protect } = require("../middleware/authMiddleware.js");

const route = express.Router();

route.post("/", protect, createNotification);
route.get("/", protect, getNotifications);
route.post("/markAllRead", protect, markAllNotificationsAsRead);
route.post("/:id/markRead", protect, markNotificationAsRead);
route.delete("/:id", protect, deleteNotification);

module.exports = route;