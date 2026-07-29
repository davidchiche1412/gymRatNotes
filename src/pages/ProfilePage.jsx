import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { v4 as uuidv4 } from 'uuid';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { db } from '../db/database';
import Modal from '../components/Modal';
import { useModal } from '../hooks/useModal';
import { playSound } from '../components/RestTimer';

function StatsSection() {
  const { t, i18n } = useTranslation();
  const [maxWeightData, setMaxWeightData] = useState([]);
  const [frequencyData, setFrequencyData] = useState([]);
  const [prs, setPrs] = useState([]);
  const [selectedExercise, setSelectedExercise] = useState('');
  const [exercises, setExercises] = useState([]);

  useEffect(() => {
    db.exercises.toArray().then(exs => {
      setExercises(exs);
      if (exs.length > 0) setSelectedExercise(exs[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selectedExercise) return;
    db.workouts.where('finishedAt').above(0).toArray().then(workouts => {
      const data = [];
      workouts.sort((a, b) => a.date - b.date).forEach(w => {
        const ex = w.exercises.find(e => e.exerciseId === selectedExercise);
        if (ex) {
          const maxW = Math.max(...ex.sets.filter(s => s.weight != null).map(s => s.weight), 0);
          if (maxW > 0) {
            data.push({
              date: new Date(w.date).toLocaleDateString(i18n.language === 'es' ? 'es-ES' : 'en-US', { month: 'short', day: 'numeric' }),
              weight: maxW,
            });
          }
        }
      });
      setMaxWeightData(data);
    });
  }, [selectedExercise, i18n.language]);

  useEffect(() => {
    db.workouts.where('finishedAt').above(0).toArray().then(workouts => {
      const weekMap = {};
      workouts.forEach(w => {
        const d = new Date(w.date);
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - d.getDay());
        const key = weekStart.toISOString().split('T')[0];
        weekMap[key] = (weekMap[key] || 0) + 1;
      });
      const data = Object.entries(weekMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-12)
        .map(([week, count]) => ({
          week: new Date(week).toLocaleDateString(i18n.language === 'es' ? 'es-ES' : 'en-US', { month: 'short', day: 'numeric' }),
          count,
        }));
      setFrequencyData(data);
    });
  }, [i18n.language]);

  useEffect(() => {
    db.workouts.where('finishedAt').above(0).toArray().then(async (workouts) => {
      const prMap = {};
      const exMap = {};
      const allExs = await db.exercises.toArray();
      allExs.forEach(e => { exMap[e.id] = e; });

      workouts.forEach(w => {
        w.exercises.forEach(ex => {
          ex.sets.forEach(s => {
            if (s.weight != null && s.reps != null) {
              const key = ex.exerciseId;
              const volume = s.weight * s.reps;
              if (!prMap[key] || volume > prMap[key].volume) {
                prMap[key] = { weight: s.weight, reps: s.reps, volume, date: w.date };
              }
            }
          });
        });
      });

      const list = Object.entries(prMap).map(([exId, pr]) => ({
        exercise: exMap[exId],
        ...pr,
      })).filter(p => p.exercise).sort((a, b) => b.volume - a.volume);
      setPrs(list);
    });
  }, []);

  const getExName = (ex) => {
    if (!ex) return '';
    return i18n.language === 'en' && ex.nameEN ? ex.nameEN : ex.name;
  };

  return (
    <div className="space-y-6">
      {/* Max weight chart */}
      <div>
        <h3 className="font-semibold mb-2">{t('profile.maxWeight')}</h3>
        <select
          value={selectedExercise}
          onChange={e => setSelectedExercise(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-sm mb-2 hover:border-primary/40 transition-colors"
        >
          {exercises.map(ex => (
            <option key={ex.id} value={ex.id}>{getExName(ex)}</option>
          ))}
        </select>
        {maxWeightData.length > 1 ? (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={maxWeightData}>
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey="weight" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-text-secondary text-center py-4">{t('profile.noData')}</p>
        )}
      </div>

      {/* Frequency chart */}
      <div>
        <h3 className="font-semibold mb-2">{t('profile.frequency')}</h3>
        {frequencyData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={frequencyData}>
              <XAxis dataKey="week" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#f97316" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-text-secondary text-center py-4">{t('profile.noData')}</p>
        )}
      </div>

      {/* PRs */}
      <div>
        <h3 className="font-semibold mb-2">{t('profile.personalRecords')}</h3>
        {prs.length === 0 ? (
          <p className="text-sm text-text-secondary">{t('profile.noPRs')}</p>
        ) : (
          <div className="space-y-2">
            {prs.slice(0, 10).map((pr, i) => (
              <div key={i} className="flex justify-between items-center bg-bg rounded-lg px-3 py-2">
                <span className="text-sm font-medium">{getExName(pr.exercise)}</span>
                <span className="text-sm text-primary font-semibold">{pr.weight}kg × {pr.reps}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const DEFAULT_MEASUREMENT_FIELDS = [
  { key: 'weight', label: 'bodyWeight', unit: 'kg' },
  { key: 'chest', label: 'chest', unit: 'cm' },
  { key: 'waist', label: 'waist', unit: 'cm' },
  { key: 'glutes', label: 'glutes', unit: 'cm' },
  { key: 'biceps', label: 'biceps', unit: 'cm' },
  { key: 'thigh', label: 'thigh', unit: 'cm' },
  { key: 'calf', label: 'calf', unit: 'cm' },
];

function MeasurementsSection() {
  const { t, i18n } = useTranslation();
  const [measurements, setMeasurements] = useState([]);
  const [fields, setFields] = useState(DEFAULT_MEASUREMENT_FIELDS);
  const [showForm, setShowForm] = useState(false);
  const [showFieldEditor, setShowFieldEditor] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [form, setForm] = useState({});
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldUnit, setNewFieldUnit] = useState('cm');
  const { modal, confirm } = useModal();

  const locale = i18n.language === 'es' ? 'es-ES' : 'en-US';

  const loadMeasurements = async () => {
    const all = await db.bodyMeasurements.orderBy('date').reverse().toArray();
    setMeasurements(all);
  };

  useEffect(() => {
    loadMeasurements();
    db.userSettings.get('settings').then(s => {
      if (s?.measurementFields) setFields(s.measurementFields);
    });
  }, []);

  const saveFields = async (newFields) => {
    setFields(newFields);
    const s = await db.userSettings.get('settings') || { id: 'settings' };
    await db.userSettings.put({ ...s, measurementFields: newFields });
  };

  const handleAddField = () => {
    if (!newFieldName.trim()) return;
    const key = newFieldName.trim().toLowerCase().replace(/\s+/g, '_');
    if (fields.some(f => f.key === key)) return;
    const newFields = [...fields, { key, label: newFieldName.trim(), unit: newFieldUnit, isCustom: true }];
    saveFields(newFields);
    setNewFieldName('');
    setNewFieldUnit('cm');
  };

  const handleRemoveField = (key) => {
    const newFields = fields.filter(f => f.key !== key);
    saveFields(newFields);
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
    const hasData = fields.some(f => form[f.key] && form[f.key] !== '');
    if (!hasData) return;
    const entry = { id: uuidv4(), date: Date.now() };
    fields.forEach(f => {
      entry[f.key] = form[f.key] ? Number(form[f.key]) : null;
    });
    await db.bodyMeasurements.add(entry);
    setForm({});
    setShowForm(false);
    loadMeasurements();
  };

  const handleDelete = async (id) => {
    const ok = await confirm({
      title: t('profile.deleteMeasurement'),
      message: t('profile.confirmDeleteMeasurement'),
      confirmText: t('common.confirm'),
      cancelText: t('common.cancel'),
    });
    if (!ok) return;
    await db.bodyMeasurements.delete(id);
    if (expandedId === id) setExpandedId(null);
    loadMeasurements();
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
            title={t('profile.editFields')}
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

function SettingsSection() {
  const { t, i18n } = useTranslation();
  const [name, setName] = useState('');
  const [restEnabled, setRestEnabled] = useState(true);
  const [restSoundType, setRestSoundType] = useState('ding');
  const [volume, setVolume] = useState(0.7);
  const { modal, confirm, alert: showAlert } = useModal();

  useEffect(() => {
    db.userSettings.get('settings').then(s => {
      if (s?.name) setName(s.name);
      if (s?.language) i18n.changeLanguage(s.language);
      if (s?.restEnabled !== undefined) setRestEnabled(s.restEnabled);
      if (s?.restSoundType !== undefined) setRestSoundType(s.restSoundType);
      if (s?.restVolume !== undefined) setVolume(s.restVolume);
    });
  }, []);

  const handleNameChange = async (value) => {
    setName(value);
    await db.userSettings.update('settings', { name: value, updatedAt: Date.now() });
  };

  const handleLanguageChange = async (lang) => {
    i18n.changeLanguage(lang);
    await db.userSettings.update('settings', { language: lang, updatedAt: Date.now() });
  };

  const handleExport = async () => {
    const data = {
      exercises: await db.exercises.toArray(),
      routines: await db.routines.toArray(),
      weeklySchedule: await db.weeklySchedule.toArray(),
      workouts: await db.workouts.toArray(),
      bodyMeasurements: await db.bodyMeasurements.toArray(),
      userSettings: await db.userSettings.toArray(),
      exportedAt: Date.now(),
      version: 1,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gymrat-notes-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (mode) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);

        if (mode === 'replace') {
          const ok = await confirm({
            title: t('profile.importData'),
            message: t('profile.confirmReplace'),
            confirmText: t('common.confirm'),
            cancelText: t('common.cancel'),
          });
          if (!ok) return;
          await db.exercises.clear();
          await db.routines.clear();
          await db.weeklySchedule.clear();
          await db.workouts.clear();
          await db.bodyMeasurements.clear();
          await db.userSettings.clear();
        }

        if (data.exercises) await db.exercises.bulkPut(data.exercises);
        if (data.routines) await db.routines.bulkPut(data.routines);
        if (data.weeklySchedule) await db.weeklySchedule.bulkPut(data.weeklySchedule);
        if (data.workouts) await db.workouts.bulkPut(data.workouts);
        if (data.bodyMeasurements) await db.bodyMeasurements.bulkPut(data.bodyMeasurements);
        if (data.userSettings) await db.userSettings.bulkPut(data.userSettings);

        window.location.reload();
      } catch {
        await showAlert({ title: 'Error', message: t('profile.invalidFile'), confirmText: 'OK' });
      }
    };
    input.click();
  };

  return (
    <div className="space-y-4">
      {/* Name */}
      <div>
        <label className="text-sm font-medium block mb-1">{t('profile.name')}</label>
        <input
          type="text"
          value={name}
          onChange={e => handleNameChange(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-sm"
        />
      </div>

      {/* Language */}
      <div>
        <label className="text-sm font-medium block mb-1">{t('profile.language')}</label>
        <div className="flex gap-2">
          <button
            onClick={() => handleLanguageChange('es')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium ${i18n.language === 'es' ? 'bg-primary text-white' : 'bg-surface border border-border'}`}
          >
            Español
          </button>
          <button
            onClick={() => handleLanguageChange('en')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium ${i18n.language === 'en' ? 'bg-primary text-white' : 'bg-surface border border-border'}`}
          >
            English
          </button>
        </div>
      </div>

      {/* Descanso entre series */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium">{t('profile.restTimer')}</label>
          <button
            onClick={async () => {
              const newVal = !restEnabled;
              setRestEnabled(newVal);
              const s = await db.userSettings.get('settings') || { id: 'settings' };
              await db.userSettings.put({ ...s, restEnabled: newVal });
            }}
            className={`relative w-11 h-6 rounded-full transition-colors ${restEnabled ? 'bg-primary' : 'bg-border'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${restEnabled ? 'translate-x-5' : ''}`} />
          </button>
        </div>

        {restEnabled && (
          <>
            <label className="text-sm font-medium block mb-2">{t('profile.timerSound')}</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'none', label: t('profile.soundNone'), icon: '🔕' },
                { key: 'ding', label: 'Ding', icon: '🔔' },
                { key: 'bell', label: t('profile.soundBell'), icon: '🥊' },
                { key: 'beep', label: 'Beep', icon: '📟' },
              ].map(opt => (
                <button
                  key={opt.key}
                  onClick={async () => {
                    setRestSoundType(opt.key);
                    const s = await db.userSettings.get('settings') || { id: 'settings' };
                    await db.userSettings.put({ ...s, restSoundType: opt.key });
                    playSound(opt.key, volume);
                  }}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    restSoundType === opt.key
                      ? 'bg-primary text-white'
                      : 'bg-surface border border-border'
                  }`}
                >
                  <span>{opt.icon}</span>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
            {restSoundType !== 'none' && (
              <div className="flex items-center gap-3 mt-3">
                <span className="text-xs text-text-secondary">🔈</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={async (e) => {
                    const v = parseFloat(e.target.value);
                    setVolume(v);
                    const s = await db.userSettings.get('settings') || { id: 'settings' };
                    await db.userSettings.put({ ...s, restVolume: v });
                  }}
                  onMouseUp={() => { if (restSoundType !== 'none') playSound(restSoundType, volume); }}
                  onTouchEnd={() => { if (restSoundType !== 'none') playSound(restSoundType, volume); }}
                  className="flex-1 h-2 rounded-full appearance-none bg-border accent-primary"
                />
                <span className="text-xs text-text-secondary">🔊</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Data */}
      <div>
        <label className="text-sm font-medium block mb-2">{t('profile.data')}</label>
        <div className="space-y-2">
          <button onClick={handleExport} className="w-full py-2.5 bg-primary text-white rounded-xl text-sm font-medium">
            {t('profile.exportData')}
          </button>
          <button onClick={() => handleImport('merge')} className="w-full py-2.5 bg-primary/80 text-white rounded-xl text-sm font-medium">
            {t('profile.importMerge')}
          </button>
          <button onClick={() => handleImport('replace')} className="w-full py-2.5 border border-danger text-danger rounded-xl text-sm font-medium">
            {t('profile.importReplace')}
          </button>
        </div>
      </div>
      <Modal {...modal} />
    </div>
  );
}

export default function ProfilePage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState('stats');

  const tabs = [
    { key: 'stats', label: t('profile.stats') },
    { key: 'measurements', label: t('profile.measurements') },
    { key: 'settings', label: t('profile.settings') },
  ];

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h1 className="text-xl font-bold mb-4">{t('profile.title')}</h1>

      <div className="flex gap-1 bg-bg rounded-xl p-1 mb-4 border border-border">
        {tabs.map(tb => (
          <button
            key={tb.key}
            onClick={() => setTab(tb.key)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${tab === tb.key ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:text-text'}`}
          >
            {tb.label}
          </button>
        ))}
      </div>

      {tab === 'stats' && <StatsSection />}
      {tab === 'measurements' && <MeasurementsSection />}
      {tab === 'settings' && <SettingsSection />}
    </div>
  );
}
