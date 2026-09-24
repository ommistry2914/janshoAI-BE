import { UserModel } from "../models/user.model";
import logger from "./logger";
import bcrypt from "bcryptjs";
import config from "../config/db";

/**
 * Seeds the initial super admin account on first server boot.
 * All credentials are loaded exclusively from environment variables —
 * nothing is hardcoded in source code.
 */
const initialUserCreation = async (): Promise<void> => {
  try {
    const {
      SUPER_ADMIN_EMAIL,
      SUPER_ADMIN_PASSWORD,
      SUPER_ADMIN_FIRST_NAME,
      SUPER_ADMIN_LAST_NAME,
    } = config;

    // Check if super admin already exists
    const existingAdmin = await UserModel.findOne({ email: SUPER_ADMIN_EMAIL });
    if (existingAdmin) {
      logger.info("Super Admin already exists. Skipping creation.");
      return;
    }

    const hashedPassword = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 12);

    await UserModel.create({
      firstName: SUPER_ADMIN_FIRST_NAME,
      lastName: SUPER_ADMIN_LAST_NAME,
      email: SUPER_ADMIN_EMAIL,
      password: hashedPassword,
      role: "superAdmin",
    });

    logger.info("✅ Super Admin account created successfully!");
  } catch (err) {
    logger.error("❌ Failed to create Super Admin: " + err);
  }
};

export default initialUserCreation;