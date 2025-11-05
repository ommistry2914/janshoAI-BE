import { Router } from "express";
import { generateVoice } from "../controllers/voiceGeneration.controller";

const router = Router();

router.post("/generateVoice",generateVoice);

export default router;
