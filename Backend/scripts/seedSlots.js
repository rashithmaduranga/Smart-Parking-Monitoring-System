/* Creates the initial physical bays (P1-P4) once. Safe to run repeatedly. */
require('dotenv').config();
const mongoose = require('mongoose');
const ParkingSlot = require('../models/ParkingSlot');

async function seedSlots() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is missing from .env.');
  await mongoose.connect(process.env.MONGODB_URI);

  const defaultSlots = ['P1', 'P2', 'P3', 'P4'];
  for (const slotId of defaultSlots) {
    await ParkingSlot.updateOne(
      { slotId },
      { $setOnInsert: { slotId, occupied: false, distance: 55, status: 'Available' } },
      { upsert: true }
    );
  }

  console.log(`Ensured ${defaultSlots.length} parking slots exist: ${defaultSlots.join(', ')}`);
  await mongoose.disconnect();
}

seedSlots().catch(async (error) => {
  console.error('Unable to seed slots:', error.message);
  await mongoose.disconnect();
  process.exit(1);
});
