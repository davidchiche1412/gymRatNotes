import { useContext } from 'react';
import { WorkoutContext } from './workoutContextValue';

export const useWorkout = () => useContext(WorkoutContext);
