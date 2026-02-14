import { Router } from "express";
import { EventController } from "./event.controller.js";

const router = Router();

router.get("/memberships/:address", EventController.getUserWallets);
router.get("/invites/:address", EventController.getPendingInvites);

export default router;
