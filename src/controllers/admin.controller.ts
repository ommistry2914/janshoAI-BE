import { controllerHandler } from "../utils/controllerHandler";
import { AdminService } from "../services/admin.service";

export const getAdmin = controllerHandler(
  async (req) => {
    const data = await AdminService.findAdmin(req);
    return data;
  },
  {
    statusCode: 200,
    message: "Admin fetched successfully",
  }
);
