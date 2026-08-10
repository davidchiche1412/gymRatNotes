import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useModal } from '../../hooks/useModal';
import { useMeasurements } from '../../hooks/useMeasurements';

export default function MeasurementsSection() {
  const { t, i18n } = useTranslation();
  const [showForm, setShowForm] = useState(false);
  const [showFieldEditor, setShowFieldEditor] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [form, setForm] = useState({});
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldUnit, setNewFieldUnit] = useState('cm');
  const { modal, confirm } = useModal();
  const { measurements, fields, addField, removeField, saveMeasurement, deleteMeasurement } = useMeasurements();

  const locale = i18n.language === 'es' ? 'es-ES' : 'en-US';

  const handleAddField = async () => {
    await addField(newFieldName, newFieldUnit);
    setNewFieldName('');
    setNewFieldUnit('cm');
  };

  const handleRemoveField = async (key) => {
    await removeField(key);
  };

  const getFieldLabel = (field) => {
    if (field.isCustom) return field.label;
    const translated = t(`profile.${field.label}`);
    return translated.replace(/ \(.*/, '');
  };

  const getFieldPlaceholder = (field) => {
    if (field.isCustom) return `${field.label} (${field.unit})`;
    return t(`profile.${field.label}`);
  };

  const handleSave = async () => {
    await saveMeasurement({ ...form});
    setForm({});
    setShowForm(false);
  };

  const handleDelete = async (id) => {
    const ok = await confirm({
      title: t('profile.deleteMeasurement'),
      message: t('profile.confirmDeleteMeasurement'),
      confirmText: t('common.confirm'),
      cancelText: t('common.cancel'),
    });
    if (!ok) return;
    await deleteMeasurement(id);
    if (expandedId === id) setExpandedId(null);
  };

  const formatDate = (ts) => {
    return new Date(ts).toLocaleDateString(locale, {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    });
  };

  const getSummary = (m) => {
    const parts = [];
    if (m.weight != null) parts.push(`${m.weight} kg`);
    const filled = fields.filter(f => f.key !== 'weight' && m[f.key] != null);
    if (filled.length > 0) parts.push(`${filled.length} ${t('profile.measurementCount')}`);
    return parts.join(' · ');
  };

  const weightData = measurements
    .filter(m => m.weight != null)
    .sort((a, b) => a.date - b.date)
    .map(m => ({
      date: new Date(m.date).toLocaleDateString(locale, { month: 'short', day: 'numeric' }),
      weight: m.weight,
    }));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center gap-2">
        <h3 className="font-semibold">{t('profile.measurements')}</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFieldEditor(!showFieldEditor)}
            className="px-2 py-2 text-text-secondary rounded-xl text-xs"
            aria-label={t('profile.editFields')}
          >
            ⚙️
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-3 py-2 bg-primary text-white rounded-xl text-xs font-medium"
          >
            + {t('profile.addMeasurement')}
          </button>
        </div>
      </div>

      {/* Editor de campos */}
      {showFieldEditor && (
        <div className="bg-surface rounded-xl p-4 border border-border space-y-3">
          <p className="text-xs text-text-secondary">{t('profile.editFieldsDescription')}</p>
          <div className="space-y-1">
            {fields.map(f => (
              <div key={f.key} className="flex items-center justify-between bg-bg rounded-lg px-3 py-2">
                <span className="text-sm">{getFieldLabel(f)} ({f.unit})</span>
                <button
                  onClick={() => handleRemoveField(f.key)}
                  className="text-danger/70 text-xs px-2"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder={t('profile.newFieldName')}
              value={newFieldName}
              onChange={e => setNewFieldName(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg border border-border bg-bg text-sm"
            />
            <select
              value={newFieldUnit}
              onChange={e => setNewFieldUnit(e.target.value)}
              className="px-2 py-2 rounded-lg border border-border bg-bg text-sm"
            >
              <option value="cm">cm</option>
              <option value="kg">kg</option>
              <option value="mm">mm</option>
              <option value="%">%</option>
            </select>
            <button
              onClick={handleAddField}
              disabled={!newFieldName.trim()}
              className="px-3 py-2 bg-primary text-white rounded-lg text-sm font-medium disabled:opacity-40"
            >
              +
            </button>
          </div>
        </div>
      )}

      {/* Formulario */}
      {showForm && (
        <div className="bg-surface rounded-xl p-4 border border-border space-y-2">
          {fields.map(f => (
            <input
              key={f.key}
              type="number"
              inputMode="decimal"
              placeholder={getFieldPlaceholder(f)}
              value={form[f.key] || ''}
              onChange={e => setForm({ ...form, [f.key]: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-sm"
            />
          ))}
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => { setShowForm(false); setForm({}); }}
              className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-text-secondary"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleSave}
              disabled={!fields.some(f => form[f.key] && form[f.key] !== '')}
              className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold disabled:opacity-40"
            >
              {t('common.save')}
            </button>
          </div>
        </div>
      )}

      {/* Gráfica de peso */}
      {weightData.length > 1 && (
        <div>
          <h4 className="text-sm font-medium mb-2">{t('profile.weightEvolution')}</h4>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={weightData}>
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
              <Tooltip />
              <Line type="monotone" dataKey="weight" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Lista de medidas */}
      {measurements.length === 0 ? (
        <p className="text-center text-text-secondary py-12 text-sm">
          {t('profile.noMeasurements')}
        </p>
      ) : (
        <div className="space-y-2">
          {measurements.map(m => (
            <div key={m.id} className="bg-surface rounded-xl border border-border overflow-hidden">
              <button
                onClick={() => setExpandedId(expandedId === m.id ? null : m.id)}
                className="w-full p-3 text-left"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-sm">{formatDate(m.date)}</p>
                    <p className="text-xs text-text-secondary mt-0.5">{getSummary(m)}</p>
                    {m.weight != null && (
                      <p className="text-xs text-primary mt-0.5">⚖️ {m.weight} kg</p>
                    )}
                  </div>
                  <span className="text-text-secondary text-xs">{expandedId === m.id ? '▲' : '▼'}</span>
                </div>
              </button>

              {expandedId === m.id && (
                <div className="px-3 pb-3 border-t border-border pt-2">
                  <div className="space-y-1">
                    {fields.map(f => {
                      if (m[f.key] == null) return null;
                      return (
                        <div key={f.key} className="flex justify-between text-sm">
                          <span className="text-text-secondary">{getFieldLabel(f)}</span>
                          <span className="font-medium">{m[f.key]} {f.unit}</span>
                        </div>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => handleDelete(m.id)}
                    className="text-danger text-xs mt-2"
                  >
                    {t('profile.deleteMeasurement')}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <Modal {...modal} />
    </div>
  );
}