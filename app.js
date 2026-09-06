// Pointing to the Netlify serverless function to bypass CORS
const API_URL = "/.netlify/functions/get-market";
const LS_KEY = "nepse_portfolio";

let portfolio = JSON.parse(localStorage.getItem(LS_KEY)) || [];
let marketData = {};

// DOM Elements
const addStockForm = document.getElementById('addStockForm');
const portfolioBody = document.getElementById('portfolioBody');
const totalInvestmentEl = document.getElementById('totalInvestment');
const currentValueEl = document.getElementById('currentValue');
const totalPLEl = document.getElementById('totalPL');
const loadingEl = document.getElementById('loading');
const refreshBtn = document.getElementById('refreshBtn');

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    addStockForm.addEventListener('submit', handleAddStock);
    refreshBtn.addEventListener('click', fetchMarketData);
    renderPortfolio();
    fetchMarketData();
});

function handleAddStock(e) {
    e.preventDefault();
    const symbol = document.getElementById('symbol').value.toUpperCase();
    const quantity = parseFloat(document.getElementById('quantity').value);
    const buyPrice = parseFloat(document.getElementById('buyPrice').value);

    if (!symbol || !quantity || !buyPrice) return;

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

    savePortfolio();
    renderPortfolio();
    addStockForm.reset();
}

function deleteStock(symbol) {
    portfolio = portfolio.filter(s => s.symbol !== symbol);
    savePortfolio();
    renderPortfolio();
}

function savePortfolio() {
    localStorage.setItem(LS_KEY, JSON.stringify(portfolio));
}

async function fetchMarketData() {
    loadingEl.classList.remove('hidden');
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        
        // Map data by symbol for quick lookup
        marketData = {};
        data.forEach(stock => {
            marketData[stock.symbol] = stock;
        });
        
        renderPortfolio();
    } catch (error) {
        console.error("Failed to fetch market data:", error);
        alert("Failed to fetch live market data. Please check the Netlify function logs.");
    } finally {
        loadingEl.classList.add('hidden');
    }
}

function renderPortfolio() {
    portfolioBody.innerHTML = '';
    let totalInvestment = 0;
    let totalCurrentValue = 0;

    portfolio.forEach(stock => {
        const liveStock = marketData[stock.symbol];
        const ltp = liveStock ? liveStock.ltp : null;
        
        const investment = stock.quantity * stock.buyPrice;
        totalInvestment += investment;

        let currentValue = 0;
        let pl = 0;
        let plPercent = 0;
        let ltpDisplay = "N/A";
        let cvDisplay = "N/A";
        let plDisplay = "N/A";

        if (ltp !== null) {
            currentValue = stock.quantity * ltp;
            pl = currentValue - investment;
            plPercent = (pl / investment) * 100;
            
            ltpDisplay = ltp.toFixed(2);
            cvDisplay = formatCurrency(currentValue);
            plDisplay = `${formatCurrency(pl)} (${plPercent.toFixed(2)}%)`;
        }

        totalCurrentValue += ltp !== null ? currentValue : 0;

        const row = document.createElement('tr');
        row.className = "border-b hover:bg-gray-50";
        
        const plColor = pl > 0 ? "text-green-600" : pl < 0 ? "text-red-600" : "text-gray-800";

        row.innerHTML = `
            <td class="py-3 px-4 font-bold">${stock.symbol}</td>
            <td class="py-3 px-4 text-right">${stock.quantity}</td>
            <td class="py-3 px-4 text-right">${stock.buyPrice.toFixed(2)}</td>
            <td class="py-3 px-4 text-right">${ltpDisplay}</td>
            <td class="py-3 px-4 text-right">${cvDisplay}</td>
            <td class="py-3 px-4 text-right font-semibold ${plColor}">${plDisplay}</td>
            <td class="py-3 px-4 text-center">
                <button class="bg-red-500 hover:bg-red-700 text-white py-1 px-3 rounded text-sm" onclick="deleteStock('${stock.symbol}')">Delete</button>
            </td>
        `;
        portfolioBody.appendChild(row);
    });

    totalInvestmentEl.textContent = formatCurrency(totalInvestment);
    currentValueEl.textContent = formatCurrency(totalCurrentValue);
    
    const totalPL = totalCurrentValue - totalInvestment;
    const totalPLPercent = totalInvestment > 0 ? (totalPL / totalInvestment) * 100 : 0;
    const totalPLColor = totalPL > 0 ? "text-green-600" : totalPL < 0 ? "text-red-600" : "text-gray-800";
    
    totalPLEl.innerHTML = `<span class="${totalPLColor}">${formatCurrency(totalPL)} (${totalPLPercent.toFixed(2)}%)</span>`;
}

function formatCurrency(value) {
    return "NPR " + value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Expose deleteStock to global scope for the inline onclick handler
window.deleteStock = deleteStock;
