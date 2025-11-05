import mongoose from 'mongoose';
import app from './src/app';
import config from './src/config/db';
import logger from "./src/utils/logger";

const startServer = async () => {
  try {
    // await mongoose.connect(config.database_url as string);
    // logger.info("Connected to MongoDB");

    app.listen(config.port, () => {
      logger.info(`Server running at http://localhost:${config.port}`);
    });
  } catch (err) {
    logger.error("Failed to connect to MongoDB: " + err);
  }
};

startServer();
