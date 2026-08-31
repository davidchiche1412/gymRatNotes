import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { addMeasurement, deleteMeasurementById, getMeasurementsNewestFirst, updateMeasurement } from '../db/queries/measurements';
import { getSettings, saveSettings } from '../db/queries/settings';
import {
  DEFAULT_MEASUREMENT_FIELDS,
  buildMeasurementEntry,
  createMeasurementField,
  hasMeasurementData,
  removeMeasurementField,
} from '../utils/measurements';

async function getMeasurements() {
  return getMeasurementsNewestFirst();
}

async function getMeasurementsData() {
  const measurements = await getMeasurements();
  const settings = await getSettings();

  return {
    measurements,
    fields: settings?.measurementFields ?? DEFAULT_MEASUREMENT_FIELDS,
  };
}

export function useMeasurements() {
  const [measurements, setMeasurements] = useState([]);
  const [fields, setFields] = useState(DEFAULT_MEASUREMENT_FIELDS);

  const refreshMeasurements = async () => {
    setMeasurements(await getMeasurements());
  };

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const data = await getMeasurementsData();
      if (cancelled) return;

      setMeasurements(data.measurements);
      setFields(data.fields);
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const saveFields = async (newFields) => {
    setFields(newFields);
    const s = await getSettings() || { id: 'settings' };
    await saveSettings({
      ...s,
      id: 'settings',
      measurementFields: newFields,
      updatedAt: Date.now(),
    });
  };

  const addField = async (newFieldName, newFieldUnit) => {
    const field = createMeasurementField(fields, newFieldName, newFieldUnit);
    if (!field) return;
    await saveFields([...fields, field]);
  };

  const removeField = async (key) => {
    await saveFields(removeMeasurementField(fields, key));
  };

  const saveMeasurement = async (measurement) => {
    if (!hasMeasurementData(fields, measurement)) return;

    const entry = buildMeasurementEntry(
      fields,
      measurement,
      measurement.id ?? uuidv4(),
      measurement.date ?? Date.now()
    );

    if (measurement.id) {
      await updateMeasurement({
        ...entry,
        createdAt: measurement.createdAt,
      });
    } else {
      await addMeasurement(entry);
    }

    await refreshMeasurements();
  };

  const deleteMeasurement = async (id) => {
    await deleteMeasurementById(id);
    await refreshMeasurements();
  };

  return {
    measurements,
    fields,
    addField,
    removeField,
    saveMeasurement,
    deleteMeasurement,
  };
}
