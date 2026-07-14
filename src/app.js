import workouts from '../data/workouts.json'
import stretches from '../data/stretches.json'

// Small helper to create elements
function el(tag, cls, txt) {
  const e = document.createElement(tag)
  if (cls) e.className = cls
  if (txt) e.textContent = txt
  return e
}

// User storage (simple)
function loadUsers() {
  try {
    const raw = localStorage.getItem('users')
    if (!raw) return [{ username: 'jp', password: 'jp', label: 'jp' }]
    return JSON.parse(raw)
  } catch (e) {
    return [{ username: 'jp', password: 'jp', label: 'jp' }]
  }
}
function saveUsers(users) { localStorage.setItem('users', JSON.stringify(users)) }
function isAuthenticated() { return !!localStorage.getItem('auth_user') }
function currentUser() { return localStorage.getItem('auth_user') || '' }
function login(username, password) {
  const users = loadUsers()
  const u = users.find(x => x.username === username && x.password === password)
  if (u) { localStorage.setItem('auth_user', u.username); return true }
  return false
}
function logout() { localStorage.removeItem('auth_user') }

// App init
export function init(root) {
  if (!isAuthenticated()) return renderLogin(root)
  renderMainMenu(root)
  window.onpopstate = () => route(location.pathname)
}

function route(path) {
  const root = document.getElementById('app')
  if (!root) return
  const parts = path.split('/').filter(Boolean)
  if (parts.length === 0) return isAuthenticated() ? renderMainMenu(root) : renderLogin(root)
  if (parts[0] === 'weekly') return renderWeekly(root)
  if (parts[0] === 'day') return renderDay(root, parts[1])
  if (parts[0] === 'exercise') return renderExercise(root, parts[1], parts[2])
  return isAuthenticated() ? renderMainMenu(root) : renderLogin(root)
}
function navTo(path) { history.pushState({}, '', path); route(path) }

// Login screen
function renderLogin(root) {
  root.innerHTML = ''
  const card = el('div','max-w-sm mx-auto mt-12 p-6 bg-white rounded shadow','')
  card.appendChild(el('h2','text-xl font-semibold mb-4','Sign in'))
  const user = el('input','w-full mb-2 p-2 border rounded')
  user.placeholder = 'username'
  const pass = el('input','w-full mb-4 p-2 border rounded')
  pass.type = 'password'
  pass.placeholder = 'password'
  const btn = el('button','w-full bg-indigo-600 text-white p-2 rounded','Sign in')
  const err = el('div','text-sm text-red-600 mt-2','')
  btn.addEventListener('click', () => {
    const ok = login(user.value.trim(), pass.value)
    if (!ok) { err.textContent = 'Invalid credentials'; return }
    navTo('/')
    renderMainMenu(root)
  })
  card.appendChild(user)
  card.appendChild(pass)
  card.appendChild(btn)
  card.appendChild(err)
  root.appendChild(card)
}

// Main menu
function renderMainMenu(root) {
  root.innerHTML = ''
  const header = el('div','p-4 bg-indigo-600 text-white flex justify-between items-center',`Welcome ${currentUser()}`)
  const logoutBtn = el('button','text-sm underline','Logout')
  logoutBtn.addEventListener('click', () => { logout(); navTo('/'); renderLogin(root) })
  header.appendChild(logoutBtn)
  root.appendChild(header)

  const container = el('div','p-4 space-y-4 mx-auto max-w-4xl px-4')

  const exercise = el('div','p-4 bg-white rounded shadow','')
  exercise.appendChild(el('h3','text-lg font-semibold','Exercise'))
  const scheduleBtn = el('button','mt-3 bg-indigo-500 text-white px-3 py-2 rounded mr-2','Schedule')
  scheduleBtn.addEventListener('click', () => navTo('/weekly'))
  const muscleBtn = el('button','mt-3 bg-gray-200 px-3 py-2 rounded','Muscle')
  muscleBtn.addEventListener('click', () => navTo('/muscle'))
  exercise.appendChild(scheduleBtn)
  exercise.appendChild(muscleBtn)
  container.appendChild(exercise)

  const stretch = el('div','p-4 bg-white rounded shadow','')
  stretch.appendChild(el('h3','text-lg font-semibold','Stretch'))
  const stretchBtn = el('button','mt-3 bg-indigo-500 text-white px-3 py-2 rounded','Open Stretch Library')
  stretchBtn.addEventListener('click', () => navTo('/stretch'))
  stretch.appendChild(stretchBtn)
  container.appendChild(stretch)

  root.appendChild(container)
}

// Weekly list - single column, constrained width
function renderWeekly(root) {
  root.innerHTML = ''
  const header = el('div','p-4 bg-indigo-600 text-white flex justify-between items-center','Weekly Workout')
  root.appendChild(header)
  const topControls = el('div','p-4')
  const backToMenu = el('button','text-sm text-indigo-100 underline','← Back to Menu')
  backToMenu.addEventListener('click', () => navTo('/'))
  topControls.appendChild(backToMenu)
  root.appendChild(topControls)

  const listContainer = el('div','mx-auto max-w-4xl px-4')
  const list = el('div','p-4 flex flex-col gap-3')
  const days = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday']
  days.forEach(d => {
    const btn = el('button','text-left w-full p-3 bg-white rounded shadow', d.charAt(0).toUpperCase()+d.slice(1))
    btn.addEventListener('click', () => navTo(`/day/${d}`))
    list.appendChild(btn)
  })
  listContainer.appendChild(list)
  root.appendChild(listContainer)
}

