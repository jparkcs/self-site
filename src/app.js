import workouts from '../data/workouts.json'

function el(tag, cls, txt) {
  const e = document.createElement(tag)
  if (cls) e.className = cls
  if (txt) e.textContent = txt
  return e
}

export function init(root) {
  renderWeekly(root)
  window.onpopstate = () => {
    route(location.pathname)
  }
}

function route(path) {
  const root = document.getElementById('app')
  if (!root) return
  const parts = path.split('/').filter(Boolean)
  if (parts.length === 0) return renderWeekly(root)
  if (parts[0] === 'day') return renderDay(root, parts[1])
  if (parts[0] === 'exercise') return renderExercise(root, parts[1], parts[2])
  renderWeekly(root)
}

function navTo(path) {
  history.pushState({}, '', path)
  route(path)
}

function renderWeekly(root) {
  root.innerHTML = ''
  const header = el('div', 'p-4 bg-indigo-600 text-white', 'Weekly Workout')
  root.appendChild(header)
  const grid = el('div', 'p-4 grid grid-cols-2 gap-4')
  const days = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday']
  days.forEach(d => {
    const btn = el('button', 'day-btn', d.charAt(0).toUpperCase()+d.slice(1))
    btn.addEventListener('click', () => navTo(`/day/${d}`))
    grid.appendChild(btn)
  })
  root.appendChild(grid)
}

function renderDay(root, day) {
  root.innerHTML = ''
  const back = el('button', 'm-4 text-sm text-indigo-600', '← Back')
  back.addEventListener('click', () => navTo('/'))
  root.appendChild(back)
  const h = el('h1', 'text-2xl font-bold p-4', day.charAt(0).toUpperCase()+day.slice(1))
  root.appendChild(h)

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
    root.appendChild(card)
    return
  }

  if (data.type === 'double') {
    const am = el('div','session-card m-4','')
    am.appendChild(el('h3','text-lg font-semibold','AM - '+data.am.title))
    const amBtn = el('button','mt-3 bg-indigo-500 text-white px-3 py-2 rounded','Open AM')
    amBtn.addEventListener('click', () => navTo(`/exercise/${day}/am`))
    am.appendChild(amBtn)
    root.appendChild(am)

    const pm = el('div','session-card m-4','')
    pm.appendChild(el('h3','text-lg font-semibold','PM - '+data.pm.title))
    const pmBtn = el('button','mt-3 bg-indigo-500 text-white px-3 py-2 rounded','Open PM')
    pmBtn.addEventListener('click', () => navTo(`/exercise/${day}/pm`))
    pm.appendChild(pmBtn)
    root.appendChild(pm)
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
  root.appendChild(list)
}
