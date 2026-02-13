import Table from "../models/Table.js";

export async function joinWithCode(req, res) {
  const { code } = req.body;
  if (!code) return res.status(400).json({ message: "Missing code" });

  const table = await Table.findOne({ joinCode: String(code) });
  if (!table) return res.status(401).json({ message: "Invalid code" });

  if (!table.joinCodeExpiresAt || table.joinCodeExpiresAt < new Date()) {
    return res.status(401).json({ message: "Code expired" });
  }

  if (table.status !== "OCCUPIED") {
    return res.status(400).json({ message: "Table is not assigned yet" });
  }

  res.json({
    table: { id: table._id, number: table.number, token: table.token },
  });
}
