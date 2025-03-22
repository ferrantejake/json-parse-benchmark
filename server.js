const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// Serve static files
app.use(express.static(path.join(__dirname)));

// Serve the benchmark page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'benchmark.html'));
});

// Start the server
app.listen(port, () => {
  console.log(`Benchmark server running at http://localhost:${port}`);
  console.log(`Open your browser to view and run the WASM benchmarks.`);
}); 