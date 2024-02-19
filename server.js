const express = require('express');
const mongoose = require('mongoose');
const todoRoutes = require('./routes/todoRoutes');
const { Client } = require( '@elastic/elasticsearch' );
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

const app = express();
const port = 3000;

// Load Swagger YAML file
const swaggerDocument = YAML.load( './api.yaml' );
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/todo_db', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Elasticsearch client
const esClient = new Client({ node: 'http://localhost:9200' });

// Middleware
app.use(express.json());
app.use((req, _, next) => {
  req.esClient = esClient;
  next();
});

// Routes
app.use('/api/todos', todoRoutes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
