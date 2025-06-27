# Docker Volumes

This directory contains persistent data volumes for the Stellar-JS Docker container.

## Directory Structure

```
docker-volumes/
├── data/           # SQLite database files
├── logs/           # Application logs
├── exports/        # Exported CSV/JSON datasets
└── config/         # Configuration files
```

## Usage

These directories are automatically mounted when running the Docker container:

```bash
# Start collection
docker-compose up stellar-collector

# View collected data
ls -la docker-volumes/data/

# Access exported datasets
ls -la docker-volumes/exports/
```

## Data Persistence

All data collected by the container is persisted in these directories, allowing:
- Resumable collection after container restart
- Easy access to results from the host system
- Backup and transfer of collected data

## Permissions

Ensure the `stellar` user (UID 1001) has write access to these directories.