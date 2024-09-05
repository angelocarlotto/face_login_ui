# sudo docker buildx build --platform=linux/arm64,linux/amd64  -t "angelocarlotto/face_login_ui:latest" . --push

#docker push angelocarlotto/face_login_ui:latest

#docker run --rm -p 3001:3000 angelocarlotto/face_login_ui:latest


FROM node:22.8-alpine

RUN apk update

RUN apk add   git 

#ADD "https://www.random.org/cgi-bin/randbyte?nbytes=10&format=h" skipcache

RUN  git clone https://github.com/angelocarlotto/face_login_ui.git && cd face_login_ui &&  npm install

WORKDIR face_login_ui


RUN node --no-warnings
RUN node --trace-deprecation 
RUN npm run build 

CMD ["npm","run","start"]