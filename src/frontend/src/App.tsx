import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import Layout from './components/Layout'
import Login from './components/auth/Login'
import Register from './components/auth/Register'
import RoomList from './components/rooms/RoomList'
import Room from './components/rooms/Room'
import CreateRoom from './components/rooms/CreateRoom'

function App() {
  const { isAuthenticated } = useAuth()

  return (
    <Layout>
      <Routes>
        <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <Login />} />
        <Route path="/register" element={isAuthenticated ? <Navigate to="/" /> : <Register />} />
        <Route path="/" element={<RoomList />} />
        <Route path="/room/create" element={isAuthenticated ? <CreateRoom /> : <Navigate to="/login" />} />
        <Route path="/room/:roomId" element={isAuthenticated ? <Room /> : <Navigate to="/login" />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Layout>
  )
}

export default App
