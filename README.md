# Blog 

![Страница Постов](https://github.com/kodunaiff/fastapi-interview-blog/blob/main/img_for_readme/main_pic.png)


# подключение к postgres через докер-компос

```
docker compose up -d blog_pg
docker compose stop blog_pg
docker compose down
docker compose start blog_pg
sudo systemctl stop postgresql
```

# для работы с бд использую dbeaver-ce

Новое соединение выбираем postgres

```
Host - localhost
Port - 5432
Database - qablog
Username - user
Password - password
```


poetry add alembic
cd crud_app
alembic init -t async alembic

alembic revision --autogenerate -m "create tasks table"
alembic upgrade head
alembic downgrade -1
alembic downgrade base

для форматирования кода
poetry add --group dev black
