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
  active_participants_count?: number;
}

export interface RoomParticipantRow {
  id: string;
  room_id: string;
  user_id: string | null;
  participant_identity: string;
  display_name: string;
  joined_at: Date;
  left_at: Date | null;
  created_at: Date;
}

export async function findActiveRooms(): Promise<RoomRow[]> {
  const result = await db.query<RoomRow>(
    `
      select
        r.*,
        count(rp.id)::int as active_participants_count
      from rooms r
      left join room_participants rp
        on rp.room_id = r.id
        and rp.left_at is null
      where r.status = 'active'
      group by r.id
      order by r.created_at desc
    `,
  );

  return result.rows;
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

export async function findActiveHostedRoomByUserId(
  userId: string,
): Promise<RoomRow | null> {
  const result = await db.query<RoomRow>(
    `
      select *
      from rooms
      where host_user_id = $1
        and status = 'active'
      order by created_at desc
      limit 1
    `,
    [userId],
  );

  return result.rows[0] ?? null;
}

export async function findActiveParticipantByUserId(
  userId: string,
): Promise<RoomParticipantRow | null> {
  const result = await db.query<RoomParticipantRow>(
    `
      select rp.*
      from room_participants rp
      join rooms r on r.id = rp.room_id
      where rp.user_id = $1
        and rp.left_at is null
        and r.status = 'active'
      order by rp.joined_at desc
      limit 1
    `,
    [userId],
  );

  return result.rows[0] ?? null;
}

export async function countActiveParticipants(roomId: string): Promise<number> {
  const result = await db.query<{ count: number }>(
    `
      select count(*)::int as count
      from room_participants
      where room_id = $1
        and left_at is null
    `,
    [roomId],
  );

  return result.rows[0]?.count ?? 0;
}

export async function upsertRoomParticipant(params: {
  roomId: string;
  userId: string | null;
  participantIdentity: string;
  displayName: string;
}): Promise<RoomParticipantRow> {
  const result = await db.query<RoomParticipantRow>(
    `
      insert into room_participants (
        room_id,
        user_id,
        participant_identity,
        display_name,
        joined_at,
        left_at
      )
      values ($1, $2, $3, $4, now(), null)
      on conflict (room_id, participant_identity)
      do update set
        user_id = excluded.user_id,
        display_name = excluded.display_name,
        joined_at = now(),
        left_at = null
      returning *
    `,
    [
      params.roomId,
      params.userId,
      params.participantIdentity,
      params.displayName,
    ],
  );

  return result.rows[0];
}

export async function markParticipantLeft(params: {
  roomId: string;
  participantIdentity: string;
}): Promise<void> {
  await db.query(
    `
      update room_participants
      set left_at = now()
      where room_id = $1
        and participant_identity = $2
        and left_at is null
    `,
    [params.roomId, params.participantIdentity],
  );
}

export async function markAllParticipantsLeft(roomId: string): Promise<void> {
  await db.query(
    `
      update room_participants
      set left_at = now()
      where room_id = $1
        and left_at is null
    `,
    [roomId],
  );
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

export async function findActiveRoomsForCleanup(): Promise<RoomRow[]> {
  const result = await db.query<RoomRow>(
    `
      select *
      from rooms
      where status = 'active'
      order by created_at asc
    `,
  );

  return result.rows;
}
