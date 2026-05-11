require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");
const { seedAdmin } = require("./controllers/authController");

const startServer = async () => {
  await connectDB();
  await seedAdmin();

  const port = process.env.PORT || 5000;
  app.listen(port, () => {
    console.log(`Server started on port ${port}`);
  });
};

if (require.main === module) {
  startServer();
}

module.exports = {
  app,
  startServer,
};
