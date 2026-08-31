import { getWorkoutSetInputValue, getWorkoutSetPlaceholder } from '../utils/todayWorkoutView';

const inputClass = (completed) =>
  `flex-1 px-2 py-2 rounded-lg border text-sm text-center min-w-0 transition-colors ${
    completed
      ? 'bg-primary/10 border-primary/20 text-primary'
      : 'bg-bg border-border'
  }`;

export default function WorkoutSetInput({ field, inputMode, set, setIndex, prefilledSets, sets, workoutStatus, exIdx, onSetChange, onFocus, onBlur }) {
  return (
    <input
      type="number"
      inputMode={inputMode}
      placeholder={getWorkoutSetPlaceholder(prefilledSets, sets, setIndex, field)}
      value={getWorkoutSetInputValue(workoutStatus, set, field)}
      onChange={e => onSetChange(exIdx, setIndex, field, e.target.value)}
      onFocus={() => onFocus(exIdx, setIndex, field)}
      onBlur={onBlur}
      className={inputClass(set.completed)}
    />
  );
}
