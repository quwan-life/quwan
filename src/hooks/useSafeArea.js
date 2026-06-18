import { useEffect } from 'react'

/**
 * 读取 env(safe-area-inset-top) 写入 --safe-top
 */
function detectSafeAreaTop() {
  try {
    const testEl = document.createElement('div')
    testEl.style.cssText = 'position:fixed;top:0;left:0;padding-top:env(safe-area-inset-top,20px);visibility:hidden;'
    document.body.appendChild(testEl)
    const v = parseFloat(getComputedStyle(testEl).paddingTop) || 0
    document.body.removeChild(testEl)
    return v
  } catch { return 0 }
}

export default function useSafeArea() {
  useEffect(() => {
    const setVal = () => {
      document.documentElement.style.setProperty('--safe-top', `${detectSafeAreaTop()}px`)
    }
    setVal()
    const handle = () => setTimeout(setVal, 300)
    window.addEventListener('orientationchange', handle)
    return () => window.removeEventListener('orientationchange', handle)
  }, [])
}
