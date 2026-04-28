import { db } from "../db";

export type RoomStatus = "active" | "ended";

export interface RoomRow {
  id: string;
  host_user_id: string;
  host_display_name: string;
  room_name: string;
  status: RoomStatus;
  started_at: Date | null;
  ended_at: Date | null;
  created_at: Date;
}

export interface RoomParticipantRow {
  id: string;
  room_id: string;
  user_id: string;
  display_name: string;
  joined_at: Date;
  left_at: Date | null;
  created_at: Date;
}

export async function createRoom(params: {
  hostUserId: string;
  hostDisplayName: string;
  roomName: string;
}): Promise<RoomRow> {
  const result = await db.query<RoomRow>(
    `
      insert into rooms (
        host_user_id,
        host_display_name,
        room_name,
        status,
        started_at
      )
      values ($1, $2, $3, 'active', now())
      returning *
    `,
    [params.hostUserId, params.hostDisplayName, params.roomName],
  );

  return result.rows[0];
}

export async function findRoomById(id: string): Promise<RoomRow | null> {
  const result = await db.query<RoomRow>(
    `
      select *
      from rooms
      where id = $1
      limit 1
    `,
    [id],
  );

  return result.rows[0] ?? null;
}

export async function endRoom(id: string): Promise<void> {
  await db.query(
    `
      update rooms
      set status = 'ended',
          ended_at = now()
      where id = $1
        and status = 'active'
    `,
    [id],
  );
}

export async function upsertRoomParticipant(params: {
  roomId: string;
  userId: string;
  displayName: string;
}): Promise<RoomParticipantRow> {
  const result = await db.query<RoomParticipantRow>(
    `
      insert into room_participants (
        room_id,
        user_id,
        display_name,
        joined_at,
        left_at
      )
      values ($1, $2, $3, now(), null)
      on conflict (room_id, user_id)
      do update set
        display_name = excluded.display_name,
        joined_at = now(),
        left_at = null
      returning *
    `,
    [params.roomId, params.userId, params.displayName],
  );

  return result.rows[0];
}

export async function markParticipantLeft(params: {
  roomId: string;
  userId: string;
}): Promise<void> {
  await db.query(
    `
      update room_participants
      set left_at = now()
      where room_id = $1
        and user_id = $2
        and left_at is null
    `,
    [params.roomId, params.userId],
  );
}
