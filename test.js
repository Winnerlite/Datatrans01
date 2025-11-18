<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vyra API Tester</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }

        .container {
            max-width: 1400px;
            margin: 0 auto;
        }

        .header {
            background: white;
            border-radius: 20px;
            padding: 30px;
            margin-bottom: 20px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            text-align: center;
        }

        .header h1 {
            color: #667eea;
            margin-bottom: 10px;
        }

        .grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
        }

        .card {
            background: white;
            border-radius: 15px;
            padding: 25px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }

        .card h2 {
            color: #667eea;
            margin-bottom: 20px;
            font-size: 1.5em;
        }

        .endpoint-group {
            margin-bottom: 25px;
        }

        .endpoint-group h3 {
            color: #495057;
            font-size: 1.1em;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #e9ecef;
        }

        .test-button {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 12px 20px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 0.95em;
            width: 100%;
            margin: 5px 0;
            transition: all 0.3s;
            text-align: left;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .test-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .test-button:active {
            transform: translateY(0);
        }

        .input-group {
            margin: 15px 0;
        }

        .input-group label {
            display: block;
            color: #495057;
            margin-bottom: 5px;
            font-size: 0.9em;
        }

        .input-group input, .input-group select {
            width: 100%;
            padding: 10px;
            border: 2px solid #e9ecef;
            border-radius: 6px;
            font-size: 1em;
        }

        .input-group input:focus, .input-group select:focus {
            outline: none;
            border-color: #667eea;
        }

        .response-container {
            background: #1a202c;
            border-radius: 10px;
            padding: 20px;
            min-height: 400px;
            max-height: 600px;
            overflow-y: auto;
            position: relative;
        }

        .response-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #2d3748;
        }

        .status-badge {
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 0.85em;
            font-weight: bold;
        }

        .status-success {
            background: #48bb78;
            color: white;
        }

        .status-error {
            background: #f56565;
            color: white;
        }

        .status-loading {
            background: #ed8936;
            color: white;
        }

        .copy-btn {
            background: #4299e1;
            color: white;
            border: none;
            padding: 6px 15px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.85em;
        }

        .copy-btn:hover {
            background: #3182ce;
        }

        pre {
            color: #68d391;
            font-family: 'Courier New', monospace;
            white-space: pre-wrap;
            word-wrap: break-word;
            margin: 0;
            font-size: 0.9em;
            line-height: 1.6;
        }

        .loading {
            color: #ed8936;
            text-align: center;
            padding: 20px;
            font-size: 1.1em;
        }

        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin-top: 15px;
        }

        .stat-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px;
            border-radius: 10px;
            text-align: center;
        }

        .stat-number {
            font-size: 2em;
            font-weight: bold;
            margin-bottom: 5px;
        }

        .stat-label {
            font-size: 0.85em;
            opacity: 0.9;
        }

        .endpoint-url {
            background: #f8f9fa;
            padding: 8px 12px;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
            font-size: 0.85em;
            color: #495057;
            margin-top: 5px;
            word-break: break-all;
        }

        @media (max-width: 968px) {
            .grid {
                grid-template-columns: 1fr;
            }
        }

        .json-key { color: #e06c75; }
        .json-string { color: #98c379; }
        .json-number { color: #d19a66; }
        .json-boolean { color: #c678dd; }
        .json-null { color: #61afef; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚌 Vyra Transport API Tester</h1>
            <p>Test all API endpoints in real-time</p>
            <a href="/api" style="color: #667eea; text-decoration: none; margin-top: 10px; display: inline-block;">📖 View Full Documentation</a>
        </div>

        <div class="grid">
            <!-- Left Panel - Endpoints -->
            <div class="card">
                <h2>🔌 Test Endpoints</h2>

                <!-- Transport Endpoint -->
                <div class="endpoint-group">
                    <h3>📦 Transport Data</h3>
                    <button class="test-button" onclick="testEndpoint('/api/transport')">
                        <span>Get All Data</span>
                        <span>→</span>
                    </button>
                    
                    <div class="input-group">
                        <label>Filter by State:</label>
                        <select id="stateFilter">
                            <option value="">Select State...</option>
                        </select>
                    </div>
                    <button class="test-button" onclick="testTransportByState()">
                        <span>Get by State</span>
                        <span>→</span>
                    </button>

                    <div class="input-group">
                        <label>Filter by Company:</label>
                        <input type="text" id="companyFilter" placeholder="e.g., ABC Transport">
                    </div>
                    <button class="test-button" onclick="testTransportByCompany()">
                        <span>Get by Company</span>
                        <span>→</span>
                    </button>
                </div>

                <!-- States Endpoint -->
                <div class="endpoint-group">
                    <h3>🗺️ States</h3>
                    <button class="test-button" onclick="testEndpoint('/api/states')">
                        <span>Get All States</span>
                        <span>→</span>
                    </button>
                    
                    <div class="input-group">
                        <label>Specific State:</label>
                        <select id="specificState">
                            <option value="">Select State...</option>
                        </select>
                    </div>
                    <button class="test-button" onclick="testSpecificState()">
                        <span>Get State Data</span>
                        <span>→</span>
                    </button>
                </div>

                <!-- Companies Endpoint -->
                <div class="endpoint-group">
                    <h3>🚐 Companies</h3>
                    <button class="test-button" onclick="testEndpoint('/api/companies')">
                        <span>Get All Companies</span>
                        <span>→</span>
                    </button>
                    
                    <div class="input-group">
                        <label>Specific Company:</label>
                        <input type="text" id="specificCompany" placeholder="e.g., GUO Transport">
                    </div>
                    <button class="test-button" onclick="testSpecificCompany()">
                        <span>Get Company Data</span>
                        <span>→</span>
                    </button>
                </div>

                <!-- Routes Endpoint -->
                <div class="endpoint-group">
                    <h3>🛣️ Routes & Prices</h3>
                    <button class="test-button" onclick="testEndpoint('/api/routes')">
                        <span>Get All Routes</span>
                        <span>→</span>
                    </button>
                    
                    <div class="input-group">
                        <label>From:</label>
                        <select id="routeFrom">
                            <option value="">Select Origin...</option>
                        </select>
                    </div>
                    <div class="input-group">
                        <label>To:</label>
                        <select id="routeTo">
                            <option value="">Select Destination...</option>
                        </select>
                    </div>
                    <button class="test-button" onclick="testRoute()">
                        <span>Get Route Price</span>
                        <span>→</span>
                    </button>
                </div>

                <!-- Search Endpoint -->
                <div class="endpoint-group">
                    <h3>🔍 Search</h3>
                    <div class="input-group">
                        <label>Search Query:</label>
                        <input type="text" id="searchQuery" placeholder="e.g., Lagos, ABC, etc.">
                    </div>
                    <button class="test-button" onclick="testSearch()">
                        <span>Search</span>
                        <span>→</span>
                    </button>

                    <div class="input-group">
                        <label>Search by Attribute:</label>
                        
                        <select id="attributeFilter">
                            <option value="">Select Attribute...</option>
                            <option value="Comfort">Comfort</option>
                            <option value="Safety">Safety</option>
                            <option value="Quick">Quick</option>
                            <option value="Low Pricing">Low Pricing</option>
                            <option value="Reliability">Reliability</option>
                            <option value="Customer Service">Customer Service</option>
                        </select>
                    </div>
                    <button class="test-button" onclick="testSearchByAttribute()">
                        <span>Search by Attribute</span>
                        <span>→</span>
                    </button>
                </div>
            </div>

            <!-- Right Panel - Response -->
            <div class="card">
                <h2>📊 API Response</h2>
                <div class="response-container">
                    <div class="response-header">
                        <span id="statusBadge" class="status-badge status-loading">Ready</span>
                        <button class="copy-btn" onclick="copyResponse()">Copy JSON</button>
                    </div>
                    <div id="currentEndpoint" class="endpoint-url">No endpoint called yet</div>
                    <pre id="responseOutput">Click any button to test an endpoint...</pre>
                </div>
                
                    <!-- Stats -->
                <div class="stats" id="statsContainer" style="display: none;">
                    <div class="stat-card">
                        <div class="stat-number" id="statCompanies">0</div>
                        <div class="stat-label">Companies</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number" id="statStates">0</div>
                        <div class="stat-label">States</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number" id="statRoutes">0</div>
                        <div class="stat-label">Routes</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number" id="responseTime">0ms</div>
                        <div class="stat-label">Response Time</div>
                    </div>
                </div>
            </div>
        </div>
    </div>

   <script>
    // Base URL - Change this to your deployed URL
    const BASE_URL = 'https://vyrametrics.vercel.app';
    
    let lastResponse = null;
    let allData = null;

    // Load initial data to populate dropdowns
    async function loadInitialData() {
        try {
            console.log('Fetching from:', `${BASE_URL}/api/transport`);
            const response = await fetch(`${BASE_URL}/api/transport`);
            
            // Check if response is ok
            if (!response.ok) {
                console.error('Response not ok:', response.status, response.statusText);
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            // Check content type
            const contentType = response.headers.get('content-type');
            console.log('Content-Type:', contentType);
            
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.error('Response is not JSON:', text.substring(0, 200));
                throw new Error('API returned HTML instead of JSON. Check if /api/transport endpoint exists.');
            }
            
            allData = await response.json();
            console.log('Data loaded successfully:', allData);
            
            // Populate state dropdowns
            const states = Object.keys(allData.states || {});
            populateSelect('stateFilter', states);
            populateSelect('specificState', states);
            populateSelect('routeFrom', states);
            populateSelect('routeTo', states);
            
        } catch (error) {
            console.error('Failed to load initial data:', error);
            // Show error on page
            const output = document.getElementById('responseOutput');
            const statusBadge = document.getElementById('statusBadge');
            
            statusBadge.className = 'status-badge status-error';
            statusBadge.textContent = 'Init Error';
            output.innerHTML = `<span style="color: #f56565;">
                <strong>Failed to load initial data:</strong><br><br>
                ${error.message}<br><br>
                <strong>Troubleshooting:</strong><br>
                1. Check if /api/transport exists<br>
                2. Open <a href="${BASE_URL}/api/transport" target="_blank" style="color: #4299e1;">${BASE_URL}/api/transport</a> to see the response<br>
                3. Check browser console for details
            </span>`;
        }
    }

    function populateSelect(selectId, options) {
        const select = document.getElementById(selectId);
        options.forEach(option => {
            const opt = document.createElement('option');
            opt.value = option;
            opt.textContent = option;
            select.appendChild(opt);
        });
    }

    // Test endpoint function
    async function testEndpoint(endpoint) {
        const output = document.getElementById('responseOutput');
        const statusBadge = document.getElementById('statusBadge');
        const currentEndpoint = document.getElementById('currentEndpoint');
        const statsContainer = document.getElementById('statsContainer');
        
        // Show loading
        statusBadge.className = 'status-badge status-loading';
        statusBadge.textContent = 'Loading...';
        output.innerHTML = '<div class="loading">⏳ Fetching data...</div>';
        currentEndpoint.textContent = `${BASE_URL}${endpoint}`;
        
        const startTime = performance.now();
        
        try {
            const response = await fetch(`${BASE_URL}${endpoint}`);
            const endTime = performance.now();
            const responseTime = Math.round(endTime - startTime);
            
            // Check content type before parsing
            const contentType = response.headers.get('content-type');
            
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                throw new Error(`Expected JSON but got ${contentType}. Response: ${text.substring(0, 200)}`);
            }
            
            const data = await response.json();
            lastResponse = data;
            
            // Update status
            if (response.ok) {
                statusBadge.className = 'status-badge status-success';
                statusBadge.textContent = `${response.status} OK`;
            } else {
                statusBadge.className = 'status-badge status-error';
                statusBadge.textContent = `${response.status} Error`;
            }
            
            // Display formatted JSON
            output.innerHTML = syntaxHighlight(JSON.stringify(data, null, 2));
            
            // Update stats if full data
            if (data.transportCompanies || data.states || data.routePrices) {
                updateStats(data, responseTime);
                statsContainer.style.display = 'grid';
            } else {
                statsContainer.style.display = 'none';
            }
            
        } catch (error) {
            statusBadge.className = 'status-badge status-error';
            statusBadge.textContent = 'Error';
            output.innerHTML = `<span style="color: #f56565;">
                <strong>Error:</strong> ${error.message}<br><br>
                Check console for details.
            </span>`;
            console.error('Fetch error:', error);
            statsContainer.style.display = 'none';
        }
    }

    // Transport by state
    function testTransportByState() {
        const state = document.getElementById('stateFilter').value;
        if (!state) {
            alert('Please select a state');
            return;
        }
        testEndpoint(`/api/transport?state=${encodeURIComponent(state)}`);
    }

    // Transport by company
    function testTransportByCompany() {
        const company = document.getElementById('companyFilter').value.trim();
        if (!company) {
            alert('Please enter a company name');
            return;
        }
        testEndpoint(`/api/transport?company=${encodeURIComponent(company)}`);
    }

    // Specific state
    function testSpecificState() {
        const state = document.getElementById('specificState').value;
        if (!state) {
            alert('Please select a state');
            return;
        }
        testEndpoint(`/api/states?state=${encodeURIComponent(state)}`);
    }

    // Specific company
    function testSpecificCompany() {
        const company = document.getElementById('specificCompany').value.trim();
        if (!company) {
            alert('Please enter a company name');
            return;
        }
        testEndpoint(`/api/companies?company=${encodeURIComponent(company)}`);
    }

    // Route test
    function testRoute() {
        const from = document.getElementById('routeFrom').value;
        const to = document.getElementById('routeTo').value;
        if (!from || !to) {
            alert('Please select both origin and destination');
            return;
        }
        testEndpoint(`/api/routes?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
    }

    // Search test
    function testSearch() {
        const query = document.getElementById('searchQuery').value.trim();
        if (!query) {
            alert('Please enter a search term');
            return;
        }
        testEndpoint(`/api/search?q=${encodeURIComponent(query)}`);
    }

    // Search by attribute
    function testSearchByAttribute() {
        const attribute = document.getElementById('attributeFilter').value;
        if (!attribute) {
            alert('Please select an attribute');
            return;
        }
        testEndpoint(`/api/search?attribute=${encodeURIComponent(attribute)}`);
    }

    // Update stats
    function updateStats(data, responseTime) {
        const companies = Object.keys(data.transportCompanies || {}).length;
        const states = Object.keys(data.states || {}).length;
        const routes = Object.keys(data.routePrices || {}).length;
        
        document.getElementById('statCompanies').textContent = companies;
        document.getElementById('statStates').textContent = states;
        document.getElementById('statRoutes').textContent = routes;
        document.getElementById('responseTime').textContent = `${responseTime}ms`;
    }

    // Syntax highlighting for JSON
    function syntaxHighlight(json) {
        json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
            let cls = 'json-number';
            if (/^"/.test(match)) {
                if (/:$/.test(match)) {
                    cls = 'json-key';
                } else {
                    cls = 'json-string';
                }
            } else if (/true|false/.test(match)) {
                cls = 'json-boolean';
            } else if (/null/.test(match)) {
                cls = 'json-null';
            }
            return '<span class="' + cls + '">' + match + '</span>';
        });
    }

    // Copy response to clipboard
    function copyResponse() {
        if (!lastResponse) {
            alert('No response to copy');
            return;
        }
        
        const text = JSON.stringify(lastResponse, null, 2);
        navigator.clipboard.writeText(text).then(() => {
            const btn = document.querySelector('.copy-btn');
            const originalText = btn.textContent;
            btn.textContent = '✓ Copied!';
            setTimeout(() => {
                btn.textContent = originalText;
            }, 2000);
        }).catch(err => {
            alert('Failed to copy: ' + err);
        });
    }

    // Initialize on load
    window.addEventListener('DOMContentLoaded', () => {
        loadInitialData();
    });
</script>
</body>
</html>
