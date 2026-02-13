import jwt from "jsonwebtoken";
import Table from "../models/Table.js";

export async function joinWithInvite(req, res) {
  const { invite } = req.body;
  if (!invite) return res.status(400).json({ message: "Missing invite" });

  let payload;
  try {
    payload = jwt.verify(invite, process.env.TABLE_INVITE_SECRET);
  } catch {
    return res.status(401).json({ message: "Invite invalid or expired" });
  }

  if (payload.purpose !== "TABLE_INVITE" || !payload.tableId) {
    return res.status(401).json({ message: "Invalid invite" });
  }

  const table = await Table.findById(payload.tableId);
  if (!table) return res.status(404).json({ message: "Table not found" });

  if (table.status !== "OCCUPIED") {
    // optional rule: only allow join if table is assigned
    return res.status(400).json({ message: "Table is not assigned yet" });
  }

  res.json({
    table: { id: table._id, number: table.number, token: table.token },
  });
}
