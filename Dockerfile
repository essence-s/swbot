FROM node:23.11.0-alpine3.20 as swbot
WORKDIR /app
COPY package*.json ./
RUN apk add --no-cache ffmpeg && \
    apk add --no-cache git && \
    npm install --only=production && \
    npm cache clean --force && \
    mkdir -p /app/bin/linux && \
    wget https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux -O /app/bin/linux/yt-dlp && \
    chmod +x /app/bin/linux/yt-dlp
COPY . .
CMD ["npm", "start"]