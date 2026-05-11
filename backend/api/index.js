require("dotenv").config();

const app = require("../src/app");
const connectDB = require("../src/config/db");
const { seedAdmin } = require("../src/controllers/authController");

let bootstrapPromise;

module.exports = async (req, res) => {
  try {
    if (!bootstrapPromise) {
      bootstrapPromise = (async () => {
        await connectDB();
        await seedAdmin();
      })();
    }

    await bootstrapPromise;
    return app(req, res);
  } catch (error) {
    console.error("Backend bootstrap failed:", error);
    return res.status(500).json({ message: "Server startup failed" });
  }
};