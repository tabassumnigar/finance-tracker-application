import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth';
import './SettingsPage.css';

type LocalSettings = {
  displayName: string;
  defaultCurrency: string;
  timezone: string;
  weekStartsOn: 'MONDAY' | 'SUNDAY';
  theme: 'LIGHT' | 'DARK' | 'SYSTEM';
  emailAlerts: boolean;
  budgetAlerts: boolean;
  recurringAlerts: boolean;
  goalAlerts: boolean;
  compactMode: boolean;
  reduceMotion: boolean;
};

const SETTINGS_KEY = 'finance-tracker-settings';
const SETTINGS_EVENT = 'finance-settings-updated';

const defaultSettings: LocalSettings = {
  displayName: 'Finance User',
  defaultCurrency: 'INR',
  timezone: 'Asia/Calcutta',
  weekStartsOn: 'MONDAY',
  theme: 'LIGHT',
  emailAlerts: false,
  budgetAlerts: true,
  recurringAlerts: true,
  goalAlerts: true,
  compactMode: false,
  reduceMotion: false,
};

export default function SettingsPage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<LocalSettings>(defaultSettings);
  const [savedMessage, setSavedMessage] = useState('');

  useEffect(() => {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as Partial<LocalSettings>;
      setSettings((prev) => ({ ...prev, ...parsed }));
    } catch {
      window.localStorage.removeItem(SETTINGS_KEY);
    }
  }, []);

  useEffect(() => {
    if (!savedMessage) {
      return;
    }
    const timer = window.setTimeout(() => setSavedMessage(''), 2500);
    return () => window.clearTimeout(timer);
  }, [savedMessage]);

  const updateSetting = <K extends keyof LocalSettings>(key: K, value: LocalSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const saveSettings = () => {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    window.dispatchEvent(new Event(SETTINGS_EVENT));
    setSavedMessage('Settings saved on this device');
  };

  const resetSettings = () => {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(defaultSettings));
    window.dispatchEvent(new Event(SETTINGS_EVENT));
    setSettings(defaultSettings);
    setSavedMessage('Settings reset to defaults');
  };

  const logout = async () => {
    await authService.logout().catch(() => undefined);
    navigate('/login');
  };

  return (
    <section className="settings-page">
      <div className="settings-shell">
        <header className="settings-hero">
          <div>
            <p className="settings-eyebrow">Workspace Settings</p>
            <h1>Settings</h1>
            <p className="settings-subtitle">
              Manage profile defaults, notifications, appearance, and workspace actions from one
              place.
            </p>
          </div>

          <div className="settings-hero-actions">
            <button type="button" className="btn btn-secondary" onClick={resetSettings}>
              Reset defaults
            </button>
            <button type="button" className="btn btn-primary" onClick={saveSettings}>
              Save settings
            </button>
          </div>
        </header>

        {savedMessage && <div className="settings-banner">{savedMessage}</div>}

        <div className="settings-grid">
          <section className="settings-card">
            <h2>Profile and regional defaults</h2>
            <p>Control your display identity, preferred currency, and calendar defaults.</p>

            <label className="settings-field">
              <span>Display name</span>
              <input
                type="text"
                value={settings.displayName}
                onChange={(event) => updateSetting('displayName', event.target.value)}
                placeholder="Finance User"
              />
            </label>

            <div className="settings-field-row">
              <label className="settings-field">
                <span>Default currency</span>
                <input
                  type="text"
                  maxLength={3}
                  value={settings.defaultCurrency}
                  onChange={(event) =>
                    updateSetting('defaultCurrency', event.target.value.toUpperCase())
                  }
                  placeholder="INR"
                />
              </label>

              <label className="settings-field">
                <span>Timezone</span>
                <select
                  value={settings.timezone}
                  onChange={(event) => updateSetting('timezone', event.target.value)}
                >
                  <option value="Asia/Calcutta">Asia/Calcutta</option>
                  <option value="UTC">UTC</option>
                  <option value="Asia/Dubai">Asia/Dubai</option>
                  <option value="Europe/London">Europe/London</option>
                </select>
              </label>
            </div>

            <label className="settings-field">
              <span>Week starts on</span>
              <select
                value={settings.weekStartsOn}
                onChange={(event) =>
                  updateSetting('weekStartsOn', event.target.value as LocalSettings['weekStartsOn'])
                }
              >
                <option value="MONDAY">Monday</option>
                <option value="SUNDAY">Sunday</option>
              </select>
            </label>
          </section>

          <section className="settings-card">
            <h2>Notifications</h2>
            <p>Choose what appears in the in-app bell and what should stay silent.</p>

            <label className="settings-toggle">
              <input
                type="checkbox"
                checked={settings.budgetAlerts}
                onChange={(event) => updateSetting('budgetAlerts', event.target.checked)}
              />
              <div>
                <strong>Budget threshold alerts</strong>
                <span>Show reminders when spending crosses warning and danger levels.</span>
              </div>
            </label>

            <label className="settings-toggle">
              <input
                type="checkbox"
                checked={settings.recurringAlerts}
                onChange={(event) => updateSetting('recurringAlerts', event.target.checked)}
              />
              <div>
                <strong>Recurring due reminders</strong>
                <span>Surface upcoming subscriptions and repeated income in the app.</span>
              </div>
            </label>

            <label className="settings-toggle">
              <input
                type="checkbox"
                checked={settings.goalAlerts}
                onChange={(event) => updateSetting('goalAlerts', event.target.checked)}
              />
              <div>
                <strong>Goal progress nudges</strong>
                <span>Highlight goals that are close to completion or behind plan.</span>
              </div>
            </label>

            <label className="settings-toggle">
              <input
                type="checkbox"
                checked={settings.emailAlerts}
                onChange={(event) => updateSetting('emailAlerts', event.target.checked)}
              />
              <div>
                <strong>Email alerts</strong>
                <span>Email delivery is not connected to the backend yet, but this preference is saved.</span>
              </div>
            </label>
          </section>

          <section className="settings-card">
            <h2>Account and data actions</h2>
            <p>Quick links for reports, account review, budget follow-up, and session control.</p>

            <div className="settings-actions">
              <button type="button" className="btn btn-secondary" onClick={() => navigate('/reports')}>
                Open reports
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => navigate('/accounts')}>
                Manage accounts
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => navigate('/budgets')}>
                Review budgets
              </button>
              <button type="button" className="btn btn-danger" onClick={logout}>
                Logout now
              </button>
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}
