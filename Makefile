build-server:
	cd server
	npm i

build-client:
	npm i
	npm run build

build-deploy: 
	sudo docker-compose up --build

deploy:
	sudo docker-compose up

all: build-server build-client build-deploy
