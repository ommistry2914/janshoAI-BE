import { RequestHandler } from "express";
import { controllerHandler } from "../utils/controllerHandler";

export const generateVoice = controllerHandler(
  async (req) => {
    
    return {  };
  },
  {
    statusCode: 201,
    message: "User registered successfully ",
  }
);
