import { Link } from 'react-router-dom'

export default function NotFound() {
  return <div className="wrap py-24 text-center"><h1 className="text-5xl font-semibold">Page not found</h1><p className="mt-2 text-slate-500">The page you are looking for does not exist.</p><Link to="/" className="btn-navy mt-6">Go home</Link></div>
}
