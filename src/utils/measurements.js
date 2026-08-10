export const DEFAULT_MEASUREMENT_FIELDS = [
  { key: 'weight', label: 'bodyWeight', unit: 'kg' },
  { key: 'chest', label: 'chest', unit: 'cm' },
  { key: 'waist', label: 'waist', unit: 'cm' },
  { key: 'glutes', label: 'glutes', unit: 'cm' },
  { key: 'biceps', label: 'biceps', unit: 'cm' },
  { key: 'thigh', label: 'thigh', unit: 'cm' },
  { key: 'calf', label: 'calf', unit: 'cm' },
];

export function createMeasurementField(fields, name, unit) {
  const trimmedName = name.trim();
  if (!trimmedName) return null;

  const key = trimmedName.toLowerCase().replace(/\s+/g, '_');
  if (fields.some(field => field.key === key)) return null;

  return {
    key,
    label: trimmedName,
    unit,
    isCustom: true,
  };
}

export function removeMeasurementField(fields, key) {
  return fields.filter(field => field.key !== key);
}

export function hasMeasurementData(fields, measurement) {
  return fields.some(field => measurement[field.key] !== undefined && measurement[field.key] !== '');
}

export function buildMeasurementEntry(fields, measurement, id, date) {
  const entry = { id, date };

  fields.forEach(field => {
    entry[field.key] = measurement[field.key] ? Number(measurement[field.key]) : null;
  });

  return entry;
}
