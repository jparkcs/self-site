import workouts from '../data/workouts.json'
import stretches from '../data/stretches.json'

// --- Simple client-side auth + user management ---
function el(tag, cls, txt) {
  const e = document.createElement(tag)
  if (cls) e.className = cls
  if (txt) e.textContent = txt
  return e
}

function loadUsers() {
  root.innerHTML = ''
  const back = el('button','m-4 text-sm text-indigo-600','← Back')
  back.addEventListener('click', () => navTo('/'))
  root.appendChild(back)
  root.appendChild(el('h2','text-2xl font-bold p-4','Stretch Library (Coming soon)'))
  root.appendChild(el('p','p-4','Stretch categories will be added here later.'))
function renderUserSelect(root) {
  root.innerHTML = ''
  const users = loadUsers()
  const card = el('div','max-w-md mx-auto mt-8 p-6 bg-white rounded shadow','')
  card.appendChild(el('h2','text-xl font-semibold mb-4','Select user or add new'))
  const select = el('select','w-full p-2 mb-3 border rounded','')
  users.forEach(u => {
    const opt = document.createElement('option')
    opt.value = u.username
    opt.textContent = u.username
    select.appendChild(opt)
  })
  const proceed = el('button','w-full bg-indigo-600 text-white p-2 rounded mb-2','Sign in')
  const add = el('button','w-full border p-2 rounded','Add new user')
  proceed.addEventListener('click', () => renderLogin(root, select.value))
  add.addEventListener('click', () => renderAddUser(root))
  card.appendChild(select)
  card.appendChild(proceed)
  card.appendChild(add)
  root.appendChild(card)
}

function renderAddUser(root) {
  root.innerHTML = ''
  const card = el('div','max-w-md mx-auto mt-8 p-6 bg-white rounded shadow','')
  card.appendChild(el('h2','text-xl font-semibold mb-4','Add user'))
  const user = el('input','w-full mb-2 p-2 border rounded')
  user.placeholder = 'username'
  const pass = el('input','w-full mb-4 p-2 border rounded')
  pass.type = 'password'
  pass.placeholder = 'password'
  const btn = el('button','w-full bg-indigo-600 text-white p-2 rounded','Create')
  const back = el('button','w-full mt-2 border p-2 rounded','Back')
  btn.addEventListener('click', () => {
    const users = loadUsers()
    users.push({ username: user.value.trim(), password: pass.value, label: user.value.trim() })
    saveUsers(users)
    renderUserSelect(root)
  })
  back.addEventListener('click', () => renderUserSelect(root))
  card.appendChild(user)
  card.appendChild(pass)
  card.appendChild(btn)
  card.appendChild(back)
  root.appendChild(card)
}

function renderLogin(root, prefillUser) {
  root.innerHTML = ''
  const card = el('div','max-w-sm mx-auto mt-12 p-6 bg-white rounded shadow','')
  card.appendChild(el('h2','text-xl font-semibold mb-4','Please sign in'))
  const user = el('input','w-full mb-2 p-2 border rounded')
  user.placeholder = 'username'
  if (prefillUser) user.value = prefillUser
  const pass = el('input','w-full mb-4 p-2 border rounded')
  pass.type = 'password'
  pass.placeholder = 'password'
  const btn = el('button','w-full bg-indigo-600 text-white p-2 rounded','Sign in')
  const err = el('div','text-sm text-red-600 mt-2','')
  btn.addEventListener('click', () => {
    const ok = login(user.value.trim(), pass.value)
    if (!ok) {
      err.textContent = 'Invalid credentials'
      return
    }
    navTo('/')
    renderMainMenu(root)
  })
  const back = el('button','w-full mt-2 border p-2 rounded','Back')
  back.addEventListener('click', () => renderUserSelect(root))
  card.appendChild(user)
  card.appendChild(pass)
  card.appendChild(btn)
  card.appendChild(err)
  card.appendChild(back)
  root.appendChild(card)
}

function route(path) {
  const root = document.getElementById('app')
  if (!root) return
  const parts = path.split('/').filter(Boolean)
  if (parts.length === 0) {
    if (isAuthenticated()) return renderMainMenu(root)
    return renderLogin(root)
  }
  if (parts[0] === 'weekly') return renderWeekly(root)
  if (parts[0] === 'day') return renderDay(root, parts[1])
  if (parts[0] === 'exercise') return renderExercise(root, parts[1], parts[2])
  if (isAuthenticated()) return renderMainMenu(root)
  return renderLogin(root)
}

function navTo(path) {
  history.pushState({}, '', path)
  route(path)
}

function renderMainMenu(root) {
  root.innerHTML = ''
  const header = el('div','p-4 bg-indigo-600 text-white flex justify-between items-center',`Welcome ${currentUser()}`)
  const logoutBtn = el('button','text-sm underline','Logout')
  logoutBtn.addEventListener('click', () => { logout(); renderUserSelect(root) })
  header.appendChild(logoutBtn)
  root.appendChild(header)
  const container = el('div','p-4 space-y-4 mx-auto max-w-4xl px-4')

  const exercise = el('div','p-4 bg-white rounded shadow','')
  exercise.appendChild(el('h3','text-lg font-semibold','Exercise'))
  const scheduleBtn = el('button','mt-3 bg-indigo-500 text-white px-3 py-2 rounded mr-2','Schedule')
  scheduleBtn.addEventListener('click', () => navTo('/weekly'))
  const muscleBtn = el('button','mt-3 bg-gray-200 px-3 py-2 rounded','Muscle')
  muscleBtn.addEventListener('click', () => renderMuscle(root))
  exercise.appendChild(scheduleBtn)
  exercise.appendChild(muscleBtn)
  container.appendChild(exercise)

  const stretch = el('div','p-4 bg-white rounded shadow','')
  stretch.appendChild(el('h3','text-lg font-semibold','Stretch'))
  const stretchBtn = el('button','mt-3 bg-indigo-500 text-white px-3 py-2 rounded','Open Stretch Library')
  stretchBtn.addEventListener('click', () => renderStretch(root))
  stretch.appendChild(stretchBtn)
  container.appendChild(stretch)

  root.appendChild(container)
}

function renderWeekly(root) {
  root.innerHTML = ''
  const header = el('div', 'p-4 bg-indigo-600 text-white flex justify-between items-center', 'Weekly Workout')
  const logoutBtn = el('button','text-sm underline','Logout')
  logoutBtn.addEventListener('click', () => {
    logout()
    renderLogin(root)
  })
  root.appendChild(header)
  header.appendChild(logoutBtn)
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
  back.addEventListener('click', () => navTo('/'))
  root.appendChild(back)
  const container = el('div','mx-auto max-w-4xl px-4')
  const h = el('h1', 'text-2xl font-bold p-4', day.charAt(0).toUpperCase()+day.slice(1))
  container.appendChild(h)

  const data = workouts[day]
  if (!data) {
    root.appendChild(el('p','p-4','No data'))
    return
  }

  if (data.type === 'rest') {
    root.appendChild(el('p','p-4','Rest day'))
    return
  }

  if (data.type === 'single') {
    const card = el('div','session-card m-4','')
    const t = el('h2','text-xl font-semibold', data.title)
    card.appendChild(t)
    const btn = el('button','mt-4 bg-indigo-500 text-white px-3 py-2 rounded','Open Session')
    btn.addEventListener('click', () => navTo(`/exercise/${day}/single`))
    card.appendChild(btn)
    container.appendChild(card)
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
  root.appendChild(container)
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
        <text x='160' y='100' font-family='Arial,Helvetica,sans-serif' font-size='12' fill='%236b7280' text-anchor='middle'>` + label.replace(/&/g,'&amp;') + `</text>
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
  back.addEventListener('click', () => renderMainMenu(root))
  root.appendChild(back)
  root.appendChild(el('h2','text-2xl font-bold p-4','Muscle View'))
  // Simple muscle grouping: list all exercises and allow filtering by name
  const all = []
  Object.keys(workouts).forEach(day => {
    const d = workouts[day]
    if (d.type === 'single') all.push(...d.session)
    if (d.type === 'double') { all.push(...d.am.session); all.push(...d.pm.session) }
  })
  const container = el('div','mx-auto max-w-4xl px-4')
  const list = el('div','p-4 space-y-3')
  all.forEach(e => {
    const card = el('div','bg-white rounded p-3 shadow','')
    card.appendChild(el('div','font-semibold', e.name))
    card.appendChild(el('div','text-sm text-gray-600', e.notes || ''))
    list.appendChild(card)
  })
  container.appendChild(list)
  root.appendChild(container)
}

function renderStretch(root) {
  root.innerHTML = ''
  const back = el('button','m-4 text-sm text-indigo-600','← Back')
  back.addEventListener('click', () => navTo('/'))
  root.appendChild(back)
  root.appendChild(el('h2','text-2xl font-bold p-4','Muscle View (Coming soon)'))
  root.appendChild(el('p','p-4','This view will be populated later.'))
        row.appendChild(info)
        card.appendChild(row)
      })
    } else if (typeof v === 'object') {
      Object.keys(v).forEach(sub => {
        const subHdr = el('div','mt-3 font-semibold', sub)
        card.appendChild(subHdr)
        v[sub].forEach(s => {
          const row = el('div','flex items-center gap-3 mt-2','')
          const img = el('img','w-24 rounded','')
          img.src = `/placeholders/${s.gif}`
          img.alt = s.name
          const info = el('div','', '')
          info.appendChild(el('div','font-medium', s.name))
          row.appendChild(img)
          row.appendChild(info)
          card.appendChild(row)
        })
      })
    }
    container.appendChild(card)
  })
  root.appendChild(container)
}
