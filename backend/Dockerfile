FROM node:24-alpine AS builder

# 🐋 Labels for github packages
LABEL org.opencontainers.image.source=$PROJECT_DOCKER_URL
LABEL org.opencontainers.image.description="Voiky's Web API Boilerplate"
LABEL org.opencontainers.image.licenses=MIT

# 📁 Copy of source files
COPY src src/
COPY libraries libraries/
COPY index.ts .
COPY package.json .
COPY build.mjs .

#  Install app dependencies
ENV NPM_CONFIG_LOGLEVEL warn
RUN npm install
RUN npm install -g esbuild
RUN node build.mjs

FROM node:24-alpine AS runner

# 🔨 Copy built files
COPY --from=builder dist .

# 🔌 Expose the listening port of your app
EXPOSE $PORT

RUN node ./dist/index.js
