const mongoose = require('mongoose');

const vehicleCountSchema = new mongoose.Schema(
  {
    entryCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    exitCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    vehiclesInside: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('VehicleCount', vehicleCountSchema);