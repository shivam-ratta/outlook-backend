const express = require('express');
const axios = require('axios');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config();

const app = express();
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    const allowedOrigins = ["http://localhost:3000"];
    
    // Check if the request's origin is in the allowedOrigins array or if it's undefined (for localhost testing)
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin) || !origin) {
      res.header("Access-Control-Allow-Origin", origin);
    } else {
      res.status(403).end(); // Forbidden for disallowed origins
      return;
    }
    
    next();
  
  });
  
// Define your API endpoint and target URL
const apiProxy = createProxyMiddleware('/oauth/token', {
  target: `https://login.microsoftonline.com/${process.env.TENANT_ID}/oauth2/v2.0/token`,
  changeOrigin: true,
  pathRewrite: {
    '^/oauth/token': '/oauth/token', // Adjust the pathRewrite if necessary
  },
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
});

// Use the proxy middleware for your API endpoint
app.use('/oauth/token', apiProxy);

// Route to handle the equivalent of your cURL request
app.get('/login', async (req, res) => {
  try {
    const response = await axios.post(
      `https://login.microsoftonline.com/${process.env.TENANT_ID}/oauth2/v2.0/token`,
      `client_id=${process.env.CLIENT_ID}&scope=https://graph.microsoft.com/.default&client_secret=${process.env.CLIENT_SECRET}&grant_type=client_credentials`,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    res.status(200).json(response.data);
  } catch (error) {
    console.error('Error fetching access token:', error.message);
    res.status(500).send(error);
  }
});

// Start the Express server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
