import { Router } from "express";
import { UserController } from "./user.controller.js";

const router = Router();

router.get("/:address", UserController.checkProfile);
router.post("/", UserController.register);
router.put("/:address", UserController.updateProfile);

export default router;