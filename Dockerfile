FROM registry.interprocom.ru/ipc/axioma/axi/rea/rea-axioma-ui/node:22.3.0 as build

WORKDIR /usr/local/discord-bot-build/

COPY package*.json .
RUN npm i
COPY tsconfig*.json .
COPY nest-cli.json .
COPY ./src ./src
RUN npm run build


FROM registry.interprocom.ru/ipc/axioma/axi/rea/rea-axioma-ui/node:22.3.0

WORKDIR /usr/local/discord-bot/

COPY package*.json .

RUN npm ci --omit=dev
COPY .env .
COPY --from=build /usr/local/discord-bot-build/dist ./dist

EXPOSE 8444

CMD npm run start:prod
