import { Router } from "express";
import { UserController } from "./user.controller.js";

const router = Router();

router.get("/:address", UserController.checkProfile);
router.post("/", UserController.register);

export default router;