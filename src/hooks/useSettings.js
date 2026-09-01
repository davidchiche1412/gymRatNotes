import { useState, useEffect } from 'react';
import {
    exportAppData,
    getSettings,
    importAppData,
    saveSettings as persistSettings,
} from '../db/queries/settings';
import { db } from '../db/database';
import { DEFAULT_SETTINGS, mergeSettings } from '../utils/settings';

export function useSettings() {

    const [settings, setSettings] = useState(DEFAULT_SETTINGS);
    
    useEffect(() => {
        async function fetchSettings() {
            const s = await getSettings();
            setSettings({ ...DEFAULT_SETTINGS, ...s });
        }
        fetchSettings();
    }, []);


    async function saveSettings(patch) {
        // Transacción atómica: read-merge-write para evitar lost update
        // si dos patches rápidos (ej: restEnabled + restVolume) se solapan
        const next = await db.transaction('rw', db.userSettings, async () => {
            const current = await getSettings();
            const merged = mergeSettings(current, patch);
            await persistSettings(merged);
            return merged;
        });
        setSettings(next);
        return next;
    }

    const changeName = (name) => saveSettings({ name });
    const changeLanguage = (language) => saveSettings({ language });
    const changeRestEnabled = (restEnabled) => saveSettings({ restEnabled });
    const changeRestSoundType = (restSoundType) => saveSettings({ restSoundType });
    const changeRestVolume = (restVolume) => saveSettings({ restVolume });

    return {
        settings,
        changeName,
        changeLanguage,
        changeRestEnabled,
        changeRestSoundType,
        changeRestVolume,
        exportData: exportAppData,
        importData: importAppData,
    };
}
