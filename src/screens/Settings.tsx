import { useApp } from '@/context/AppContext';
import { saveParent } from '@/services/storage';

export function Settings() {
  const { state, dispatch } = useApp();
  const { parent, activeChild, darkMode } = state;

  async function toggleDarkMode() {
    dispatch({ type: 'TOGGLE_DARK_MODE' });
    if (parent) {
      await saveParent({
        ...parent,
        settings: { ...parent.settings, darkMode: !darkMode },
      });
    }
  }

  return (
    <div className="min-h-screen bg-echo-cream dark:bg-echo-dark-bg pb-24">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <h1 className="font-nunito font-extrabold text-2xl text-echo-charcoal dark:text-white">
          ⚙️ Settings
        </h1>
      </div>

      <div className="px-4 space-y-3">
        {/* Parent profile */}
        {parent && (
          <div className="bg-white dark:bg-echo-dark-card rounded-2xl p-4 shadow-soft">
            <p className="font-inter text-xs text-echo-gray uppercase tracking-wide mb-3">Parent Profile</p>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-echo-cream dark:bg-echo-dark-bg flex items-center justify-center text-2xl">
                {parent.avatarEmoji}
              </div>
              <div>
                <p className="font-nunito font-bold text-echo-charcoal dark:text-white">{parent.name}</p>
                <p className="font-inter text-xs text-echo-gray">Parent</p>
              </div>
            </div>
          </div>
        )}

        {/* Child profile */}
        {activeChild && (
          <div className="bg-white dark:bg-echo-dark-card rounded-2xl p-4 shadow-soft">
            <p className="font-inter text-xs text-echo-gray uppercase tracking-wide mb-3">Child</p>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-echo-cream dark:bg-echo-dark-bg flex items-center justify-center text-2xl">
                {activeChild.avatarEmoji}
              </div>
              <div>
                <p className="font-nunito font-bold text-echo-charcoal dark:text-white">{activeChild.name}</p>
                <p className="font-inter text-xs text-echo-gray">Age group: {activeChild.ageGroup}</p>
                {activeChild.schoolName && (
                  <p className="font-inter text-xs text-echo-gray">{activeChild.schoolName}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Appearance */}
        <div className="bg-white dark:bg-echo-dark-card rounded-2xl p-4 shadow-soft">
          <p className="font-inter text-xs text-echo-gray uppercase tracking-wide mb-3">Appearance</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-nunito font-semibold text-echo-charcoal dark:text-white text-sm">Dark Mode</p>
              <p className="font-inter text-xs text-echo-gray mt-0.5">Easier on the eyes at night</p>
            </div>
            <button
              onClick={toggleDarkMode}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                darkMode ? 'bg-echo-coral' : 'bg-echo-light-gray'
              }`}
              aria-label="Toggle dark mode"
            >
              <div
                className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform shadow-sm ${
                  darkMode ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Data */}
        <div className="bg-white dark:bg-echo-dark-card rounded-2xl p-4 shadow-soft">
          <p className="font-inter text-xs text-echo-gray uppercase tracking-wide mb-3">Data & Privacy</p>
          <p className="font-nunito text-sm text-echo-charcoal dark:text-white leading-relaxed">
            🔒 All your recordings are stored <strong>locally on this device</strong>. We never access, sell, or train AI on your recordings.
          </p>
          <div className="mt-3 pt-3 border-t border-echo-light-gray dark:border-white/10">
            <p className="font-inter text-xs text-echo-gray">
              Cloud backup — <span className="text-echo-sky">Coming soon (Supabase sync)</span>
            </p>
          </div>
        </div>

        {/* Coming soon features */}
        <div className="bg-white dark:bg-echo-dark-card rounded-2xl p-4 shadow-soft opacity-60">
          <p className="font-inter text-xs text-echo-gray uppercase tracking-wide mb-3">Coming in v2</p>
          <div className="space-y-2">
            {['Custom questions', 'Reminder notifications', 'Export recordings', 'Family sharing', 'Calendar view'].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-echo-light-gray" />
                <p className="font-nunito text-sm text-echo-gray">{item}</p>
              </div>
            ))}
          </div>
        </div>

        {/* About */}
        <div className="bg-white dark:bg-echo-dark-card rounded-2xl p-4 shadow-soft">
          <p className="font-inter text-xs text-echo-gray uppercase tracking-wide mb-2">About</p>
          <p className="font-nunito text-sm text-echo-gray">LittleEchoes v0.1.0</p>
          <p className="font-nunito text-sm text-echo-gray mt-1">Made with ❤️ for families</p>
        </div>
      </div>
    </div>
  );
}
