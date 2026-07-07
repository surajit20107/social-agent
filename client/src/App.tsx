import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Chat from './pages/Chat';
import ChatWindow from './pages/ChatWindow';
import Accounts from './pages/Accounts';
import SettingsPage from './pages/Settings';
import About from './pages/About';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />

        {/* App routes with sidebar */}
        <Route element={<Layout />}>
          <Route path="/chat" element={<Chat />} />
          <Route path="/chat/:id" element={<ChatWindow />} />
          <Route path="/accounts" element={<Accounts />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/about" element={<About />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}