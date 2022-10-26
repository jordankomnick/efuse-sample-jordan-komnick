# eFuse Backend Sample
Prepared by Jordan Komnick

## Installation
### Prerequisites
Exact installation and setup instructions will vary depending on your operating system and version, see linked websites for details
- NodeJS 16: https://nodejs.org/en/download/
- MongoDB Community Server: https://www.mongodb.com/try/download/community
  - Create a Mongo database called "local" with a collection called "posts" running on the default port 27017
- Redis: https://redis.io/docs/getting-started/installation/
  - Run Redis on the default port 6379

### Main Components
Run the following in the directory where you have downloaded the project:

`npm install`

Make sure MongoDB and Redis are running on the default ports

## Running and Usage
Once everything is installed, run the application with:

`npm run start`

There will be a console log with the port number when the server is running locally. Endpoints can be hit via curl or a free tool such as Postman or Insomnia.

## Testing
To run unit tests

`npm run test`

## Design and Implementation Decisions
- Despite Redis connectivity being in the "definition of done" for phase 0, I didn't implement it in that phase. This is because I looked ahead and saw that Redis was not required until phase 4 when caching is introduced. In real projects, I generally don't decide on and wire up major new dependencies until right before they are needed, for the following reasons:
  - You want to wait until you have as much information as possible before deciding on a dependency, especially if it is a decision that is hard to reverse
  - It is better to spend developer time working on features that are immediately valuable rather than laying groundwork for potential future development, especially on tight deadlines
- I am assuming that whenever a post or comment is updated, the user_id will always be passed in, as it would not make sense to update a post without a user performing the action
- If I was designing this API myself I probably wouldn't include the GET /posts/:id/comments endpoint because the comments are included in the GET /posts/:id endpoint, but it is in the requirements
- In a full application, the logic would be further split into routes->middleware->controller->service->repository. Because this is a basic CRUD application, I chose to skip most of the layers.
- When working in an existing application that already has a testing framework set up, I generally write tests first, but I saved them for last here because I would rather have a working app with no tests than tests with no app

## Caveats
- I am working on a laptop from 2014 with 8GB RAM, so I could not set up Docker for this project
- This is my first time ever using MongoDB, so there are some usage decisions that I know aren't ideal and I would fix if I had more time to research
- While I have worked with applications that use Redis for caching, this is the first time actually implementing it myself