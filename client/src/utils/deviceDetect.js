export function isMobileDevice() {
    const ua = navigator.userAgent;
    // iPad はタブレット扱いでデスクトップUI
    return /Mobi|Android|iPhone|iPod/i.test(ua) && !/iPad/i.test(ua);
}
