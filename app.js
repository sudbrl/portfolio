// Configuration - REPLACE WITH YOUR SUPABASE CREDENTIALS
const SUPABASE_URL = "YOUR_SUPABASE_URL";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";
const API_URL = "/.netlify/functions/get-market";

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// State
let portfolio = [];
let marketData = {};
let user = null;
let sectorChart = null;
let holdingChart = null;

// NEPSE Sector Mapping
const SECTOR_MAP = {
    'NABIL': 'Commercial Banks', 'NICA': 'Commercial Banks', 'NIMB': 'Commercial Banks', 'SANIMA': 'Commercial Banks',
    'SBL': 'Commercial Banks', 'ADDBL': 'Commercial Banks', 'KBL': 'Commercial Banks', 'EBL': 'Commercial Banks',
    'CZBIL': 'Commercial Banks', 'NMB': 'Commercial Banks', 'SBI': 'Commercial Banks', 'PCBL': 'Commercial Banks',
    'GBIME': 'Development Banks', 'JBBL': 'Development Banks', 'MLBBL': 'Development Banks', 'NCC': 'Development Banks',
    'SHINE': 'Development Banks', 'MPDL': 'Development Banks', 'SINDU': 'Commercial Banks', 'JBLB': 'Commercial Banks',
    'CFCL': 'Finance', 'GUFL': 'Finance', 'ICFC': 'Finance', 'JFL': 'Finance', 'MFIL': 'Finance',
    'AKJCL': 'Hydropower', 'AKPL': 'Hydropower', 'API': 'Hydropower', 'BPCL': 'Hydropower', 'CHCL': 'Hydropower',
    'HIDCL': 'Hydropower', 'NHPC': 'Hydropower', 'SHPC': 'Hydropower', 'SPDL': 'Hydropower', 'UPPER': 'Hydropower',
    'ALICL': 'Life Insurance', 'CLI': 'Life Insurance', 'LICN': 'Life Insurance', 'NLIC': 'Life Insurance', 'PLIC': 'Life Insurance',
    'SLIC': 'Life Insurance', 'SUNL': 'Life Insurance', 'RELN': 'Life Insurance', 'NLICL': 'Life Insurance',
    'NICL': 'Non-Life Insurance', 'NIL': 'Non-Life Insurance', 'NLG': 'Non-Life Insurance', 'PRIC': 'Non-Life Insurance',
    'SIC': 'Non-Life Insurance', 'IGI': 'Non-Life Insurance',
    'BNL': 'Manufacturing', 'HDL': 'Manufacturing', 'SHIVM': 'Manufacturing', 'SONA': 'Manufacturing', 'TRIS': 'Manufacturing',
    'OHL': 'Hotels', 'SOAL': 'Hotels', 'TRH': 'Hotels', 'ORI': 'Hotels',
    'CBBL': 'Microfinance', 'DDBL': 'Microfinance', 'NERUDE': 'Microfinance', 'NLBBL': 'Microfinance', 'SAK': 'Microfinance', 'SWBBL': 'Microfinance',
    'NTC': 'Others', 'STC': 'Others', 'BBC': 'Others', 'NMF': 'Mutual Fund', 'NIBLMF': 'Mutual Fund'
};

function getSector(symbol) {
    return SECTOR_MAP[symbol.toUpperCase()] || 'Other';
}

// --- Supabase Authentication ---

// Check for existing session on page load
async function checkSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        handleLogin(session.user);
    }
}

// Initialize auth when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    checkSession();
    setupAuthForms();
});

