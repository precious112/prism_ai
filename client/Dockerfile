FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ARG NEXT_PUBLIC_OFFLINE_MODE
ENV NEXT_PUBLIC_OFFLINE_MODE=$NEXT_PUBLIC_OFFLINE_MODE

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
