import {
  countActiveParticipants,
  createRoom as createRoomRow,
  endRoom as endRoomRow,
  findActiveHostedRoomByUserId,
  findActiveParticipantByUserId,
  findActiveRooms,
  findActiveRoomsForCleanup,
  findRoomById,
  markAllParticipantsLeft,
  markParticipantLeft,
  upsertRoomParticipant,
} from "../repositories/room.repository";
import { env } from "../config/env";
import { AuthUser } from "../types/auth";
import { generateGuestIdentity, generateRoomName } from "../utils/random";
import {
  createParticipantToken,
  listRoomParticipants,
  deleteRoom,
} from "./livekit.service";

const MAX_ROOM_PARTICIPANTS = 5;

export async function getActiveRooms() {
  return findActiveRooms();
}

export async function createRoom(user: AuthUser) {
  const activeHostedRoom = await findActiveHostedRoomByUserId(user.id);

  if (activeHostedRoom) {
    throw new Error("You already have an active video chat");
  }

  const activeParticipant = await findActiveParticipantByUserId(user.id);

  if (activeParticipant) {
    throw new Error("You are already in a video chat");
  }

  const roomName = generateRoomName(user.id);

  const room = await createRoomRow({
    hostUserId: user.id,
    hostDisplayName: user.displayName,
    roomName,
  });

  await upsertRoomParticipant({
    roomId: room.id,
    userId: user.id,
    participantIdentity: user.id,
    displayName: user.displayName,
  });

  const token = await createParticipantToken({
    roomName,
    participantIdentity: user.id,
    participantName: user.displayName,
  });

  return {
    room,
    participantIdentity: user.id,
    livekit: {
      token,
      wsUrl: env.LIVEKIT_WS_URL,
    },
  };
}

export async function joinRoom(
  roomId: string,
  params: {
    user?: AuthUser;
    displayName?: string;
    participantIdentity?: string;
  },
) {
  const room = await findRoomById(roomId);

  if (!room || room.status !== "active") {
    throw new Error("Room not found");
  }

  if (params.user) {
    const activeHostedRoom = await findActiveHostedRoomByUserId(params.user.id);

    if (activeHostedRoom && activeHostedRoom.id !== room.id) {
      throw new Error("You are currently hosting another video chat");
    }

    const activeParticipant = await findActiveParticipantByUserId(
      params.user.id,
    );

    if (activeParticipant && activeParticipant.room_id !== room.id) {
      throw new Error("You are already in another video chat");
    }
  }

  const participantIdentity =
    params.user?.id ?? params.participantIdentity ?? generateGuestIdentity();

  const displayName =
    params.user?.displayName ?? params.displayName ?? participantIdentity;

  const activeCount = await countActiveParticipants(room.id);

  if (activeCount >= MAX_ROOM_PARTICIPANTS) {
    throw new Error("Room is full");
  }

  await upsertRoomParticipant({
    roomId: room.id,
    userId: params.user?.id ?? null,
    participantIdentity,
    displayName,
  });

  const token = await createParticipantToken({
    roomName: room.room_name,
    participantIdentity,
    participantName: displayName,
  });

  return {
    room,
    participantIdentity,
    livekit: {
      token,
      wsUrl: env.LIVEKIT_WS_URL,
    },
  };
}

export async function leaveRoom(
  roomId: string,
  params: {
    user?: AuthUser;
    participantIdentity?: string;
  },
) {
  const room = await findRoomById(roomId);

  if (!room) {
    throw new Error("Room not found");
  }

  if (room.status !== "active") {
    return;
  }

  const participantIdentity = params.user?.id ?? params.participantIdentity;

  if (!participantIdentity) {
    return;
  }

  await markParticipantLeft({
    roomId: room.id,
    participantIdentity,
  });

  if (params.user?.id === room.host_user_id) {
    try {
      await deleteRoom(room.room_name);
    } catch {
      // LiveKit room may already be gone
    }

    await markAllParticipantsLeft(room.id);
    await endRoomRow(room.id);
  }
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

  await markAllParticipantsLeft(room.id);
  await endRoomRow(room.id);
}

export async function cleanupStaleRooms() {
  const rooms = await findActiveRoomsForCleanup();

  for (const room of rooms) {
    try {
      const participants = await listRoomParticipants(room.room_name);

      if (participants.length === 0) {
        await markAllParticipantsLeft(room.id);
        await endRoomRow(room.id);
      }
    } catch {
      await markAllParticipantsLeft(room.id);
      await endRoomRow(room.id);
    }
  }
}
