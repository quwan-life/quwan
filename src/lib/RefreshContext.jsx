import { createContext, useContext, useCallback, useState } from 'react'

const RefreshContext = createContext({
  refreshKey: 0,
  triggerRefresh: () => {},
})

export function useRefresh() {
  return useContext(RefreshContext)
}

export function RefreshProvider({ children }) {
  const [refreshKey, setRefreshKey] = useState(0)
  const triggerRefresh = useCallback(() => {
    setRefreshKey(k => k + 1)
  }, [])

  return (
    <RefreshContext.Provider value={{ refreshKey, triggerRefresh }}>
      {children}
    </RefreshContext.Provider>
  )
}
