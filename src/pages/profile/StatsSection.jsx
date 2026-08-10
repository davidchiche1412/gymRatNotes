import { useTranslation } from 'react-i18next';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { getExerciseName } from '../../utils/exerciseName';
import { useStats } from '../../hooks/useStats';

export default function StatsSection() {
  const { t, i18n } = useTranslation();
  const {
    maxWeightData,
    frequencyData,
    prs,
    selectedExercise,
    setSelectedExercise,
    exercises,
  } = useStats(i18n.language);

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
            <option key={ex.id} value={ex.id}>{getExerciseName(ex, i18n.language)}</option>
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
                <span className="text-sm font-medium">{getExerciseName(pr.exercise, i18n.language)}</span>
                <span className="text-sm text-primary font-semibold">{pr.weight}kg × {pr.reps}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}