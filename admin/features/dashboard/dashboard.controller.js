const service = require("./dashboard.service");
exports.index = async (req, res) => {
  try {
    const data = await service.getStats();
    res.render("dashboard", { title: "Dashboard", page: "dashboard", ...data });
  } catch (error) {
    console.error("dashboard error:", error);
    res.status(500).send("Dashboard error");
  }
};

exports.stats = async (req, res) => {
  try {
    const data = await service.getStats();
    res.json({ success: true, ...data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
