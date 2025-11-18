import { useEffect, useMemo, useState } from 'react'
import { BrowserRouter, Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom'
import { auth, db } from './firebase'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
} from 'firebase/auth'
import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  deleteDoc,
  setDoc,
} from 'firebase/firestore'
import './index.css'

function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
    return () => unsub()
  }, [])

  return { user, loading }
}

function AuthGate({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <FullScreenLoader />
  if (!user) return <Navigate to="/login" replace />
  return children
}

function FullScreenLoader({ label = 'Loading...' }) {
  return (
    <div className="min-h-screen grid place-items-center bg-slate-950 text-white">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
        <p className="text-blue-100">{label}</p>
      </div>
    </div>
  )
}

function Layout({ children }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10 sticky top-0 bg-slate-950/70 backdrop-blur z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="font-bold">GOS Events</Link>
          <nav className="flex items-center gap-3 text-sm">
            <Link to="/" className="hover:text-blue-400">Dashboard</Link>
            <Link to="/admin" className="hover:text-blue-400">Admin</Link>
            {user && (
              <button onClick={() => signOut(auth)} className="px-3 py-1.5 rounded bg-white/10 hover:bg-white/20">Logout</button>
            )}
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
      <footer className="text-center text-white/50 text-xs py-8">Real-time Events with Firebase</footer>
    </div>
  )
}

function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email, password)
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async () => {
    if (!email) return setError('Enter your email to reset password')
    try {
      await sendPasswordResetEmail(auth, email)
      alert('Password reset email sent')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-slate-950 text-white">
      <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-xl p-6">
        <h1 className="text-2xl font-semibold mb-4">Login</h1>
        <form onSubmit={handleLogin} className="space-y-3">
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email" className="w-full px-3 py-2 bg-white/10 rounded outline-none focus:ring-2 ring-blue-500" required />
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password" className="w-full px-3 py-2 bg-white/10 rounded outline-none focus:ring-2 ring-blue-500" required />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 rounded px-3 py-2">{loading ? 'Signing in...' : 'Sign In'}</button>
        </form>
        <div className="flex items-center justify-between mt-3 text-sm text-white/80">
          <Link to="/register" className="hover:text-blue-400">Create account</Link>
          <button onClick={handleReset} className="hover:text-blue-400">Forgot password?</button>
        </div>
      </div>
    </div>
  )
}

function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password)
      // Create user profile doc
      await setDoc(doc(db, 'profiles', cred.user.uid), {
        uid: cred.user.uid,
        name,
        email,
        createdAt: serverTimestamp(),
        role: 'user',
      })
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-slate-950 text-white">
      <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-xl p-6">
        <h1 className="text-2xl font-semibold mb-4">Create account</h1>
        <form onSubmit={handleRegister} className="space-y-3">
          <input value={name} onChange={(e) => setName(e.target.value)} type="text" placeholder="Full name" className="w-full px-3 py-2 bg-white/10 rounded outline-none focus:ring-2 ring-blue-500" required />
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email" className="w-full px-3 py-2 bg-white/10 rounded outline-none focus:ring-2 ring-blue-500" required />
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password (min 6 chars)" minLength={6} className="w-full px-3 py-2 bg-white/10 rounded outline-none focus:ring-2 ring-blue-500" required />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 rounded px-3 py-2">{loading ? 'Creating...' : 'Create account'}</button>
        </form>
        <div className="flex items-center justify-between mt-3 text-sm text-white/80">
          <Link to="/login" className="hover:text-blue-400">Back to login</Link>
        </div>
      </div>
    </div>
  )
}

function useProfile(uid) {
  const [profile, setProfile] = useState(null)
  useEffect(() => {
    if (!uid) return
    const ref = doc(db, 'profiles', uid)
    getDoc(ref).then((snap) => {
      if (snap.exists()) setProfile(snap.data())
    })
  }, [uid])
  return profile
}

