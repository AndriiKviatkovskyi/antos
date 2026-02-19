import { Router } from "express";
import { EventController } from "./event.controller.js";

const router = Router();

router.get("/memberships/:address", EventController.getUserWallets);
router.get("/invites/:address", EventController.getPendingInvites);
router.get("/charity-wallets", EventController.getAllCharityWallets);

export default router;
