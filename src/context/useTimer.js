import { useContext } from 'react';
import { TimerContext } from './timerContextValue';

export function useTimer() {
  return useContext(TimerContext);
}
