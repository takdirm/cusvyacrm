FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .
RUN GENERATE_SOURCEMAP=false NODE_OPTIONS=--max-old-space-size=4096 yarn craco build

FROM nginx:1.27-alpine AS runtime

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/build /usr/share/nginx/html

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]