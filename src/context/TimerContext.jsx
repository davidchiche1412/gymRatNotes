import { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../db/database';

const TimerContext = createContext(null);

export function TimerProvider({ children }) {
  const [timerSeconds, setTimerSeconds] = useState(null);
  const [timerKey, setTimerKey] = useState(0);
  const [soundType, setSoundType] = useState('ding');

  useEffect(() => {
    db.userSettings.get('settings').then(s => {
      if (s?.restSoundType !== undefined) setSoundType(s.restSoundType);
    });
  }, []);

  const startTimer = (seconds) => {
    if (seconds > 0) {
      setTimerSeconds(seconds);
      setTimerKey(k => k + 1);
    }
  };

  const dismissTimer = () => setTimerSeconds(null);

  return (
    <TimerContext.Provider value={{ timerSeconds, timerKey, soundType, startTimer, dismissTimer }}>
      {children}
    </TimerContext.Provider>
  );
}

export function useTimer() {
  return useContext(TimerContext);
}
