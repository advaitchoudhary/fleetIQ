const express = require("express");

const {
  createNotification,  
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  deleteNotification,
} = require("../controller/notificationController.js");

const route = express.Router();

route.post("/", createNotification);
route.get("/", getNotifications);
route.post("/markAllRead", markAllNotificationsAsRead);
route.post("/:id/markRead", markNotificationAsRead);
route.post("/:id", deleteNotification);

module.exports = route;