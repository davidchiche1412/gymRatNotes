import { t } from 'i18next';

export default function DayOff() {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] px-6 text-center">
        <span className="text-5xl mb-4">😴</span>
        <h1 className="text-xl font-bold mb-2">{t('today.restDay')}</h1>
        <p className="text-text-secondary text-sm">{t('today.restDayMessage')}</p>
      </div>
    );
}