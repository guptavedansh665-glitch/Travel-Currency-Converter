const API_URL = 'https://open.er-api.com/v6/latest/';

// DOM Elements
const baseCurrencySelect = document.getElementById('base-currency');
const targetCurrencySelect = document.getElementById('target-currency');
const baseAmountInput = document.getElementById('base-amount');
const targetAmountInput = document.getElementById('target-amount');
const swapBtn = document.getElementById('swap-btn');
const rateText = document.getElementById('rate-text');
const lastUpdated = document.getElementById('last-updated');
const rateLoading = document.getElementById('rate-loading');
const errorMessage = document.getElementById('error-message');

// State
let rates = {};
let currentBase = 'USD';
let currentTarget = 'EUR';

// Priority currencies for travel
const priorityCurrencies = [
    'USD', 'EUR', 'GBP', 'JPY', 'INR', 'AUD', 'CAD', 'CHF', 'CNY', 'SGD'
];

async function fetchRates(base = 'USD') {
    try {
        showLoading(true);
        hideError();
        
        const response = await fetch(`${API_URL}${base}`);
        if (!response.ok) throw new Error('Network response was not ok');
        
        const data = await response.json();
        if (data.result !== 'success') throw new Error('API Error');

        rates = data.rates;
        
        // Update timestamp
        const date = new Date(data.time_last_update_unix * 1000);
        lastUpdated.textContent = `Last updated: ${date.toLocaleString()}`;
        
        populateSelects();
        calculateConversion();
        updateRateDisplay();
        showLoading(false);
        
    } catch (error) {
        console.error('Error fetching rates:', error);
        showError();
        showLoading(false);
    }
}

function populateSelects() {
    // Only populate if empty to avoid losing selection
    if (baseCurrencySelect.options.length > 0) return;

    const availableCurrencies = Object.keys(rates);
    
    // Sort so priority currencies are at the top
    const sortedCurrencies = [
        ...priorityCurrencies.filter(c => availableCurrencies.includes(c)),
        ...availableCurrencies.filter(c => !priorityCurrencies.includes(c)).sort()
    ];

    sortedCurrencies.forEach(currency => {
        const option1 = new Option(currency, currency);
        const option2 = new Option(currency, currency);
        
        baseCurrencySelect.add(option1);
        targetCurrencySelect.add(option2);
    });

    baseCurrencySelect.value = currentBase;
    targetCurrencySelect.value = currentTarget;
}

function calculateConversion() {
    if (!rates || Object.keys(rates).length === 0) return;

    const amount = parseFloat(baseAmountInput.value) || 0;
    const base = baseCurrencySelect.value;
    const target = targetCurrencySelect.value;
    
    let rate = rates[target];
    
    if (rate !== undefined) {
        const converted = (amount * rate).toFixed(2);
        targetAmountInput.value = converted;
    }
}

function updateRateDisplay() {
    const target = targetCurrencySelect.value;
    const rate = rates[target];
    
    if (rate !== undefined) {
        // Format rate to 4 decimal places if it's small, otherwise 2
        const formattedRate = rate < 0.01 ? rate.toFixed(4) : rate.toFixed(2);
        rateText.textContent = `1 ${currentBase} = ${formattedRate} ${target}`;
    }
}

function showLoading(isLoading) {
    if (isLoading) {
        rateLoading.style.display = 'block';
        rateText.style.display = 'none';
        lastUpdated.style.display = 'none';
    } else {
        rateLoading.style.display = 'none';
        rateText.style.display = 'block';
        lastUpdated.style.display = 'block';
    }
}

function showError() {
    errorMessage.style.display = 'flex';
    rateLoading.style.display = 'none';
    rateText.style.display = 'none';
    lastUpdated.style.display = 'none';
}

function hideError() {
    errorMessage.style.display = 'none';
}

// Event Listeners
baseAmountInput.addEventListener('input', calculateConversion);

baseCurrencySelect.addEventListener('change', (e) => {
    currentBase = e.target.value;
    // Re-fetch rates for new base currency
    fetchRates(currentBase);
});

targetCurrencySelect.addEventListener('change', (e) => {
    currentTarget = e.target.value;
    calculateConversion();
    updateRateDisplay();
});

swapBtn.addEventListener('click', () => {
    const temp = currentBase;
    currentBase = currentTarget;
    currentTarget = temp;
    
    baseCurrencySelect.value = currentBase;
    targetCurrencySelect.value = currentTarget;
    
    // Add a small rotation animation class to the icon
    const icon = swapBtn.querySelector('i');
    icon.style.transition = 'transform 0.3s ease';
    icon.style.transform = `rotate(${icon.style.transform === 'rotate(180deg)' ? '0deg' : '180deg'})`;
    
    fetchRates(currentBase);
});

// Initialize
fetchRates(currentBase);
