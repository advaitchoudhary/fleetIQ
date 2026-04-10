// notificationController.js

const Notification = require("../model/notificationModel.js");
const asyncHandler = require("express-async-handler");
const { getOrgFilter } = require("../middleware/authMiddleware.js");

// 1. Create a new notification
const createNotification = asyncHandler(async (req, res) => {
  const { message, email, field } = req.body;

  if (!message || !email || !field) {
    res.status(400).json({ message: "Missing required fields" });
    return;
  }

  const notification = new Notification({
    organizationId: req.user?.organizationId || null,
    message,
    email,
    field,
    read: false,
    createdAt: new Date(),
  });

  const savedNotification = await notification.save();
  res.status(201).json(savedNotification);
});

// 2. Fetch all notifications for a given email
//    Optionally, pass a query parameter `?read=true` or `?read=false` to filter by read status.
const getNotificationsByEmail = asyncHandler(async (req, res) => {
  const email = req.params.email;
  if (!email) {
    res.status(400).json({ message: "Missing email parameter" });
    return;
  }

  // If query param `read` is provided, convert it to a boolean
  let filter = { email };
  if (typeof req.query.read !== "undefined") {
    const readValue = req.query.read === "true";
    filter.read = readValue;
  }

  const notifications = await Notification.find(filter).sort({ createdAt: -1 });
  res.status(200).json(notifications);
});

// 3. Mark a single notification as "read" by ID
const markNotificationAsRead = asyncHandler(async (req, res) => {
  const id = req.params.id;
  if (!id) {
    res.status(400).json({ message: "Missing notification ID" });
    return;
  }

  const notification = await Notification.findById(id);
  if (!notification) {
    res.status(404).json({ message: "Notification not found" });
    return;
  }

  // Drivers can only mark their own notifications as read
  if (req.user.role === "driver" && notification.email !== req.user.email) {
    res.status(403).json({ message: "Forbidden" });
    return;
  }

  notification.read = true;
  const updated = await notification.save({ validateBeforeSave: false });
  res.status(200).json(updated);
});

const markAllNotificationsAsRead = asyncHandler(async (req, res) => {
  const orgFilter = getOrgFilter(req);
  // Scope to the calling user's email so admins don't mark driver notifications and vice versa
  const emailFilter = { email: req.user.email };
  await Notification.updateMany({ read: false, ...orgFilter, ...emailFilter }, { $set: { read: true } });
  res.status(200).json({ message: "All notifications marked as read" });
});

// 4. Delete a single notification by ID
const deleteNotification = asyncHandler(async (req, res) => {
  const id = req.params.id;
  if (!id) {
    res.status(400).json({ message: "Missing notification ID" });
    return;
  }

  const notification = await Notification.findById(id);
  if (!notification) {
    res.status(404).json({ message: "Notification not found" });
    return;
  }

  // Drivers can only delete their own notifications
  if (req.user.role === "driver" && notification.email !== req.user.email) {
    res.status(403).json({ message: "Forbidden" });
    return;
  }

  await notification.deleteOne();
  res.status(200).json({ message: "Notification deleted successfully", deletedId: id });
});

const getNotifications = asyncHandler(async (req, res) => {
  const email = req.query.email;
  const orgFilter = getOrgFilter(req);
  let filter = { ...orgFilter };
  // Drivers always see only their own notifications regardless of query param
  if (req.user.role === "driver") {
    filter.email = req.user.email;
  } else if (email) {
    filter.email = email;
  }
  if (typeof req.query.read !== "undefined") {
    filter.read = req.query.read === "true";
  }

  const notifications = await Notification.find(filter).sort({ createdAt: -1 });
  res.status(200).json(notifications);
});

module.exports = {
  createNotification,
  getNotificationsByEmail,
  markNotificationAsRead,
  deleteNotification,
  getNotifications,
  markAllNotificationsAsRead,
};
