```
### express-api-starter

Quick start

- Install dependencies:

```
npm install
```

- Copy the example environment file and update values as needed:

```
cp sample.env .env
```

- Run the project in development mode:

```
npm run dev
```

If you need to reinstall all packages later, run `npm install` again.

For more information, see the project files in the `src/` directory.

### Install project dependencies
If you need to reinstall all required packages:
npm install


- Test redis connection using test-redis.js
```
node test-redis.js
```

---------------------------------------------------- DOCKER (NODE JS)-----------------------------------------------
To create a docker image from a custom route:
>> docker build -t express-api -f Docker/node/Dockerfile .

Run the image:
>> docker run -p 3000:8000 node-api-container express-api
--> docker run -p 3000:8000 --name node-api-container express-api:latest

. Docker read this as:

HOST_PORT : CONTAINER_PORT
Image: node-api-container
Command: express-api

To view list of docker images:
>> docker ps -a

