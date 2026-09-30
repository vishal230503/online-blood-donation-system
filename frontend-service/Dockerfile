# syntax=docker/dockerfile:1
# ---------- Stage 1: build the React app ----------
FROM node:16-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY public ./public
COPY src ./src

# Same-origin paths; nginx proxies them to the backend services (see nginx.conf)
ARG REACT_APP_ADDRESS_API=/address-api
ARG REACT_APP_BACKEND_API=/backend-api
ENV REACT_APP_ADDRESS_API=$REACT_APP_ADDRESS_API \
    REACT_APP_BACKEND_API=$REACT_APP_BACKEND_API \
    CI=false GENERATE_SOURCEMAP=false
RUN npm run build

# ---------- Stage 2: serve with unprivileged nginx ----------
FROM nginxinc/nginx-unprivileged:1.25-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -qO- http://localhost:8080/healthz || exit 1
