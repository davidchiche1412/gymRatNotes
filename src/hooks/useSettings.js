import { useState, useEffect } from 'react';
import {
    exportAppData,
    getSettings,
    importAppData,
    saveSettings as persistSettings,
} from '../db/queries/settings';
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
        const current = await getSettings();
        const next = mergeSettings(current, patch);

        await persistSettings(next);
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
