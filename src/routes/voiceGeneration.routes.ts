import { Router } from "express";
import { generateVoice } from "../controllers/voiceGeneration.controller";

const router = Router();

router.get("/",generateVoice);

export default router;