function Dashboard() {
  const { user } = useAuth()
  const profile = useProfile(user?.uid)
  const [events, setEvents] = useState([])
  const [myRegs, setMyRegs] = useState({})
  const [loading, setLoading] = useState(true)
  const regsCol = useMemo(() => collection(db, 'registrations'), [])

  useEffect(() => {
    const q = query(collection(db, 'events'), orderBy('startAt', 'asc'))
    const unsub = onSnapshot(q, (snap) => {
      const list = []
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }))
      setEvents(list)
      setLoading(false)
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    if (!user) return
    const q = query(collection(db, 'registrations'))
    const unsub = onSnapshot(q, (snap) => {
      const mine = {}
      snap.forEach((d) => {
        const v = d.data()
        if (v.uid === user.uid) mine[v.eventId] = { id: d.id, ...v }
      })
      setMyRegs(mine)
    })
    return () => unsub()
  }, [user])

  const toggleRegistration = async (event) => {
    const reg = myRegs[event.id]
    if (reg) {
      await deleteDoc(doc(db, 'registrations', reg.id))
    } else {
      await addDoc(regsCol, {
        uid: user.uid,
        eventId: event.id,
        createdAt: serverTimestamp(),
      })
    }
  }

  if (loading) return <FullScreenLoader label="Loading events..." />

  return (
    <Layout>
      <h1 className="text-2xl font-semibold mb-4">Welcome{profile?.name ? `, ${profile.name}` : ''}</h1>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {events.map((ev) => {
          const registered = !!myRegs[ev.id]
          return (
            <div key={ev.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col">
              <div className="flex-1">
                <h3 className="text-lg font-semibold">{ev.title}</h3>
                <p className="text-white/70 text-sm mt-1">{ev.description}</p>
                <p className="text-white/60 text-xs mt-2">Starts: {ev.startAt?.toDate ? ev.startAt.toDate().toLocaleString() : ''}</p>
                {ev.location && <p className="text-white/60 text-xs">Location: {ev.location}</p>}
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className={`text-xs px-2 py-1 rounded ${registered ? 'bg-green-500/20 text-green-300' : 'bg-white/10 text-white/70'}`}>{registered ? 'Registered' : 'Not registered'}</span>
                <button onClick={() => toggleRegistration(ev)} className={`px-3 py-1.5 rounded ${registered ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}>{registered ? 'Unregister' : 'Register'}</button>
              </div>
            </div>
          )
        })}
      </div>
      {events.length === 0 && (
        <div className="text-white/60 text-sm mt-6">No events yet. Check back later.</div>
      )}
    </Layout>
  )
}

function useIsAdmin(uid) {
  const [admin, setAdmin] = useState(false)
  useEffect(() => {
    if (!uid) return
    const ref = doc(db, 'profiles', uid)
    getDoc(ref).then((snap) => {
      if (snap.exists()) setAdmin(snap.data().role === 'admin')
    })
  }, [uid])
  return admin
}

function AdminPage() {
  const { user } = useAuth()
  const isAdmin = useIsAdmin(user?.uid)
  const [events, setEvents] = useState([])

  useEffect(() => {
    const q = query(collection(db, 'events'), orderBy('startAt', 'asc'))
    const unsub = onSnapshot(q, (snap) => {
      const list = []
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }))
      setEvents(list)
    })
    return () => unsub()
  }, [])

  const [form, setForm] = useState({ title: '', description: '', startAt: '', location: '' })
  const [editing, setEditing] = useState(null)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.title || !form.startAt) {
      setError('Title and Start Date/Time are required')
      return
    }
    const payload = {
      title: form.title,
      description: form.description,
      startAt: new Date(form.startAt),
      location: form.location,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    }
    try {
      if (editing) {
        await updateDoc(doc(db, 'events', editing), payload)
        setEditing(null)
      } else {
        await addDoc(collection(db, 'events'), payload)
      }
      setForm({ title: '', description: '', startAt: '', location: '' })
    } catch (err) {
      setError(err.message)
    }
  }

  const startEdit = (ev) => {
    setEditing(ev.id)
    setForm({
      title: ev.title || '',
      description: ev.description || '',
      startAt: ev.startAt?.toDate ? new Date(ev.startAt.toDate()).toISOString().slice(0, 16) : '',
      location: ev.location || '',
    })
  }

  const remove = async (id) => {
    await deleteDoc(doc(db, 'events', id))
  }

  if (!isAdmin) {
    return (
      <Layout>
        <div className="text-white/70">You need admin access to manage events.</div>
      </Layout>
    )
  }

  return (
    <Layout>
      <h2 className="text-xl font-semibold mb-3">Manage Events</h2>
      <form onSubmit={submit} className="grid sm:grid-cols-2 gap-3 bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
        <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Event title" className="px-3 py-2 bg-white/10 rounded outline-none focus:ring-2 ring-blue-500" />
        <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Location" className="px-3 py-2 bg-white/10 rounded outline-none focus:ring-2 ring-blue-500" />
        <input value={form.startAt} onChange={(e) => setForm({ ...form, startAt: e.target.value })} type="datetime-local" className="px-3 py-2 bg-white/10 rounded outline-none focus:ring-2 ring-blue-500" />
        <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Short description" className="px-3 py-2 bg-white/10 rounded outline-none focus:ring-2 ring-blue-500 sm:col-span-2" />
        {error && <p className="text-red-400 text-sm sm:col-span-2">{error}</p>}
        <div className="sm:col-span-2 flex gap-2">
          <button className="bg-blue-600 hover:bg-blue-700 rounded px-3 py-2">{editing ? 'Update' : 'Create'} Event</button>
          {editing && (
            <button type="button" onClick={() => { setEditing(null); setForm({ title: '', description: '', startAt: '', location: '' }) }} className="bg-white/10 hover:bg-white/20 rounded px-3 py-2">Cancel</button>
          )}
        </div>
      </form>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {events.map((ev) => (
          <div key={ev.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
            <h3 className="font-semibold">{ev.title}</h3>
            <p className="text-white/70 text-sm">{ev.description}</p>
            <p className="text-white/60 text-xs mt-2">Starts: {ev.startAt?.toDate ? ev.startAt.toDate().toLocaleString() : ''}</p>
            <div className="mt-3 flex gap-2">
              <button onClick={() => startEdit(ev)} className="px-3 py-1.5 rounded bg-white/10 hover:bg-white/20">Edit</button>
              <button onClick={() => remove(ev.id)} className="px-3 py-1.5 rounded bg-red-600 hover:bg-red-700">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </Layout>
  )
}

function AppRoutes() {
  const { user, loading } = useAuth()
  if (loading) return <FullScreenLoader />
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/admin" element={<AuthGate><AdminPage /></AuthGate>} />
      <Route path="/" element={<AuthGate><Dashboard /></AuthGate>} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