// Setup form handlers
function setupAuthForms() {
    // Login form
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        showAuthMessage('Logging in...', 'text-blue-400');
        
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        
        if (error) {
            showAuthMessage(error.message, 'text-red-400');
        } else {
            handleLogin(data.user);
        }
    });
    
    // Signup form
    document.getElementById('signupForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        
        showAuthMessage('Creating account...', 'text-blue-400');
        
        const { data, error } = await supabase.auth.signUp({ email, password });
        
        if (error) {
            showAuthMessage(error.message, 'text-red-400');
        } else {
            showAuthMessage('Account created! Please check your email to confirm before logging in.', 'text-green-400');
            document.getElementById('signupForm').classList.add('hidden');
            document.getElementById('loginForm').classList.remove('hidden');
            document.querySelector('.mt-4.flex').classList.remove('hidden');
        }
    });
    
    // Reset password form
    document.getElementById('resetForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('resetEmail').value;
        
        showAuthMessage('Sending reset link...', 'text-blue-400');
        
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/#recover',
        });
        
        if (error) {
            showAuthMessage(error.message, 'text-red-400');
        } else {
            showAuthMessage('Password reset link sent! Check your email.', 'text-green-400');
            document.getElementById('resetForm').classList.add('hidden');
            document.getElementById('loginForm').classList.remove('hidden');
            document.querySelector('.mt-4.flex').classList.remove('hidden');
        }
    });
    
    // Show signup form
    document.getElementById('showSignupBtn').addEventListener('click', () => {
        document.getElementById('loginForm').classList.add('hidden');
        document.querySelector('.mt-4.flex').classList.add('hidden');
        document.getElementById('signupForm').classList.remove('hidden');
        hideAuthMessage();
    });
    
    // Cancel signup
    document.getElementById('cancelSignupBtn').addEventListener('click', () => {
        document.getElementById('signupForm').classList.add('hidden');
        document.getElementById('loginForm').classList.remove('hidden');
        document.querySelector('.mt-4.flex').classList.remove('hidden');
        hideAuthMessage();
    });
    
    // Show reset form
    document.getElementById('forgotPasswordBtn').addEventListener('click', () => {
        document.getElementById('loginForm').classList.add('hidden');
        document.querySelector('.mt-4.flex').classList.add('hidden');
        document.getElementById('resetForm').classList.remove('hidden');
        hideAuthMessage();
    });
    
    // Cancel reset
    document.getElementById('cancelResetBtn').addEventListener('click', () => {
        document.getElementById('resetForm').classList.add('hidden');
        document.getElementById('loginForm').classList.remove('hidden');
        document.querySelector('.mt-4.flex').classList.remove('hidden');
        hideAuthMessage();
    });
    
    // Listen for auth state changes
    supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN') {
            handleLogin(session.user);
        } else if (event === 'SIGNED_OUT') {
            handleLogout();
        }
    });
}

function showAuthMessage(message, colorClass) {
    const msgEl = document.getElementById('authMessage');
    msgEl.textContent = message;
    msgEl.className = `mt-4 text-sm ${colorClass}`;
    msgEl.classList.remove('hidden');
}

function hideAuthMessage() {
    document.getElementById('authMessage').classList.add('hidden');
}

function handleLogin(loggedInUser) {
    user = loggedInUser;
    document.getElementById('authScreen').classList.add('hidden');
    document.getElementById('appScreen').classList.remove('hidden');
    document.getElementById('userEmail').textContent = user.email;
    loadPortfolioFromSupabase();
    initApp();
}

function handleLogout() {
    user = null;
    portfolio = [];
    document.getElementById('authScreen').classList.remove('hidden');
    document.getElementById('appScreen').classList.add('hidden');
}

// --- Core Logic ---
function initApp() {
    document.getElementById('logoutBtn').addEventListener('click', handleSupabaseLogout);
    document.getElementById('addStockForm').addEventListener('submit', handleAddStock);
    document.getElementById('refreshBtn').addEventListener('click', fetchMarketData);
    
    showView('dashboard');
    fetchMarketData();
}

async function handleSupabaseLogout() {
    await supabase.auth.signOut();
    handleLogout();
}

// --- Supabase Portfolio Functions ---
async function loadPortfolioFromSupabase() {
    if (!user) return;
    
    const { data, error } = await supabase
        .from('portfolio')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
    
    if (error) {
        console.error('Error loading portfolio:', error);
        return;
    }
    
    // Convert Supabase data to app format
    portfolio = data.map(item => ({
        symbol: item.symbol,
        quantity: item.quantity,
        buyPrice: item.buy_price
    }));
    
    renderPortfolio();
    renderDashboard();
}

async function savePortfolioToSupabase() {
    if (!user) return;
    
    // Delete all existing portfolio entries for this user
    await supabase.from('portfolio').delete().eq('user_id', user.id);
    
    // Insert updated portfolio
    const portfolioData = portfolio.map(stock => ({
        user_id: user.id,
        symbol: stock.symbol,
        quantity: stock.quantity,
        buy_price: stock.buyPrice
    }));
    
    const { error } = await supabase.from('portfolio').insert(portfolioData);
    
    if (error) {
        console.error('Error saving portfolio:', error);
    }
}

window.showView = function(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden-view'));
    document.getElementById(`view-${viewId}`).classList.remove('hidden-view');
    
    document.querySelectorAll('nav button').forEach(btn => btn.classList.remove('active-link'));
    document.getElementById(`nav-${viewId}`).classList.add('active-link');

    if (viewId === 'dashboard') renderDashboard();
}

function handleAddStock(e) {
    e.preventDefault();
    const symbol = document.getElementById('symbol').value.toUpperCase();
    const quantity = parseFloat(document.getElementById('quantity').value);
    const buyPrice = parseFloat(document.getElementById('buyPrice').value);

    const existingIndex = portfolio.findIndex(s => s.symbol === symbol);
    if (existingIndex > -1) {
        const existing = portfolio[existingIndex];
        const totalQty = existing.quantity + quantity;
        const avgBuyPrice = ((existing.quantity * existing.buyPrice) + (quantity * buyPrice)) / totalQty;
        portfolio[existingIndex].quantity = totalQty;
        portfolio[existingIndex].buyPrice = avgBuyPrice;
    } else {
        portfolio.push({ symbol, quantity, buyPrice });
    }
    savePortfolioToSupabase();
    renderPortfolio();
    e.target.reset();
}

