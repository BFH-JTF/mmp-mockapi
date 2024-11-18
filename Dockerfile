FROM node:20-alpine
WORKDIR /usr/src/app
RUN mkdir "db"
COPY ./db/* ./db/
COPY ./package.json ./
RUN npm install
COPY ./dist/*.js ./
EXPOSE 8080
CMD ["node", "main.js"]

