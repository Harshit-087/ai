const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PYTHON_API_URL = 'http://localhost:8000'; 

// Middleware
app.use(cors());
app.use(express.json());


app.post('/api/classify', async (req, res) => {
  try {
    console.log('Received request:', req.body); 
    
    // Handle both array and object inputs
    const payload = Array.isArray(req.body)
      ? req.body 
      : req.body.text
        ? [{ text: req.body.text }] 
        : req.body.resumes
          ? req.body.resumes.map(text => ({ text })) 
          : [{ text: JSON.stringify(req.body) }]; 

    // Call Python API
    const response = await axios.post(
      `${PYTHON_API_URL}/classify`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );
    
    res.json(response.data);
  } catch (error) {
    console.error('Full proxy error:', {
      request: error.config?.data,
      response: error.response?.data,
      stack: error.stack
    });
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.detail || 'Classification failed',
      expected_format: "Send either: [{'text':'...'}] or {'text':'...'}"
    });
  }
});

// Start server
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Node proxy running on http://localhost:${PORT}`);
});