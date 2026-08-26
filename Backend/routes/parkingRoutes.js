const express = require('express');
const ParkingSlot = require('../models/ParkingSlot');
const ParkingHistory = require('../models/ParkingHistory');
const VehicleCount = require('../models/VehicleCount');

const router = express.Router();
const OCCUPIED_DISTANCE_CM = Number(process.env.PARKING_DISTANCE_THRESHOLD_CM) || 20;
const normaliseSlotId = (slotId) => String(slotId).trim().toUpperCase();

// GET /api/parking/slots - current state of every bay.
router.get('/slots', async (_req, res, next) => {
  try {
    res.json(await ParkingSlot.find().sort({ slotId: 1 }).lean());
  } catch (error) { next(error); }
});

// POST /api/parking/slots - create a physical bay. Body: { "slotId": "P1", "distance": 55 }
router.post('/slots', async (req, res, next) => {
  try {
    const { slotId, distance } = req.body;
    if (!slotId || !Number.isFinite(Number(distance)) || Number(distance) < 0) {
      return res.status(400).json({ message: 'slotId and a non-negative numeric distance are required.' });
    }
    const measuredDistance = Number(distance);
    const occupied = measuredDistance <= OCCUPIED_DISTANCE_CM;
    const slot = await ParkingSlot.create({
      slotId: normaliseSlotId(slotId),
      distance: measuredDistance,
      occupied,
      status: occupied ? 'Occupied' : 'Available',
    });
    return res.status(201).json(slot);
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'This slotId already exists.' });
    return next(error);
  }
});

// Shared handler: process one distance measurement for a slot.
async function recordSensorState(req, res, next) {
  try {
    const distance = Number(req.body.distance);
    if (!Number.isFinite(distance) || distance < 0) {
      return res.status(400).json({ message: 'distance must be a non-negative number in centimetres.' });
    }
    const slotId = normaliseSlotId(req.params.slotId);
    const slot = await ParkingSlot.findOne({ slotId });
    if (!slot) return res.status(404).json({ message: 'Parking slot not found. Create it first.' });

    const occupied = distance <= OCCUPIED_DISTANCE_CM;
    const status = occupied ? 'Occupied' : 'Available';
    const changed = slot.occupied !== occupied;
    slot.distance = distance;
    slot.occupied = occupied;
    slot.status = status;
    await slot.save();

    let history = null;
    // Only log real arrivals/departures, not every repeated sensor reading.
    if (changed) history = await ParkingHistory.create({ slotId, distance, occupied, status });
    return res.json({ slot, changed, thresholdCm: OCCUPIED_DISTANCE_CM, history });
  } catch (error) { return next(error); }
}

// POST /api/parking/sensor/:slotId - real ESP32/ultrasonic endpoint. Body: { "distance": 55 }
router.post('/sensor/:slotId', recordSensorState);

// Convenience endpoints for manual testing / the dashboard's "simulate" toggle.
router.post('/park/:slotId', (req, res, next) => {
  req.body.distance = 0;
  return recordSensorState(req, res, next);
});

router.post('/release/:slotId', (req, res, next) => {
  req.body.distance = OCCUPIED_DISTANCE_CM + 1;
  return recordSensorState(req, res, next);
});

// GET /api/parking/stats - summary counts for the dashboard.
router.get('/stats', async (_req, res, next) => {
  try {
    const [totalSlots, occupiedSlots] = await Promise.all([
      ParkingSlot.countDocuments(),
      ParkingSlot.countDocuments({ occupied: true }),
    ]);
    res.json({ totalSlots, occupiedSlots, availableSlots: totalSlots - occupiedSlots });
  } catch (error) { next(error); }
});

// GET /api/parking/history - occupancy change log, newest first.
router.get('/history', async (_req, res, next) => {
  try {
    res.json(await ParkingHistory.find().sort({ recordedAt: -1 }).lean());
  } catch (error) { next(error); }
});

// GET /api/parking/vehicle-count
// Get current vehicle entry/exit counts.
router.get('/vehicle-count', async (_req, res, next) => {
  try {
    let count = await VehicleCount.findOne().lean();

    if (!count) {
      count = await VehicleCount.create({
        entryCount: 0,
        exitCount: 0,
        vehiclesInside: 0,
      });
    }

    res.json(count);
  } catch (error) {
    next(error);
  }
});

// POST /api/parking/vehicle-count
// Body: { "type": "entry" } OR { "type": "exit" }
router.post('/vehicle-count', async (req, res, next) => {
  try {
    const type = String(req.body.type || '').toLowerCase();

    if (!['entry', 'exit'].includes(type)) {
      return res.status(400).json({
        message: 'type must be either "entry" or "exit".',
      });
    }

    let count = await VehicleCount.findOne();

    if (!count) {
      count = new VehicleCount();
    }

    if (type === 'entry') {
      count.entryCount += 1;
      count.vehiclesInside += 1;
    }

    if (type === 'exit') {
      count.exitCount += 1;

      if (count.vehiclesInside > 0) {
        count.vehiclesInside -= 1;
      }
    }

    await count.save();

    res.json(count);
  } catch (error) {
    next(error);
  }
});
module.exports = router;
