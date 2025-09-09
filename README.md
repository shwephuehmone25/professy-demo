## Google Search Scraper

A Node.js application that performs automated Google searches for a specified keyword, extracts URLs from the top results, and stores them in MongoDB. The project can be run with Docker for easy setup and deployment.

## Features

- Performs a Google search for a specified keyword (hiking by default).

- Extracts URLs from the top search results.

- Saves the results to MongoDB.

- Docker-ready for consistent environment setup.


## Tech Stack

- Node.js – runtime environment

- MongoDB – database for storing search results

- Docker – containerization for easy deployment

## Installation

To set up the project locally, follow these steps:

   Clone the repository:
```bash

git clone https://github.com/shwephuehmone25/professy-demo
```

Navigate into the project directory:

```bash

cd professy-demo
```

   Install dependencies:

```bash
npm install
```
Configure MongoDB:
```bash
MONGODB_URI=******
```

Start the application:

```bash
npm run start
```
## Run with Docker:
```bash
docker build -t google-search-scraper
docker run -d google-search-scraper
```

## Live demo
For a complete list of search results, please visit the following:
```
http://172.16.129.67:3000/scraper/all
```

To test the search using a keyword, please visit:
```
http://172.16.129.67:3000/scraper/google?keyword=hiking
```
