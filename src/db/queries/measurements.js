import { db } from '../database';

export function getMeasurementsNewestFirst() {
  return db.bodyMeasurements.orderBy('date').reverse().toArray();
}

export function addMeasurement(measurement) {
  const now = Date.now();
  return db.bodyMeasurements.add({ ...measurement, dirty: 1, updatedAt: measurement.updatedAt ?? now, createdAt: measurement.createdAt ?? now });
}

export function deleteMeasurementById(id) {
  return db.bodyMeasurements.delete(id);
}
