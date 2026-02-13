import express from "express";
import {
  createServiceRequest,
  listServiceRequests,
  updateServiceRequest,
} from "../controllers/serviceRequestController.js";

const router = express.Router();

// POST /api/services
router.post("/services", createServiceRequest);

// GET /api/services?status=OPEN&type=BILL
router.get("/services", listServiceRequests);

// PATCH /api/services/:id
router.patch("/services/:id", updateServiceRequest);

export default router;
