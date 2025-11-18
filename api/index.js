export default async function handler(req, res) {
  res.setHeader('Content-Type', 'text/html');
  
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vyra Transport API Documentation</title>
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
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
        }
        
        .header p {
            font-size: 1.2em;
            opacity: 0.9;
        }
        
        .content {
            padding: 40px;
        }
        
        .section {
            margin-bottom: 40px;
        }
        
        .section h2 {
            color: #667eea;
            font-size: 1.8em;
            margin-bottom: 20px;
            border-bottom: 3px solid #667eea;
            padding-bottom: 10px;
        }
        
        .endpoint {
            background: #f8f9fa;
            border-left: 4px solid #667eea;
            padding: 20px;
            margin-bottom: 20px;
            border-radius: 8px;
        }
        
        .endpoint h3 {
            color: #333;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .method {
            background: #28a745;
            color: white;
            padding: 4px 12px;
            border-radius: 4px;
            font-size: 0.8em;
            font-weight: bold;
        }
        
        .url {
            background: #e9ecef;
            padding: 10px;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
            margin: 10px 0;
            overflow-x: auto;
        }
        
        .params {
            margin-top: 15px;
        }
        
        .params h4 {
            color: #495057;
            margin-bottom: 10px;
        }
        
        .param {
            background: white;
            padding: 10px;
            margin: 5px 0;
            border-radius: 4px;
            border: 1px solid #dee2e6;
        }
        
        .param-name {
            color: #667eea;
            font-weight: bold;
            font-family: 'Courier New', monospace;
        }
        
        .example {
            background: #2d3748;
            color: #68d391;
            padding: 15px;
            border-radius: 8px;
            margin: 15px 0;
            overflow-x: auto;
        }
        
        .example pre {
            margin: 0;
            font-family: 'Courier New', monospace;
        }
        
        .response-example {
            background: #1a202c;
            color: #68d391;
            padding: 15px;
            border-radius: 8px;
            margin: 15px 0;
            overflow-x: auto;
            max-height: 400px;
        }
        
        .response-example pre {
            margin: 0;
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
        }
        
        .note {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 15px 0;
            border-radius: 4px;
        }
        
        .pricing {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 12px;
            margin: 20px 0;
        }
        
        .pricing h3 {
            font-size: 1.5em;
            margin-bottom: 15px;
        }
        
        .price-tier {
            background: rgba(255,255,255,0.1);
            padding: 15px;
            margin: 10px 0;
            border-radius: 8px;
            backdrop-filter: blur(10px);
        }
        
        .test-button {
            background: #667eea;
            color: white;
            padding: 12px 30px;
            border: none;
            border-radius: 8px;
            font-size: 1em;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            margin-top: 20px;
            transition: all 0.3s;
        }
        
        .test-button:hover {
            background: #764ba2;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }
        
        @media (max-width: 768px) {
            .header h1 {
                font-size: 1.8em;
            }
            
            .content {
                padding: 20px;
            }
            
            .section h2 {
                font-size: 1.4em;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚌 Vyra Transport API</h1>
            <p>Complete Nigerian Intercity Transport Data API</p>
            <p style="margin-top: 10px; font-size: 0.9em;">Version 1.0 | Last Updated: January 2024</p>
        </div>
        
        <div class="content">
            <!-- Introduction -->
            <div class="section">
                <h2>📖 Introduction</h2>
                <p>Welcome to the Vyra Transport API! Access comprehensive data on Nigerian transport companies, routes, pricing, and more.</p>
                
                <div class="note">
                    <strong>🔑 Base URL:</strong> <code>https://vyrametrics.vercel.app/api</code>
                </div>
                
                <a href="/test.html" class="test-button">🧪 Test API Interactive Dashboard</a>
            </div>

            <!-- Quick Start -->
            <div class="section">
                <h2>🚀 Quick Start</h2>
                <div class="example">
                    <pre>// Using fetch in JavaScript
fetch('https://vyrametrics.vercel.app/api/transport')
  .then(response => response.json())
  .then(data => console.log(data));</pre>
                </div>
                
                <div class="example">
                    <pre>// Using curl
curl https://vyrametrics.vercel.app/api/transport</pre>
                </div>
            </div>

            <!-- Endpoints -->
            <div class="section">
                <h2>🔌 API Endpoints</h2>
                
                <!-- Transport Endpoint -->
                <div class="endpoint">
                    <h3><span class="method">GET</span> /api/transport</h3>
                    <p>Get all transport data including companies, states, routes, and prices.</p>
                    
                    <div class="url">https://vyrametrics.vercel.app/api/transport</div>
                    
                    <div class="params">
                        <h4>Query Parameters (Optional):</h4>
                        <div class="param">
                            <span class="param-name">state</span> - Filter by specific state (e.g., <code>?state=Lagos</code>)
                        </div>
                        <div class="param">
                            <span class="param-name">company</span> - Filter by specific company (e.g., <code>?company=ABC Transport</code>)
                        </div>
                    </div>
                    
                    <h4>Examples:</h4>
                    <div class="example">
                        <pre>GET /api/transport
GET /api/transport?state=Lagos
GET /api/transport?company=ABC Transport</pre>
                    </div>
                    
                    <h4>Response Sample:</h4>
                    <div class="response-example">
                        <pre>{
  "api": "Vyra Transport API v1.0",
  "transportCompanies": {
    "ABC Transport": {
      "id": "abc-transport",
      "name": "ABC Transport",
      "states": ["Lagos", "Abuja", "Port Harcourt"],
      "basePrice": 22000,
      "serviceAttributes": ["Comfort", "Safety"]
    }
  },
  "states": { ... },
  "routePrices": { ... }
}</pre>
                    </div>
                </div>

                <!-- States Endpoint -->
                <div class="endpoint">
                    <h3><span class="method">GET</span> /api/states</h3>
                    <p>Get all Nigerian states with their transport data.</p>
                    
                    <div class="url">https://vyrametrics.vercel.app/api/states</div>
                    
                    <div class="params">
                        <h4>Query Parameters (Optional):</h4>
                        <div class="param">
                            <span class="param-name">state</span> - Get specific state data (e.g., <code>?state=Lagos</code>)
                        </div>
                    </div>
                    
                    <h4>Examples:</h4>
                    <div class="example">
                        <pre>GET /api/states
GET /api/states?state=Lagos
GET /api/states?state=Abuja</pre>
                    </div>
                    
                    <h4>Response Sample:</h4>
                    <div class="response-example">
                        <pre>{
  "Lagos": {
    "companies": ["ABC Transport", "God is Good Motors"],
    "region": "Southwest",
    "majorTerminals": ["Jibowu", "Festac", "Maza-Maza"]
  }
}</pre>
                    </div>
                </div>

                <!-- Companies Endpoint -->
                <div class="endpoint">
                    <h3><span class="method">GET</span> /api/companies</h3>
                    <p>Get all transport companies with detailed information.</p>
                    
                    <div class="url">https://vyrametrics.vercel.app/api/companies</div>
                    
                    <div class="params">
                        <h4>Query Parameters (Optional):</h4>
                        <div class="param">
                            <span class="param-name">company</span> or <span class="param-name">name</span> - Get specific company (e.g., <code>?company=ABC Transport</code>)
                        </div>
                    </div>
                    
                    <h4>Examples:</h4>
                    <div class="example">
                        <pre>GET /api/companies
GET /api/companies?company=ABC Transport
GET /api/companies?name=GUO Transport</pre>
                    </div>
                    
                    <h4>Response Sample:</h4>
                    <div class="response-example">
                        <pre>{
  "ABC Transport": {
    "id": "abc-transport",
    "name": "ABC Transport",
    "image": "https://i.ibb.co/5hXDcq5/images-7.png",
    "states": ["Lagos", "Abuja"],
    "terminals": {
      "Lagos": "Jibowu Terminal, Yaba",
      "Abuja": "Garki Terminal"
    },
    "basePrice": 22000,
    "serviceAttributes": ["Comfort", "Safety", "Quick"]
  }
}</pre>
                    </div>
                </div>

                <!-- Routes Endpoint -->
                <div class="endpoint">
                    <h3><span class="method">GET</span> /api/routes</h3>
                    <p>Get route prices between cities.</p>
                    
                    <div class="url">https://vyrametrics.vercel.app/api/routes</div>
                    
                    <div class="params">
                        <h4>Query Parameters (Optional):</h4>
                        <div class="param">
                            <span class="param-name">route</span> - Get specific route (e.g., <code>?route=Lagos-Abuja</code>)
                        </div>
                        <div class="param">
                            <span class="param-name">from</span> & <span class="param-name">to</span> - Get route by origin and destination (e.g., <code>?from=Lagos&to=Abuja</code>)
                        </div>
                    </div>
                    
                    <h4>Examples:</h4>
                    <div class="example">
                        <pre>GET /api/routes
GET /api/routes?route=Lagos-Abuja
GET /api/routes?from=Lagos&to=Port Harcourt</pre>
                    </div>
                    
                    <h4>Response Sample:</h4>
                    <div class="response-example">
                        <pre>{
  "route": "Lagos-Abuja",
  "from": "Lagos",
  "to": "Abuja",
  "prices": {
    "ABC Transport": 22500,
    "God is Good Motors": 23500,
    "Peace Mass Transit": 18500
  }
}</pre>
                    </div>
                </div>

                <!-- Search Endpoint -->
                <div class="endpoint">
                    <h3><span class="method">GET</span> /api/search</h3>
                    <p>Search across companies, states, and routes.</p>
                    
                    <div class="url">https://vyrametrics.vercel.app/api/search</div>
                    
                    <div class="params">
                        <h4>Query Parameters (Required):</h4>
                        <div class="param">
                            <span class="param-name">q</span> or <span class="param-name">query</span> - Search term (e.g., <code>?q=Lagos</code>)
                        </div>
                        <div class="param">
                            <span class="param-name">attribute</span> - Search by service attribute (e.g., <code>?attribute=Comfort</code>)
                        </div>
                    </div>
                    
                    <h4>Examples:</h4>
                    <div class="example">
                        <pre>GET /api/search?q=Lagos
GET /api/search?query=ABC
GET /api/search?attribute=Comfort</pre>
                    </div>
                    
                    <h4>Response Sample:</h4>
                    <div class="response-example">
                        <pre>{
  "query": "Lagos",
  "results": {
    "companies": [...],
    "states": [...],
    "routes": [...]
  },
  "totalFound": 15
}</pre>
                    </div>
                </div>
            </div>

            <!-- Response Codes -->
            <div class="section">
                <h2>📊 Response Codes</h2>
                <div class="param">
                    <strong>200 OK</strong> - Request successful
                </div>
                <div class="param">
                    <strong>400 Bad Request</strong> - Missing or invalid parameters
                </div>
                <div class="param">
                    <strong>404 Not Found</strong> - Resource not found
                </div>
                <div class="param">
                    <strong>405 Method Not Allowed</strong> - Only GET requests are supported
                </div>
                <div class="param">
                    <strong>500 Internal Server Error</strong> - Server error
                </div>
            </div>

            <!-- Data Structure -->
            <div class="section">
                <h2>📦 Data Structure</h2>
                <h4>Transport Company Object:</h4>
                <div class="response-example">
                    <pre>{
  "id": "abc-transport",
  "name": "ABC Transport",
  "image": "https://...",
  "states": ["Lagos", "Abuja"],
  "terminals": {
    "Lagos": "Terminal location"
  },
  "basePrice": 22000,
  "serviceAttributes": ["Comfort", "Safety"]
}</pre>
                </div>

                <h4>State Object:</h4>
                <div class="response-example">
                    <pre>{
  "companies": ["ABC Transport", "GUO Transport"],
  "region": "Southwest",
  "majorTerminals": ["Jibowu", "Festac"]
}</pre>
                </div>
            </div>

            <!-- Pricing -->
            <div class="section">
                <h2>💰 Pricing</h2>
                <div class="pricing">
                    <h3>API Access Tiers</h3>
                    <div class="price-tier">
                        <strong>🆓 Free Tier</strong><br>
                        100 requests/month | Perfect for testing
                    </div>
                    <div class="price-tier">
                        <strong>⚡ Basic - $9.99/month</strong><br>
                        10,000 requests/month | For small apps
                    </div>
                    <div class="price-tier">
                        <strong>🚀 Pro - $49.99/month</strong><br>
                        100,000 requests/month | For production apps
                    </div>
                    <div class="price-tier">
                        <strong>💼 Enterprise - Custom</strong><br>
                        Unlimited requests | Dedicated support
                    </div>
                </div>
            </div>

            <!-- Support -->
            <div class="section">
                <h2>🤝 Support</h2>
                <p>Need help? Contact us:</p>
                <div class="param">
                    📧 Email: vyraintercitymetrics@gmail.com
                </div>
                <div class="param">
                    📱 Support: Available on RapidAPI
                </div>
            </div>
        </div>
    </div>
</body>
</html>
  `;
  
  res.status(200).send(html);
}
