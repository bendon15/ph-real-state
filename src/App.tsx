import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Listings from './pages/Listings'
import PropertyDetail from './pages/PropertyDetail'
import About from './pages/About'
import Contact from './pages/Contact'
import NotFound from './pages/NotFound'

const AdminLogin = lazy(() => import('./pages/admin/Login'))
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'))
const Dashboard = lazy(() => import('./pages/admin/Dashboard'))
const AdminProperties = lazy(() => import('./pages/admin/Properties'))
const PropertyForm = lazy(() => import('./pages/admin/PropertyForm'))
const AdminInquiries = lazy(() => import('./pages/admin/Inquiries'))

export default function App() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-slate-500">Loading…</div>}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="properties" element={<Listings />} />
          <Route path="properties/:slug" element={<PropertyDetail />} />
          <Route path="about" element={<About />} />
          <Route path="contact" element={<Contact />} />
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route path="admin/login" element={<AdminLogin />} />
        <Route path="admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="properties" element={<AdminProperties />} />
          <Route path="properties/new" element={<PropertyForm />} />
          <Route path="properties/:id" element={<PropertyForm />} />
          <Route path="inquiries" element={<AdminInquiries />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
