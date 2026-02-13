import express from "express";
import { listTables, assignTable, freeTable,getTableById,regenerateJoinCode,createTable,reserveTable} from "../controllers/staffTableController.js";

const router = express.Router();

router.get("/staff/tables", listTables);
router.post("/staff/tables", createTable);

router.get("/staff/tables/:tableId", getTableById);

router.post("/staff/tables/:tableId/assign", assignTable);
router.post("/staff/tables/:tableId/reserve", reserveTable);
router.post("/staff/tables/:tableId/free", freeTable);

router.post("/staff/tables/:tableId/code/regenerate", regenerateJoinCode);




export default router;
