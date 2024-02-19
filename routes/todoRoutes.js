const express = require('express');
const { faker } = require('@faker-js/faker');
const Todo = require('../models/todo');
const router = express.Router();

// Initialize data
router.get('/init', async (req, res) => {
  try {
    // Clear existing data
    await Todo.deleteMany({});
    await req.esClient.indices.delete({ index: 'todos' }, { ignore: [404] });

    // Create and insert 5000 fake todos
    const todos = [];
    for (let i = 0; i < 5000; i++) {
      const todo = {
        title: faker.lorem.sentence(),
        completed: faker.datatype.boolean()
      };
      todos.push(todo);

      // Insert into Elasticsearch
      await req.esClient.index({
        index: 'todos',
        body: todo
      });
    }

    // Insert into MongoDB
    await Todo.insertMany(todos);

    res.status(201).json({ message: 'Data initialized successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new todo
router.post('/', async (req, res) => {
  try {
    const todo = new Todo(req.body);
    await todo.save();

    // Index in Elasticsearch
    await req.esClient.index({
      index: 'todos',
      body: {
        title: todo.title,
        completed: todo.completed
      }
    });

    res.status(201).json(todo);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get all todos
router.get('/', async (req, res) => {
  try {
    // Check if data is in Elasticsearch cache
    const { body } = await req.esClient.search({
      index: 'todos',
      body: {
        query: {
          match_all: {}
        },
        size: 10000
      }
    });

    // If data is found in cache, return it
    if (body.hits.total.value > 0) {
      const todos = body.hits.hits.map((hit) => hit._source);
      res.json(todos);
      return;
    }

    // If data is not in cache, query MongoDB
    const todos = await Todo.find();

    // Index todos in Elasticsearch for future cache hits
    for (const todo of todos) {
      await req.esClient.index({
        index: 'todos',
        body: todo
      });
    }

    res.json(todos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Find todos by title
router.get('/search', async (req, res) => {
  const { title } = req.query;
  try {
    const { body } = await req.esClient.search({
      index: 'todos',
      body: {
        query: {
          match: {
            title: title
          },
          size: 10000
        }
      }
    });

    const todos = body.hits.hits.map((hit) => hit._source);

    // If data is found in Elasticsearch, return it
    if (body.hits.total.value === 0) {
      const todos = await Todo.find({ title: title });

      // Index todos in Elasticsearch for future cache hits
      for (const todo of todos) {
        await req.esClient.index({
          index: 'todos',
          body: todo
        });
      }

      res.json(todos);
      return;
    }

    res.json(todos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update a todo
router.put('/:id', async (req, res) => {
  try {
    const todo = await Todo.findByIdAndUpdate(req.params.id, req.body, {
      new: true
    });

    // Update in Elasticsearch
    await req.esClient.updateByQuery({
      index: 'todos',
      body: {
        script: {
          source:
            'ctx._source.title = params.title; ctx._source.completed = params.completed;',
          params: {
            title: todo.title,
            completed: todo.completed
          }
        },
        query: {
          match: { _id: todo._id.toString() }
        }
      }
    });

    res.json(todo);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a todo
router.delete('/:id', async (req, res) => {
  try {
    await Todo.findByIdAndDelete(req.params.id);

    // Delete from Elasticsearch
    await req.esClient.deleteByQuery({
      index: 'todos',
      body: {
        query: {
          match: { _id: req.params.id }
        }
      }
    });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
