import { AccessToken, RoomServiceClient } from "livekit-server-sdk";
import { env } from "../config/env";

function getRoomServiceClient() {
  return new RoomServiceClient(
    env.LIVEKIT_HTTP_URL,
    env.LIVEKIT_API_KEY,
    env.LIVEKIT_API_SECRET,
  );
}

export async function createParticipantToken(params: {
  roomName: string;
  participantIdentity: string;
  participantName: string;
}) {
  const at = new AccessToken(env.LIVEKIT_API_KEY, env.LIVEKIT_API_SECRET, {
    identity: params.participantIdentity,
    name: params.participantName,
    ttl: "10m",
  });

  at.addGrant({
    roomJoin: true,
    room: params.roomName,
    canPublish: true,
    canSubscribe: true,
  });

  return at.toJwt();
}

export async function deleteRoom(roomName: string) {
  const client = getRoomServiceClient();
  await client.deleteRoom(roomName);
}

export async function listRoomParticipants(roomName: string) {
  const client = getRoomServiceClient();

  return client.listParticipants(roomName);
}
