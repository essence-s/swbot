FROM node:23.11.0-alpine3.20 AS swbot
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN apk add --no-cache ffmpeg && \
    apk add --no-cache git && \
    pnpm install --frozen-lockfile --prod
RUN mkdir -p /app/bin/linux && \
    wget https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_musllinux -O /app/bin/linux/yt-dlp && \
    chmod +x /app/bin/linux/yt-dlp
COPY . .
CMD ["pnpm", "start"]