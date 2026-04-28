import { Router } from "express";
import {
  createRoomController,
  endRoomController,
  getActiveRoomsController,
  joinRoomController,
  leaveRoomController,
} from "../controllers/room.controller";
import { requireAuth } from "../middlewares/require-auth";
import { optionalAuth } from "../middlewares/optional-auth";

const router = Router();

router.get("/active", getActiveRoomsController);

router.post("/", requireAuth, createRoomController);

router.post("/:id/join", optionalAuth, joinRoomController);
router.post("/:id/leave", optionalAuth, leaveRoomController);

router.post("/:id/end", requireAuth, endRoomController);

export default router;
