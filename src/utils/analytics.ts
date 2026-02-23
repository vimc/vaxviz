const analyticsDisabledKey: Readonly<string> = "analyticsDisabled";

// Whether analytics were permitted at the time the app was loaded.
// An unset value is treated as 'false', i.e. the default is to permit analytics, in accordance with the statistical
// exception to the legal requirement for affirmative user consent to data collection.
export const analyticsPermittedInitially: Readonly<boolean> = localStorage.getItem(analyticsDisabledKey) !== 'true';

// We need a full app reset to retrigger Posthog to re-evaluate whether analytics are permitted,
// since in cookieless mode Posthog doesn't provide a way to stop capturing.
const reloadApp = () => {
  window.location.reload();
}

export const disableAnalytics = () => {
  localStorage.setItem(analyticsDisabledKey, 'true');
  reloadApp();
};

export const enableAnalytics = () => {
  localStorage.setItem(analyticsDisabledKey, 'false');
  reloadApp();
};
