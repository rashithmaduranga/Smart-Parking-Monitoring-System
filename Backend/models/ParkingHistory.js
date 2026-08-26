const mongoose = require('mongoose');

// One immutable record every time a slot's occupancy state actually changes
// (arrival or departure) - not every raw sensor reading.
const parkingHistorySchema = new mongoose.Schema(
  {
    slotId: { type: String, required: true, trim: true, uppercase: true },
    occupied: { type: Boolean, required: true },
    distance: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['Available', 'Occupied'], required: true },
    recordedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

parkingHistorySchema.index({ slotId: 1, recordedAt: -1 });

module.exports = mongoose.model('ParkingHistory', parkingHistorySchema);
