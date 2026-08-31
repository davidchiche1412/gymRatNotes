import { useTranslation } from 'react-i18next';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { getExerciseName } from '../../utils/exerciseName';
import { useStats } from '../../hooks/useStats';

export default function StatsSection() {
  const { t, i18n } = useTranslation();
  const {
    chartData,
    frequencyData,
    filteredPrs,
    selectedExercise,
    setSelectedExercise,
    selectedMetric,
    setSelectedMetric,
    timeRange,
    setTimeRange,
    selectedMuscleGroup,
    setSelectedMuscleGroup,
    exercisesWithProgress,
    muscleGroupsWithPrs,
  } = useStats(i18n.language);

  const metricOptions = [
    { value: 'maxWeight', label: t('profile.maxWeight') },
    { value: 'volume', label: t('profile.volume') },
  ];

  const timeRangeOptions = [
    { value: 3, label: t('profile.timeRange3m') },
    { value: 6, label: t('profile.timeRange6m') },
    { value: 12, label: t('profile.timeRange12m') },
  ];

  const chartTitle = selectedMetric === 'volume' ? t('profile.volume') : t('profile.maxWeight');
  const chartDescription = selectedMetric === 'volume' ? t('profile.volumeDescription') : t('profile.maxWeightDescription');
  const dataKey = selectedMetric === 'volume' ? 'volume' : 'weight';

  return (
    <div className="space-y-6">
      {/* Progress chart */}
      <div>
        <h3 className="font-semibold mb-1">{chartTitle}</h3>
        <p className="text-xs text-text-secondary mb-2">{chartDescription}</p>

        {/* Metric selector */}
        <div className="flex gap-2 mb-2">
          {metricOptions.map(option => (
            <button
              key={option.value}
              onClick={() => setSelectedMetric(option.value)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedMetric === option.value
                  ? 'bg-primary text-white'
                  : 'bg-bg-secondary text-text-secondary hover:text-text'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Time range selector */}
        <div className="flex gap-1 mb-2">
          {timeRangeOptions.map(option => (
            <button
              key={option.value}
              onClick={() => setTimeRange(option.value)}
              className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                timeRange === option.value
                  ? 'bg-primary/20 text-primary'
                  : 'bg-bg-secondary text-text-secondary hover:text-text'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {exercisesWithProgress.length > 0 && (
          <select
            value={selectedExercise}
            onChange={e => setSelectedExercise(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-sm mb-2 hover:border-primary/40 transition-colors"
          >
            {exercisesWithProgress.map(ex => (
              <option key={ex.id} value={ex.id}>{getExerciseName(ex, i18n.language)}</option>
            ))}
          </select>
        )}
        {chartData.length > 1 ? (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey={dataKey} stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} />
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
        {muscleGroupsWithPrs.length > 0 && (
          <select
            value={selectedMuscleGroup}
            onChange={e => setSelectedMuscleGroup(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-sm mb-2 hover:border-primary/40 transition-colors"
          >
            <option value="">{t('exercises.all')}</option>
            {muscleGroupsWithPrs.map(muscleGroup => (
              <option key={muscleGroup} value={muscleGroup}>
                {t(`exercises.muscleGroups.${muscleGroup}`)}
              </option>
            ))}
          </select>
        )}
        {filteredPrs.length === 0 ? (
          <p className="text-sm text-text-secondary">{t('profile.noPRs')}</p>
        ) : (
          <div className="space-y-2">
            {filteredPrs.slice(0, 10).map((pr, i) => (
              <div key={i} className="flex justify-between items-center bg-bg rounded-lg px-3 py-2">
                <span className="text-sm font-medium">
                  {getExerciseName(pr.exercise, i18n.language)}
                  <span className="block text-[10px] text-text-secondary">
                    {t(`exercises.muscleGroups.${pr.exercise.muscleGroup}`)}
                  </span>
                </span>
                <span className="text-sm text-primary font-semibold">{pr.weight}kg × {pr.reps}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
