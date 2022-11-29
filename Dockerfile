FROM node:lts

WORKDIR /app/

COPY . .
RUN npm install -g pnpm
RUN pnpm install
COPY config/adminList.sample.yml config/adminList.yml
COPY config/config.sample.yml config/config.yml
COPY config/announcement.sample.md config/announcement.md
RUN sed -i "s/host: 127.0.0.1/host: gh-db/g" config/config.yml
RUN sed -i "s#path.join(__dirname, '../config/#path.join(__dirname, '../../config/#g" src/install/install.js

EXPOSE 3000

CMD [ "node", "app.js" ]