# Todo API with Elasticsearch and MongoDB
A simple Todo API that uses Elasticsearch for caching and MongoDB for persistent storage, built with Node.js and Express.

## Getting Started
These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

## Prerequisites
 - Docker
 - Docker Compose
 - Node.js

## Installing
1.Clone the repository:
```sh
git clone https://github.com/yourusername/todo-api.git
```

2.Navigate to the project directory:
```sh
cd ./ELASTICSEARCH-BOOTCAMP
```

3.Start the services using Docker Compose:
```sh
docker-compose up -d
```

4.Node Install
```sh
npm i
```

5.Start Service
```sh
node server.js
```

6.Init Data
```sh
http://localhost:3000/api/todos/init
```

## Features
 - Create a Todo (POST /api/todos)
 - Get All Todos (GET /api/todos)
 - Update a Todo (PUT /api/todos)
 - Delete a Todo (DELETE /api/todos)
 - Search Todos by Title (GET /api/todos/search?title=Buy) can wildcard search here
 - Initialize Database with Fake Data (GET /api/todos/init)