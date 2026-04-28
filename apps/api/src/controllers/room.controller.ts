import { Request, Response } from "express";
import {
  createRoom,
  endRoom,
  getRoomById,
  joinRoom,
  leaveRoom,
} from "../services/room.service";

export async function createRoomController(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const result = await createRoom(req.user);

    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      error: error instanceof Error ? error.message : "Failed to create room",
    });
  }
}

export async function getRoomController(
  req: Request<{ id: string }>,
  res: Response,
) {
  try {
    const room = await getRoomById(req.params.id);

    if (!room) {
      return res.status(404).json({
        error: "Room not found",
      });
    }

    return res.status(200).json({
      room,
    });
  } catch (error) {
    return res.status(400).json({
      error: error instanceof Error ? error.message : "Failed to get room",
    });
  }
}

export async function joinRoomController(
  req: Request<{ id: string }>,
  res: Response,
) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const result = await joinRoom(req.params.id, req.user);

    return res.status(200).json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to join room";

    return res.status(message === "Room not found" ? 404 : 400).json({
      error: message,
    });
  }
}

export async function leaveRoomController(
  req: Request<{ id: string }>,
  res: Response,
) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    await leaveRoom(req.params.id, req.user);

    return res.status(200).json({
      ok: true,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to leave room";

    return res.status(message === "Room not found" ? 404 : 400).json({
      error: message,
    });
  }
}

export async function endRoomController(
  req: Request<{ id: string }>,
  res: Response,
) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    await endRoom(req.params.id, req.user);

    return res.status(200).json({
      ok: true,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to end room";

    const status =
      message === "Room not found" ? 404 : message === "Forbidden" ? 403 : 400;

    return res.status(status).json({
      error: message,
    });
  }
}
