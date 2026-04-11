import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import videoRouter from "./video.js";
import aiRouter from "./ai.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(videoRouter);
router.use(aiRouter);

export default router;