window.deleteStock = function(symbol) {
    if (confirm(`Are you sure you want to remove ${symbol}?`)) {
        portfolio = portfolio.filter(s => s.symbol !== symbol);
        savePortfolioToSupabase();
        renderPortfolio();
    }
}

// Old localStorage function - no longer used but kept for reference
// function savePortfolio() { localStorage.setItem(LS_KEY, JSON.stringify(portfolio)); }

async function fetchMarketData() {
    document.getElementById('loading').classList.remove('hidden');
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        marketData = {};
        data.forEach(stock => { marketData[stock.symbol] = stock; });
        renderPortfolio();
        renderDashboard();
    } catch (error) {
        console.error("Failed to fetch market data:", error);
    } finally {
        document.getElementById('loading').classList.add('hidden');
    }
}

function renderPortfolio() {
    const tbody = document.getElementById('portfolioBody');
    tbody.innerHTML = '';

    portfolio.forEach(stock => {
        const liveStock = marketData[stock.symbol];
        const ltp = liveStock ? liveStock.ltp : null;
        const sector = getSector(stock.symbol);
        
        const investment = stock.quantity * stock.buyPrice;
        const currentValue = ltp !== null ? stock.quantity * ltp : 0;
        const pl = ltp !== null ? currentValue - investment : 0;
        const plPercent = investment > 0 ? (pl / investment) * 100 : 0;

        const row = document.createElement('tr');
        row.className = "hover:bg-gray-50";
        const plColor = pl > 0 ? "text-green-600" : pl < 0 ? "text-red-600" : "text-gray-800";

        row.innerHTML = `
            <td class="py-3 px-4 font-semibold text-gray-900">${stock.symbol}</td>
            <td class="py-3 px-4 text-sm text-gray-600">${sector}</td>
            <td class="py-3 px-4 text-right">${stock.quantity}</td>
            <td class="py-3 px-4 text-right">${stock.buyPrice.toFixed(2)}</td>
            <td class="py-3 px-4 text-right font-medium">${ltp !== null ? ltp.toFixed(2) : 'N/A'}</td>
            <td class="py-3 px-4 text-right">${ltp !== null ? formatCurrency(currentValue) : 'N/A'}</td>
            <td class="py-3 px-4 text-right ${plColor} font-semibold">
                ${ltp !== null ? `${formatCurrency(pl)} <br><span class="text-xs">(${plPercent.toFixed(2)}%)</span>` : 'N/A'}
            </td>
            <td class="py-3 px-4 text-center">
                <button onclick="deleteStock('${stock.symbol}')" class="text-red-500 hover:text-red-700"><i class="fas fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// --- Dashboard Analytics ---
function renderDashboard() {
    let totalInvestment = 0;
    let totalCurrentValue = 0;
    const sectorValues = {};
    const holdingLabels = [];
    const holdingValues = [];

    portfolio.forEach(stock => {
        const liveStock = marketData[stock.symbol];
        const ltp = liveStock ? liveStock.ltp : stock.buyPrice; 
        const currentValue = stock.quantity * ltp;
        const investment = stock.quantity * stock.buyPrice;
        
        totalInvestment += investment;
        totalCurrentValue += currentValue;

        const sector = getSector(stock.symbol);
        sectorValues[sector] = (sectorValues[sector] || 0) + currentValue;

        holdingLabels.push(stock.symbol);
        holdingValues.push(currentValue);
    });

    const totalPL = totalCurrentValue - totalInvestment;
    const plColor = totalPL >= 0 ? 'text-green-600' : 'text-red-600';

    document.getElementById('dash-investment').textContent = formatCurrency(totalInvestment);
    document.getElementById('dash-value').textContent = formatCurrency(totalCurrentValue);
    document.getElementById('dash-pl').innerHTML = `<span class="${plColor}">${formatCurrency(totalPL)}</span>`;

    renderSectorChart(sectorValues);
    renderHoldingChart(holdingLabels, holdingValues);
}

function renderSectorChart(data) {
    const ctx = document.getElementById('sectorChart').getContext('2d');
    if (sectorChart) sectorChart.destroy();

    sectorChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(data),
            datasets: [{
                data: Object.values(data),
                backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'],
                borderWidth: 1
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }
    });
}

function renderHoldingChart(labels, values) {
    const ctx = document.getElementById('holdingChart').getContext('2d');
    if (holdingChart) holdingChart.destroy();

    holdingChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{ label: 'Current Value (NPR)', data: values, backgroundColor: '#3b82f6' }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
    });
}

function formatCurrency(value) {
    return "NPR " + value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
