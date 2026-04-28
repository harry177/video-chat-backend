import crypto from "crypto";

export function generateGuestIdentity() {
  return `guest_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
}

export function generateRoomName(userId: string) {
  return `room_${userId}_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
}

export function generateInviteCode() {
  return crypto.randomBytes(8).toString("hex");
}
