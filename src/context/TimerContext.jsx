import { useState, useEffect } from 'react';
import { TimerContext } from './timerContextValue';
import { DEFAULT_SETTINGS } from '../utils/settings';
import { getSettings } from '../db/queries/settings';

export function TimerProvider({ children }) {
  const [timerSeconds, setTimerSeconds] = useState(null);
  const [timerKey, setTimerKey] = useState(0);
  const [soundType, setSoundType] = useState(DEFAULT_SETTINGS.restSoundType);
  const [volume, setVolume] = useState(DEFAULT_SETTINGS.restVolume);
  const [restEnabled, setRestEnabled] = useState(DEFAULT_SETTINGS.restEnabled);

  useEffect(() => {
    getSettings().then(s => {
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
