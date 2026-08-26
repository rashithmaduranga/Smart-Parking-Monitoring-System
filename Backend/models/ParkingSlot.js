const mongoose = require('mongoose');

// Live/current state of one physical parking bay (P1, P2, P3, P4 ...).
const parkingSlotSchema = new mongoose.Schema(
  {
    slotId: { type: String, required: true, unique: true, trim: true, uppercase: true },
    occupied: { type: Boolean, default: false },
    // Ultrasonic sensor distance from sensor to nearest object, in cm.
    distance: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['Available', 'Occupied'], default: 'Available' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ParkingSlot', parkingSlotSchema);
