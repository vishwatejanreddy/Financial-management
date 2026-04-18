// script.js — Frontend logic for FinanceIQ

// ============================================================
// AUTH UTILITIES
// ============================================================

// Check auth on dashboard page load
if (document.querySelector('.dashboard-page')) {
  const token = localStorage.getItem('fi_token');
  const email = localStorage.getItem('fi_email');
  if (!token) {
    window.location.href = 'index.html';
  } else {
    const el = document.getElementById('nav-email');
    if (el) el.textContent = email || '';
  }
}

// Redirect logged-in users away from auth page
if (document.querySelector('.auth-page')) {
  if (localStorage.getItem('fi_token')) {
    window.location.href = 'dashboard.html';
  }
}

// Logout
function logout() {
  localStorage.removeItem('fi_token');
  localStorage.removeItem('fi_email');
  window.location.href = 'index.html';
}

// Switch between login/signup tabs
function switchTab(tab) {
  document.getElementById('form-login').classList.toggle('active', tab === 'login');
  document.getElementById('form-signup').classList.toggle('active', tab === 'signup');
  document.getElementById('tab-login').classList.toggle('active', tab === 'login');
  document.getElementById('tab-signup').classList.toggle('active', tab === 'signup');
  clearErrors();
}

function clearErrors() {
  ['login-error', 'signup-error', 'calc-error'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.classList.add('hidden'); el.textContent = ''; }
  });
}

function showError(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.classList.remove('hidden');
}

function setLoading(btnId, loading) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.disabled = loading;
  btn.querySelector('.btn-text').classList.toggle('hidden', loading);
  btn.querySelector('.btn-loader').classList.toggle('hidden', !loading);
}

// ============================================================
// LOGIN
// ============================================================
async function handleLogin(e) {
  e.preventDefault();
  clearErrors();

  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  setLoading('login-btn', true);
  try {
    const res  = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!data.success) {
      showError('login-error', data.message);
    } else {
      localStorage.setItem('fi_token', data.token);
      localStorage.setItem('fi_email', data.email);
      window.location.href = 'dashboard.html';
    }
  } catch {
    showError('login-error', 'Server error. Please try again.');
  } finally {
    setLoading('login-btn', false);
  }
}

// ============================================================
// SIGNUP
// ============================================================
async function handleSignup(e) {
  e.preventDefault();
  clearErrors();

  const email    = document.getElementById('signup-email').value.trim();
  const password = document.getElementById('signup-password').value;

  setLoading('signup-btn', true);
  try {
    const res  = await fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!data.success) {
      showError('signup-error', data.message);
    } else {
      localStorage.setItem('fi_token', data.token);
      localStorage.setItem('fi_email', data.email);
      window.location.href = 'dashboard.html';
    }
  } catch {
    showError('signup-error', 'Server error. Please try again.');
  } finally {
    setLoading('signup-btn', false);
  }
}

// ============================================================
// CALCULATE (Dashboard)
// ============================================================
async function handleCalculate(e) {
  e.preventDefault();
  clearErrors();

  const payload = {
    name:     document.getElementById('f-name').value.trim(),
    income:   document.getElementById('f-income').value,
    expenses: document.getElementById('f-expenses').value,
    cibil:    document.getElementById('f-cibil').value,
    tenure:   document.getElementById('f-tenure').value
  };

  setLoading('calc-btn', true);
  try {
    const res  = await fetch('/api/calculate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + localStorage.getItem('fi_token')
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (!data.success) {
      showError('calc-error', data.message);
      // If session expired, redirect to login
      if (data.message && data.message.includes('Session')) {
        setTimeout(() => logout(), 2000);
      }
    } else {
      renderResults(data);
    }
  } catch {
    showError('calc-error', 'Server error. Please try again.');
  } finally {
    setLoading('calc-btn', false);
  }
}

// ============================================================
// RENDER RESULTS
// ============================================================
function fmt(n) {
  // Format number as ₹ with Indian comma style
  return '₹' + Number(n).toLocaleString('en-IN');
}

function renderResults(d) {
  // Show section
  const section = document.getElementById('results-section');
  section.classList.remove('hidden');

  // Smooth scroll to results
  setTimeout(() => section.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);

  // --- Summary Cards ---
  const summaryEl = document.getElementById('summary-cards');
  summaryEl.innerHTML = `
    <div class="summary-card" style="animation-delay:0s">
      <div class="s-label">Net Monthly Income</div>
      <div class="s-value">${fmt(d.income)}</div>
      <div class="s-sub">Gross monthly earnings</div>
    </div>
    <div class="summary-card" style="animation-delay:0.05s">
      <div class="s-label">Monthly Expenses</div>
      <div class="s-value">${fmt(d.expenses)}</div>
      <div class="s-sub">Regular outgoings</div>
    </div>
    <div class="summary-card accent" style="animation-delay:0.1s">
      <div class="s-label">Monthly Savings</div>
      <div class="s-value">${fmt(d.savings)}</div>
      <div class="s-sub">${((d.savings/d.income)*100).toFixed(1)}% of income</div>
    </div>
    <div class="summary-card" style="animation-delay:0.15s">
      <div class="s-label">CIBIL Score</div>
      <div class="s-value">${d.cibil}</div>
      <div class="s-sub">${d.cibilStatus}</div>
    </div>
  `;

  // --- CIBIL Banner ---
  const cibilEl = document.getElementById('cibil-banner');
  const icons   = { success: '✅', warning: '⚠️', error: '❌' };
  const titles  = { success: 'Excellent Credit', warning: 'Fair Credit', error: 'Poor Credit' };
  cibilEl.className = `cibil-banner ${d.cibilType}`;
  cibilEl.innerHTML = `
    <span class="cb-icon">${icons[d.cibilType]}</span>
    <div class="cb-body">
      <div class="cb-status">${titles[d.cibilType]} — Score: ${d.cibil}</div>
      <div class="cb-msg">${d.cibilMessage}</div>
    </div>
  `;

  // --- Products Note ---
  document.getElementById('products-note').textContent =
    `@ ${d.rate}% p.a. · ${d.tenure} month tenure`;

  // --- Products ---
  const grid = document.getElementById('products-grid');
  grid.innerHTML = '';

  d.products.forEach((p, i) => {
    const badge   = p.recommended
      ? '<span class="product-badge badge-rec">✓ Recommended</span>'
      : '<span class="product-badge badge-norec">✗ Not Recommended</span>';

    const pctColor = p.recommended ? 'color:var(--success)' : 'color:var(--error)';

    const card = document.createElement('div');
    card.className = `product-card ${p.recommended ? 'recommended' : 'not-recommended'}`;
    card.style.animationDelay = `${i * 0.08}s`;
    card.innerHTML = `
      ${badge}
      <span class="product-emoji">${p.emoji}</span>
      <div class="product-name">${p.name}</div>
      <div class="product-price">Price: ${fmt(p.price)}</div>
      <div class="product-emi-box">
        <div class="product-emi-amount">${fmt(p.emi)}<span style="font-size:0.85rem;font-weight:400;color:var(--text-soft)">/mo</span></div>
        <div class="product-emi-label">${p.tenure}-month EMI</div>
        <div class="product-emi-pct" style="${pctColor}">${p.emiPercent}% of your income</div>
      </div>
    `;
    grid.appendChild(card);
  });
}
