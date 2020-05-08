FROM node:12.16.3-alpine3.11

# Add our configuration files and scripts
WORKDIR /app
ADD . /app
RUN npm install
EXPOSE 3000

ENTRYPOINT ["npm", "start"]