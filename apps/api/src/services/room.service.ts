import {
  createRoom as createRoomRow,
  endRoom as endRoomRow,
  findRoomById,
  markParticipantLeft,
  upsertRoomParticipant,
} from "../repositories/room.repository";
import { env } from "../config/env";
import { AuthUser } from "../types/auth";
import { generateRoomName } from "../utils/random";
import { createParticipantToken, deleteRoom } from "./livekit.service";

export async function createRoom(user: AuthUser) {
  const roomName = generateRoomName(user.id);

  const room = await createRoomRow({
    hostUserId: user.id,
    hostDisplayName: user.displayName,
    roomName,
  });

  await upsertRoomParticipant({
    roomId: room.id,
    userId: user.id,
    displayName: user.displayName,
  });

  const token = await createParticipantToken({
    roomName,
    participantIdentity: user.id,
    participantName: user.displayName,
  });

  return {
    room,
    livekit: {
      token,
      wsUrl: env.LIVEKIT_WS_URL,
    },
  };
}

export async function getRoomById(roomId: string) {
  return findRoomById(roomId);
}

export async function joinRoom(roomId: string, user: AuthUser) {
  const room = await findRoomById(roomId);

  if (!room || room.status !== "active") {
    throw new Error("Room not found");
  }

  await upsertRoomParticipant({
    roomId: room.id,
    userId: user.id,
    displayName: user.displayName,
  });

  const token = await createParticipantToken({
    roomName: room.room_name,
    participantIdentity: user.id,
    participantName: user.displayName,
  });

  return {
    room,
    livekit: {
      token,
      wsUrl: env.LIVEKIT_WS_URL,
    },
  };
}

export async function leaveRoom(roomId: string, user: AuthUser) {
  const room = await findRoomById(roomId);

  if (!room) {
    throw new Error("Room not found");
  }

  await markParticipantLeft({
    roomId: room.id,
    userId: user.id,
  });
}

export async function endRoom(roomId: string, user: AuthUser) {
  const room = await findRoomById(roomId);

  if (!room) {
    throw new Error("Room not found");
  }

  if (room.host_user_id !== user.id) {
    throw new Error("Forbidden");
  }

  if (room.status !== "active") {
    return;
  }

  try {
    await deleteRoom(room.room_name);
  } catch {
    // room may already be gone
  }

  await endRoomRow(room.id);
}
