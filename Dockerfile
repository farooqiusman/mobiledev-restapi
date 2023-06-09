FROM node:11-alpine

RUN mkdir -p /usr/src/app

WORKDIR /usr/src/app

COPY . .

RUN npm install express bcrypt mysql dotenv

RUN npm install

EXPOSE 3003

CMD ["npm", "run", "start"]
