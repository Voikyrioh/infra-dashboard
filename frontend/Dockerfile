FROM node:24-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/site
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY public/* /usr/share/nginx/site/assets/*
EXPOSE 80
