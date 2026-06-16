import { listRecords, createRecord } from "@/lib/records";
import { pool } from "@/lib/db";
import { sendEmail } from "@/lib/mailer";

export async function runDeliveries() {
  const { rows: userIds } = await pool.query("SELECT DISTINCT user_id FROM records WHERE entity = '_deadman'");
  let deliveryCount = 0;

  for (const { user_id } of userIds) {
    const deadmanRecords = await listRecords(user_id, "_deadman");
    if (deadmanRecords.length === 0) continue;

    const deadman = deadmanRecords[0];
    const { last_check_in, silence_days, delivered_ids } = deadman.data;
    const lastCheckInDate = new Date(last_check_in);
    const daysSinceCheckIn = Math.floor((Date.now() - lastCheckInDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSinceCheckIn > silence_days) {
      const messages = await listRecords(user_id, "Message");
      for (const message of messages) {
        if (!delivered_ids.includes(message.id)) {
          await sendEmail(message.data.recipient_email, "Message from I'm still alive", message.data.content);
          delivered_ids.push(message.id);
          deliveryCount++;
        }
      }

      await pool.query(
        "UPDATE records SET data = $1 WHERE id = $2 AND user_id = $3",
        [{ ...deadman.data, delivered_ids }, deadman.id, user_id]
      );
    }
  }

  return deliveryCount;
}
