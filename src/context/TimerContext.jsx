import { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../db/database';

const TimerContext = createContext(null);

export function TimerProvider({ children }) {
  const [timerSeconds, setTimerSeconds] = useState(null);
  const [timerKey, setTimerKey] = useState(0);
  const [soundType, setSoundType] = useState('ding');
  const [volume, setVolume] = useState(0.7);
  const [restEnabled, setRestEnabled] = useState(true);

  useEffect(() => {
    db.userSettings.get('settings').then(s => {
      if (s?.restSoundType !== undefined) setSoundType(s.restSoundType);
      if (s?.restVolume !== undefined) setVolume(s.restVolume);
      if (s?.restEnabled !== undefined) setRestEnabled(s.restEnabled);
    });
  }, []);

  const startTimer = (seconds) => {
    if (!restEnabled || seconds <= 0) return;
    setTimerSeconds(seconds);
    setTimerKey(k => k + 1);
  };

  const dismissTimer = () => setTimerSeconds(null);

  return (
    <TimerContext.Provider value={{ timerSeconds, timerKey, soundType, volume, startTimer, dismissTimer }}>
      {children}
    </TimerContext.Provider>
  );
}

export function useTimer() {
  return useContext(TimerContext);
}
