import json
import sys
from pymongo import MongoClient
from dotenv import load_dotenv
from pathlib import Path
import os

load_dotenv(Path(__file__).parent / '.env')

MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'karthiks_estates')

if len(sys.argv) < 2:
    print("Usage: python import_data.py <path_to_backup.json>")
    sys.exit(1)

backup_file = sys.argv[1]

print(f"Connecting to MongoDB at {MONGO_URL}...")
client = MongoClient(MONGO_URL)
db = client[DB_NAME]

with open(backup_file) as f:
    backup = json.load(f)

collections = backup.get('collections', {})

for col_name, docs in collections.items():
    if not docs:
        print(f"  Skipping {col_name} (empty)")
        continue
    db[col_name].drop()
    db[col_name].insert_many(docs)
    print(f"  Imported {len(docs)} records -> {col_name}")

print(f"\nDone. All data imported into database '{DB_NAME}'.")
client.close()
