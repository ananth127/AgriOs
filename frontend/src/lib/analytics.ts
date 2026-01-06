
import ReactGA from 'react-ga4';

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID || 'G-P5FE6JQJM8';

// Local fallback state (since GA4 sets user properties per session, we can also track locally for immediate events)
let isUserLoggedIn = false;
let currentUserLocation: { lat: number | null; lng: number | null; name: string } | null = null;

const getLocationString = (context: string = '') => {
    if (!currentUserLocation) return '';

    // Only log location if context is 'My Farms' (or related) or 'Signup'
    // Also include 'Management' as that is farm management
    const allowedContexts = ['My Farms', 'Management', 'Signup', 'farms', 'farm-management', 'auth/signup'];
    const isAllowed = allowedContexts.some(c => context.toLowerCase().includes(c.toLowerCase()));

    if (!isAllowed) return '';

    return `[Loc: ${currentUserLocation.name} (${currentUserLocation.lat}, ${currentUserLocation.lng})]`;
};

export const initAnalytics = () => {
    if (GA_MEASUREMENT_ID) {
        ReactGA.initialize(GA_MEASUREMENT_ID);
        //console.log(`[Analytics] Initialized with ID: ${GA_MEASUREMENT_ID}`);
    }
};

export const setUserLoginStatus = (isLoggedIn: boolean) => {
    isUserLoggedIn = isLoggedIn;
    const status = isLoggedIn ? 'logged_in' : 'logged_out';
    //console.log(`[Analytics] Set User Status: ${status}`);
    ReactGA.gtag('set', 'user_properties', {
        login_status: status
    });
};

export const setUserLocation = (lat: number, lng: number, name: string) => {
    currentUserLocation = { lat, lng, name };
    //console.log(`[Analytics] Setting User Location Context: ${name} (${lat}, ${lng})`);
    ReactGA.gtag('set', 'user_properties', {
        user_latitude: lat,
        user_longitude: lng,
        user_location_name: name
    });
};

export const trackPageView = (url: string, pageName: string) => {
    //console.log(`[Analytics] Page View: ${pageName} (${url}) ${getLocationString(pageName)}`);
    ReactGA.send({ hitType: "pageview", page: url, title: pageName });
};

export const trackEvent = (category: string, action: string, label?: string, params?: any) => {
    // Attempt to infer context from category or other params if not explicit, but for generic event we might miss context.
    // For now we assume generic events don't strictly need location unless we pass context.
    //console.log(`[Analytics] Event: [${category}] ${action} | Label: ${label}`, params || '');
    ReactGA.event({
        category,
        action,
        label,
        ...params
    });
};

export const trackLocationSelect = (lat: number, lng: number, name: string) => {
    //console.log(`[Analytics] Location Selected: ${name} (${lat}, ${lng})`);
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

export const trackCurrentLocation = (lat: number, lng: number, name: string, source: 'auto' | 'manual' = 'manual') => {
    //console.log(`[Analytics] Current Location Used (${source}): ${name} (${lat}, ${lng})`);
    ReactGA.event({
        category: "Map",
        action: "Used Current Location",
        label: `${name} (${source})`,
    });
    ReactGA.gtag("event", "use_current_location", {
        latitude: lat,
        longitude: lng,
        location_name: name,
        source: source
    });
};

export const trackAuthEvent = (action: 'login' | 'signup' | 'logout', method?: string) => {
    // Signup event definitely relevant
    const context = action === 'signup' ? 'Signup' : '';
    //console.log(`[Analytics] Auth Event: ${action.toUpperCase()} (${method || 'Standard'}) ${getLocationString(context)}`);
    ReactGA.event({
        category: "Authentication",
        action: action.toUpperCase(),
        label: method || 'Standard',
    });
};

export const trackSidebarClick = (label: string, path: string) => {
    //console.log(`[Analytics] Sidebar Click: ${label} -> ${path} ${getLocationString(label)}`);
    ReactGA.event({
        category: "Navigation",
        action: "Sidebar Click",
        label: `${label} (${path})`,
    });
};

export const trackUserAction = (action: string, category: string, details?: Record<string, any>) => {
    // If we have details.location_name it's good, but for context we check category
    //console.log(`[Analytics] User Action: [${category}] ${action} ${getLocationString(category)}`, details || '');
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

    //console.log(`[Analytics] Global Click: ${type} - ${finalLabel} ${getLocationString(pageName)}`);

    ReactGA.event({
        category: "User Interaction",
        action: `Click ${type}`,
        label: finalLabel,
    });
};
