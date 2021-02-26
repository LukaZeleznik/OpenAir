# OpenAir

Full stack web application using Node.js, Express.js, Vue.js, MongoDB and Nginx.

# Requirements
- Docker

# Usage

1. Fork the repository
2. Open a terminal inside the main folder and run:
```properties
docker-compose up --build
```
3. Open up the nginx container with:
```properties
docker exec -it nginx bash
```
4. In the container, run:
```properties
npm run serve
```
5. Open up your browser and navigate to localhost:81/install
6. Install and play!

![OpenAir Travian](https://i.imgur.com/cnzcfUQ.png)