function renderDay(root, day) {
  root.innerHTML = ''
  const back = el('button', 'm-4 text-sm text-indigo-600', '← Back')
  back.addEventListener('click', () => navTo('/weekly'))
  root.appendChild(back)
  const container = el('div','mx-auto max-w-4xl px-4')
  const h = el('h1','text-2xl font-bold p-4', day.charAt(0).toUpperCase()+day.slice(1))
  container.appendChild(h)

  const data = workouts[day]
  if (!data) { container.appendChild(el('p','p-4','No data')); root.appendChild(container); return }

  if (data.type === 'rest') { container.appendChild(el('p','p-4','Rest day')); root.appendChild(container); return }

  if (data.type === 'single') {
    const card = el('div','session-card m-4','')
    card.appendChild(el('h2','text-xl font-semibold', data.title))
    const btn = el('button','mt-4 bg-indigo-500 text-white px-3 py-2 rounded','Open Session')
    btn.addEventListener('click', () => navTo(`/exercise/${day}/single`))
    card.appendChild(btn)
    container.appendChild(card)
    root.appendChild(container)
    return
  }

  if (data.type === 'double') {
    const am = el('div','session-card m-4','')
    am.appendChild(el('h3','text-lg font-semibold','AM - '+data.am.title))
    const amBtn = el('button','mt-3 bg-indigo-500 text-white px-3 py-2 rounded','Open AM')
    amBtn.addEventListener('click', () => navTo(`/exercise/${day}/am`))
    am.appendChild(amBtn)
    container.appendChild(am)

    const pm = el('div','session-card m-4','')
    pm.appendChild(el('h3','text-lg font-semibold','PM - '+data.pm.title))
    const pmBtn = el('button','mt-3 bg-indigo-500 text-white px-3 py-2 rounded','Open PM')
    pmBtn.addEventListener('click', () => navTo(`/exercise/${day}/pm`))
    pm.appendChild(pmBtn)
    container.appendChild(pm)
    root.appendChild(container)
    return
  }
}

function renderExercise(root, day, sessionKey) {
  root.innerHTML = ''
  const back = el('button', 'm-4 text-sm text-indigo-600', '← Back')
  back.addEventListener('click', () => navTo(`/day/${day}`))
  root.appendChild(back)
  const data = workouts[day]
  if (!data) return root.appendChild(el('p','p-4','No data'))
  let session = null
  if (data.type === 'single' && sessionKey === 'single') session = data.session
  if (data.type === 'double') session = data[sessionKey].session
  if (!session) return root.appendChild(el('p','p-4','Session not found'))

  const list = el('div','p-4 space-y-4')
  const getFallbackDataUrl = (label) => {
    const svg = `
      <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 320 120' width='320' height='120'>
        <rect width='100%' height='100%' fill='%23f8fafc' rx='8' />
        <g transform='translate(40,60)'>
          <rect x='-40' y='-10' width='80' height='20' fill='%233b82f6' rx='4'>
            <animateTransform attributeName='transform' type='translate' dur='1.2s' values='0 0;0 -6;0 0' repeatCount='indefinite'/>
          </rect>
          <circle cx='-64' cy='0' r='14' fill='%230f172a'>
            <animate attributeName='r' values='14;10;14' dur='1.2s' repeatCount='indefinite'/>
          </circle>
          <circle cx='64' cy='0' r='14' fill='%230f172a'>
            <animate attributeName='r' values='14;10;14' dur='1.2s' begin='0.3s' repeatCount='indefinite'/>
          </circle>
        </g>
        <text x='160' y='100' font-family='Arial,Helvetica,sans-serif' font-size='12' fill='%236b7280' text-anchor='middle'>${label.replace(/&/g,'&amp;')}</text>
      </svg>`
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg)
  }

  session.forEach(ex => {
    const card = el('div','bg-white rounded p-4 shadow','')
    card.appendChild(el('h4','text-lg font-semibold', ex.name))
    card.appendChild(el('p','text-sm text-gray-700', `${ex.sets} sets x ${ex.reps}`))
    card.appendChild(el('p','text-sm text-gray-600 italic', ex.notes || ''))
    const gif = el('div','mt-2','')
    const img = el('img','w-full max-w-xs rounded','')
    img.src = `/placeholders/${ex.gif}`
    img.alt = ex.name
    img.onerror = () => { img.src = getFallbackDataUrl(ex.name) }
    gif.appendChild(img)
    card.appendChild(gif)
    list.appendChild(card)
  })

  const container = el('div','mx-auto max-w-4xl px-4')
  container.appendChild(list)
  root.appendChild(container)
}

function renderMuscle(root) {
  root.innerHTML = ''
  const back = el('button','m-4 text-sm text-indigo-600','← Back')
  back.addEventListener('click', () => navTo('/'))
  root.appendChild(back)
  root.appendChild(el('h2','text-2xl font-bold p-4','Muscle View (Coming soon)'))
  root.appendChild(el('p','p-4','This view will be populated later.'))
}

function renderStretch(root) {
  root.innerHTML = ''
  const back = el('button','m-4 text-sm text-indigo-600','← Back')
  back.addEventListener('click', () => navTo('/'))
  root.appendChild(back)
  root.appendChild(el('h2','text-2xl font-bold p-4','Stretch Library (Coming soon)'))
  root.appendChild(el('p','p-4','Stretch categories will be added here later.'))
}
