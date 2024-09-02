FROM node:slim
ENV NODE_ENV development
WORKDIR .

# Copying all the files in our project
COPY . .

# Installing dependencies
RUN npm install

# Starting our application
CMD [ "node", "/src/main.js" ]

# Exposing server port
EXPOSE 8080