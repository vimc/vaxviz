import posthog from "posthog-js";
import { locationURL } from "./externalURLs";

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

export const getUserLocation = async () => {
  if (!analyticsPermittedInitially) return;
  try {
    const res = await fetch(locationURL);
    if (!res.ok) throw new Error("Failed to fetch location");
    return await res.json();
  } catch (error) {
    console.error("Error fetching location:", error);
    // posthog.captureException(error);
    return null;
  }
};

export const initialisePosthog = () => {
  if (!analyticsPermittedInitially) return;
  // This API key is not a secret. https://mrc-ide.myjetbrains.com/youtrack/articles/RESIDE-A-56/Analytics-and-user-consent
  posthog.init('phc_Lk7j9M24DQ0A4NMdfc0UVPM7gPFXpVylfT6YhCZLqet', {
    cookieless_mode: 'always',
    api_host: 'https://eu.i.posthog.com',
    defaults: '2026-01-30',
  });

  // Fire and forget: don't block app initialisation by waiting for the location to load.
  getUserLocation().then((location) => {
    if (location?.country) {
      // Set super-property to be picked up by pageview events: https://posthog.com/docs/libraries/js/usage#super-properties
      // The property 'country' is a custom property, rather than one Posthog knows about.
      // We use such a custom property because Posthog doesn't automatically process locations in cookieless mode.
      // As a result, this country property will not show up on maps on Posthog, but can be analysed with custom widgets like 'Insights'
      // under 'Product analytics'.
      posthog.register({ country: location.country });
      // 'app_loaded' is a custom event.
      // Counting 'app_loaded' events by country is slightly better than counting pageview events by country
      // for the purpose of tracking the number of visits per country.
      // Also, by calling it explicitly, we ensure the event knows about the 'country' property.
      posthog.capture('app_loaded');
    }
  });
};
