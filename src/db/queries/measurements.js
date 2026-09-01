import { db } from '../database';

export function getMeasurementsNewestFirst() {
  return db.bodyMeasurements.orderBy('date').filter(m => !m.deletedAt).reverse().toArray();
}

export function addMeasurement(measurement) {
  const now = Date.now();
  return db.bodyMeasurements.add({ ...measurement, dirty: 1, updatedAt: measurement.updatedAt ?? now, createdAt: measurement.createdAt ?? now });
}

export function updateMeasurement(measurement) {
  const now = Date.now();
  return db.bodyMeasurements.put({ ...measurement, dirty: 1, updatedAt: measurement.updatedAt ?? now, createdAt: measurement.createdAt ?? now });
}

export async function deleteMeasurementById(id) {
  const now = Date.now();
  return db.bodyMeasurements.update(id, { deletedAt: now, dirty: 1, updatedAt: now });
}
