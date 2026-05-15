import pymysql
from app.core.config import settings

# Parse the database URL to get connection details
url = settings.DATABASE_URL
# mysql+pymysql://root:password@localhost:3306/documentvault
url_without_driver = url.split("://")[1]
credentials, host_db = url_without_driver.split("@")
user, password = credentials.split(":")
host_port, db_name = host_db.split("/")
host, port = host_port.split(":")

print(f"Connecting to MySQL at {host}:{port} with user {user} to create database {db_name}...")

try:
    conn = pymysql.connect(
        host=host,
        port=int(port),
        user=user,
        password=password
    )
    cursor = conn.cursor()
    cursor.execute(f"CREATE DATABASE IF NOT EXISTS {db_name}")
    print(f"Database '{db_name}' created or already exists.")
    cursor.close()
    conn.close()
except Exception as e:
    print(f"Error creating database: {e}")
