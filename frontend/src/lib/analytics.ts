
import ReactGA from 'react-ga4';

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID || 'G-P5FE6JQJM8';

// Local fallback state (since GA4 sets user properties per session, we can also track locally for immediate events)
let isUserLoggedIn = false;

export const initAnalytics = () => {
    if (GA_MEASUREMENT_ID) {
        ReactGA.initialize(GA_MEASUREMENT_ID);
    }
};

export const setUserLoginStatus = (isLoggedIn: boolean) => {
    isUserLoggedIn = isLoggedIn;
    const status = isLoggedIn ? 'logged_in' : 'logged_out';
    ReactGA.gtag('set', 'user_properties', {
        login_status: status
    });
};

export const trackPageView = (url: string, pageName: string) => {
    ReactGA.send({ hitType: "pageview", page: url, title: pageName });
};

export const trackEvent = (category: string, action: string, label?: string, params?: any) => {
    ReactGA.event({
        category,
        action,
        label,
        ...params
    });
};

export const trackLocationSelect = (lat: number, lng: number, name: string) => {
    ReactGA.event({
        category: "Map",
        action: "Location Selected",
        label: name,
    });
    ReactGA.gtag("event", "select_location", {
        latitude: lat,
        longitude: lng,
        location_name: name,
    });
};

export const trackCurrentLocation = (lat: number, lng: number, name: string) => {
    ReactGA.event({
        category: "Map",
        action: "Used Current Location",
        label: name,
    });
    ReactGA.gtag("event", "use_current_location", {
        latitude: lat,
        longitude: lng,
        location_name: name,
    });
};


export const trackAuthEvent = (action: 'login' | 'signup' | 'logout', method?: string) => {
    ReactGA.event({
        category: "Authentication",
        action: action.toUpperCase(),
        label: method || 'Standard',
    });
};

export const trackSidebarClick = (label: string, path: string) => {
    ReactGA.event({
        category: "Navigation",
        action: "Sidebar Click",
        label: `${label} (${path})`,
    });
};

export const trackUserAction = (action: string, category: string, details?: Record<string, any>) => {
    ReactGA.event({
        category: category,
        action: action,
        label: details ? JSON.stringify(details) : undefined,
        ...details
    });
};

export const trackGlobalClick = (element: HTMLElement, pageName: string) => {
    const label = element.innerText || element.getAttribute('aria-label') || element.id || 'unknown';
    const type = element.tagName.toLowerCase();

    // Clean up label
    const cleanLabel = label.trim().substring(0, 50);
    if (!cleanLabel) return;

    const statusStr = isUserLoggedIn ? '[Logged In]' : '[Guest]';
    const finalLabel = `${statusStr} [${pageName}] ${cleanLabel}`;

    ReactGA.event({
        category: "User Interaction",
        action: `Click ${type}`,
        label: finalLabel,
    });
};
