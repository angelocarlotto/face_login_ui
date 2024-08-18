# sudo docker build  -t "angelocarlotto/face_login_ui:latest" .

#docker push angelocarlotto/face_login_ui:latest

#docker run --rm -p 3001:3000 angelocarlotto/face_login_ui:latest


FROM ubuntu

RUN apt update

RUN apt install -y nodejs git git-all npm

ADD "https://www.random.org/cgi-bin/randbyte?nbytes=10&format=h" skipcache

RUN  git clone https://github.com/angelocarlotto/face_login_ui.git && cd face_login_ui &&  npm install

WORKDIR face_login_ui

CMD ["npm","run","dev"]