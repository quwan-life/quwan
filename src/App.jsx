import { useState, useCallback } from 'react'
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import useSafeArea from './hooks/useSafeArea'
import AuthProvider, { useAuth } from './lib/AuthContext'
import { RefreshProvider, useRefresh } from './lib/RefreshContext'
import { refreshMockStore } from './lib/mockData'
import TabBar from './components/layout/TabBar'
import { UserPopupProvider } from './components/shared/UserPopup'
import PullToRefresh from './components/shared/PullToRefresh'
import LoginPage from './components/auth/LoginPage'
import Home from './pages/home/Home'
import Discover from './pages/discover/Discover'
import ActivityDetail from './pages/home/ActivityDetail'
import RecordDetail from './pages/records/RecordDetail'
import RecordCreate from './pages/records/RecordCreate'
import Publish from './pages/publish/Publish'
import Guide from './pages/guide/Guide'
import MapPage from './pages/map/MapPage'
import AdminReview from './pages/admin/AdminReview'
import AdminInvites from './pages/admin/AdminInvites'
import AdminUsers from './pages/admin/AdminUsers'
import Messages from './pages/messages/Messages'
import Chat from './pages/messages/Chat'
import Profile from './pages/profile/Profile'
import EditProfile from './pages/profile/EditProfile'
import MyBookings from './pages/bookings/MyBookings'
import MyFollowing from './pages/following/MyFollowing'
import MyPublished from './pages/published/MyPublished'
import MyRecords from './pages/published/MyRecords'
import UserHome from './pages/user/UserHome'

// TabBar 显示的路由前缀
const TAB_ROUTES = ['/', '/records', '/publish', '/messages', '/profile', '/map', '/activity', '/record']

function shouldShowTabBar(pathname) {
  if (pathname === '/') return true
  if (pathname === '/discover' || pathname === '/publish' || pathname === '/messages' || pathname === '/profile') return true
  if (pathname.startsWith('/activity/') || pathname.startsWith('/discover/') || pathname.startsWith('/messages/')) return true
  if (pathname === '/map' || pathname.startsWith('/map/')) return true
  return false
}

function getActiveTab(pathname) {
  if (pathname === '/' || pathname.startsWith('/activity/')) return 'home'
  if (pathname === '/discover' || pathname.startsWith('/discover/')) return 'discover'
  if (pathname === '/publish') return 'publish'
  if (pathname === '/messages' || pathname.startsWith('/messages/')) return 'messages'
  if (pathname === '/profile' || pathname.startsWith('/profile/') || pathname === '/bookings' || pathname === '/following' || pathname === '/published' || pathname === '/my-records') return 'profile'
  return ''
}

function AppRoutes() {
  const { user, loading, logout, updateUser, changePassword } = useAuth()
  const { triggerRefresh } = useRefresh()
  const location = useLocation()
  const navigate = useNavigate()
  const showTabBar = shouldShowTabBar(location.pathname)
  const activeTab = showTabBar ? getActiveTab(location.pathname) : ''

  const handleRefresh = useCallback(async () => {
    await new Promise(r => setTimeout(r, 600))
    refreshMockStore()
    triggerRefresh()
  }, [triggerRefresh])

  const isMapPage = location.pathname === '/map'

  return (
    <UserPopupProvider>
      {isMapPage ? (
        <Routes>
          <Route path="/map" element={<MapPage />} />
        </Routes>
      ) : (
        <PullToRefresh onRefresh={handleRefresh}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/activity/:id" element={<ActivityDetail />} />
          <Route path="/discover" element={<Discover />} />
          <Route path="/record/:id" element={<RecordDetail />} />
          <Route path="/discover/record/:id" element={<RecordDetail />} />
          <Route path="/discover/record/create" element={<RecordCreate />} />
          <Route path="/publish" element={<Publish />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/messages/chat/:type/:id" element={<Chat />} />
          <Route path="/user/:id" element={<UserHome />} />
          <Route path="/profile" element={<Profile onLogout={logout} />} />
          <Route path="/profile/edit" element={<EditProfile user={user} onLogout={logout} updateUser={updateUser} changePassword={changePassword} />} />
          <Route path="/bookings" element={<MyBookings />} />
          <Route path="/following" element={<MyFollowing />} />
          <Route path="/published" element={<MyPublished />} />
          <Route path="/my-records" element={<MyRecords />} />
          <Route path="/guide" element={<Guide />} />
          <Route path="/admin" element={user?.role === 'admin' || user?.role === 'superadmin' ? <AdminReview /> : <Home />} />
          <Route path="/admin/invites" element={user?.role === 'admin' || user?.role === 'superadmin' ? <AdminInvites /> : <Home />} />
          <Route path="/admin/users" element={user?.role === 'superadmin' ? <AdminUsers /> : <Home />} />
        </Routes>
      </PullToRefresh>
      )}
      {showTabBar && <TabBar activeTab={activeTab} onNavigate={(path) => navigate(path)} />}
    </UserPopupProvider>
  )
}

export default function App() {
  useSafeArea()
  return (
    <AuthProvider>
      <RefreshProvider>
        <AppRoutes />
      </RefreshProvider>
    </AuthProvider>
  )
}
