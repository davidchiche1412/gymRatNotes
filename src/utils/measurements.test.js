import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildMeasurementEntry,
  createMeasurementField,
  hasMeasurementData,
  removeMeasurementField,
} from './measurements.js';

test('createMeasurementField creates normalized custom fields', () => {
  const field = createMeasurementField([], 'Brazo Derecho', 'cm');

  assert.deepEqual(field, {
    key: 'brazo_derecho',
    label: 'Brazo Derecho',
    unit: 'cm',
    isCustom: true,
  });
});

test('createMeasurementField rejects empty and duplicated fields', () => {
  const fields = [{ key: 'weight', label: 'bodyWeight', unit: 'kg' }];

  assert.equal(createMeasurementField(fields, '', 'cm'), null);
  assert.equal(createMeasurementField(fields, 'weight', 'cm'), null);
});

test('removeMeasurementField removes matching field by key', () => {
  const fields = [
    { key: 'weight' },
    { key: 'waist' },
  ];

  assert.deepEqual(removeMeasurementField(fields, 'waist'), [{ key: 'weight' }]);
});

test('hasMeasurementData detects filled measurement values', () => {
  const fields = [{ key: 'weight' }, { key: 'waist' }];

  assert.equal(hasMeasurementData(fields, { weight: '', waist: undefined }), false);
  assert.equal(hasMeasurementData(fields, { weight: '80', waist: '' }), true);
});

test('buildMeasurementEntry converts values to numbers and keeps blanks as null', () => {
  const entry = buildMeasurementEntry(
    [{ key: 'weight' }, { key: 'waist' }, { key: 'neck' }],
    { weight: '80.5', waist: '', neck: '40' },
    'measurement-1',
    123
  );

  assert.deepEqual(entry, {
    id: 'measurement-1',
    date: 123,
    weight: 80.5,
    waist: null,
    neck: 40,
  });
});
