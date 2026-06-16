export function isMobileDevice(): boolean {
  const ua = navigator.userAgent
  // iPad はタブレット扱いでデスクトップUI
  const isMobileUA = /Mobi|Android|iPhone|iPod/i.test(ua) && !/iPad/i.test(ua)

  // Safari の「デスクトップ用 Web サイトを表示」でUAが書き換わる場合のフォールバック。
  // screen.width はデスクトップモード時も物理デバイス幅（CSS px）を返す。
  // iPhone 14 Pro Max = 430px、iPad mini = 768px なので 430px を閾値とする。
  const isNarrowTouchDevice = navigator.maxTouchPoints > 1 && window.screen.width <= 430

  return isMobileUA || isNarrowTouchDevice
}
