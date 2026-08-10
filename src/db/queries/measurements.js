import { db } from '../database';

export function getMeasurementsNewestFirst() {
  return db.bodyMeasurements.orderBy('date').reverse().toArray();
}

export function addMeasurement(measurement) {
  return db.bodyMeasurements.add(measurement);
}

export function deleteMeasurementById(id) {
  return db.bodyMeasurements.delete(id);
}
