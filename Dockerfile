# Step 1 builds the website with Node, step 2 serves the built files with nginx.
# Only the small nginx image is kept, so the final image has no Node or source code.

FROM node:24-alpine AS build
WORKDIR /app
# The website build doesn't need Electron, so skip its large download.
ENV ELECTRON_SKIP_BINARY_DOWNLOAD=1
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
