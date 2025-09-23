## Getting Started
- Node version:
  - 20.14.0

You can install this version with nvm, you can see [nvm installation guide](https://medium.com/@diego.coder/instalar-nvm-node-version-manager-en-windows-80d6768fa183)

## Database
- Create `.env` file, to do this you can copy contents from `.env.example` and replace your instance DB_PASSWORD

If you don't have docker or you don't want to use docker to run database you will need postrgres installed on your machine and create the database and user to match your config at `.env` file

If you want to use docker, you will need to have docker installed in your machine [install docker guide](https://medium.com/@piyushkashyap045/comprehensive-guide-installing-docker-and-docker-compose-on-windows-linux-and-macos-a022cf82ac0b)

after you install docker you can run this command to start postgres database container:
```bash
docker-compose up -d
```

## Restore database
If you have a database backup you can restore it

- If you're using docker:
You will need to copy your database backup inside container
```bash
docker cp <path where db backup is>/cementery_backup.sql cementery-db-dev:/home
```

Restore backup:
```bash
  docker exec -it cementery-db-dev /bin/bash
``` 

```bash
  #Inside container run
  psql -U postgres -h localhost DB_Cementerio < /home/cemetery_backup.sql
``` 

- If you are *not* using docker:
You will need postgres installed locally and run this command, `-p 5433` should match `DB_PORT` declared in your `.env` file and run:

```bash
  psql -U postgres -p 5433 -h localhost DB_Cementerio < ../cemetery_backup.sql
``` 

run the development server:

*We use yarn for this project*
You can install yarn with:
```bash
npm i -g yarn
```

## Project setup

```bash
yarn install
```

## Compile and run the project

```bash
# development
yarn run start

# watch mode
yarn run start:dev

# production mode
yarn run start:prod
```

Backend server will run on [localhost:3000](http://localhost:3000)