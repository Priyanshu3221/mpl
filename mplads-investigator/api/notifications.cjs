const sampleNotifications = [
  {
    id: "NOTIF-001",
    title: "High-Priority Flag Raised",
    message: "Detection engine identified financial outlier on MPLADS-2024-001.",
    timestamp: "10 mins ago",
    read: false,
    type: "warning"
  }
];

module.exports = (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.status(200).json(sampleNotifications);
};
