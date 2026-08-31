export function epley(weight, reps) {
  return weight * (1 + reps / 30);
}

export function brzycki(weight, reps) {
  return weight * (36 / (37 - reps));
}

export function lombardi(weight, reps) {
  return weight * Math.pow(reps, 0.10);
}

export function calculateOneRepMax(weight, reps) {
  if (!weight || !reps || reps <= 0 || reps > 30) return null;
  if (reps === 1) return { epley: weight, brzycki: weight, lombardi: weight };
  return {
    epley: Math.round(epley(weight, reps) * 10) / 10,
    brzycki: Math.round(brzycki(weight, reps) * 10) / 10,
    lombardi: Math.round(lombardi(weight, reps) * 10) / 10,
  };
}

export function findBestSetForExercise(workouts, exerciseId) {
  let best = null;
  for (const w of workouts) {
    for (const ex of w.exercises) {
      if (ex.exerciseId !== exerciseId) continue;
      for (const set of ex.sets) {
        if (set.weight == null || set.reps == null || set.reps <= 0) continue;
        const volume = set.weight * set.reps;
        if (!best || volume > best.volume) {
          best = { weight: set.weight, reps: set.reps, volume };
        }
      }
    }
  }
  return best;
}
