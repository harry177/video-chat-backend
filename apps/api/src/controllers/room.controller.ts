import { Request, Response } from "express";
import { z } from "zod";
import {
  createRoom,
  endRoom,
  getActiveRooms,
  joinRoom,
  leaveRoom,
} from "../services/room.service";

const joinRoomSchema = z.object({
  displayName: z.string().trim().min(1).max(40).optional(),
  participantIdentity: z.string().trim().min(1).max(120).optional(),
});

export async function getActiveRoomsController(_req: Request, res: Response) {
  const rooms = await getActiveRooms();

  return res.status(200).json({
    rooms,
  });
}

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

export async function joinRoomController(
  req: Request<{ id: string }>,
  res: Response,
) {
  try {
    const parsed = joinRoomSchema.safeParse(req.body ?? {});

    if (!parsed.success) {
      return res.status(400).json({
        error: "Invalid request body",
        details: parsed.error.flatten(),
      });
    }

    const result = await joinRoom(req.params.id, {
      user: req.user,
      displayName: parsed.data.displayName,
      participantIdentity: parsed.data.participantIdentity,
    });

    return res.status(200).json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to join room";

    const status =
      message === "Room not found"
        ? 404
        : message === "Room is full"
          ? 409
          : 400;

    return res.status(status).json({
      error: message,
    });
  }
}

export async function leaveRoomController(
  req: Request<{ id: string }>,
  res: Response,
) {
  try {
    const parsed = joinRoomSchema.safeParse(req.body ?? {});

    if (!parsed.success) {
      return res.status(400).json({
        error: "Invalid request body",
        details: parsed.error.flatten(),
      });
    }

    await leaveRoom(req.params.id, {
      user: req.user,
      participantIdentity: parsed.data.participantIdentity,
    });

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
    const message = error instanceof Error ? error.message : "Failed to end room";

    const status =
      message === "Room not found" ? 404 : message === "Forbidden" ? 403 : 400;

    return res.status(status).json({
      error: message,
    });
  }
}