import { Router } from "express";
import {
  createRoomController,
  endRoomController,
  getRoomController,
  joinRoomController,
  leaveRoomController,
} from "../controllers/room.controller";
import { requireAuth } from "../middlewares/require-auth";

const router = Router();

router.post("/", requireAuth, createRoomController);
router.get("/:id", requireAuth, getRoomController);
router.post("/:id/join", requireAuth, joinRoomController);
router.post("/:id/leave", requireAuth, leaveRoomController);
router.post("/:id/end", requireAuth, endRoomController);

export default router;
