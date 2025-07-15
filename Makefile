up: ## Docker Composeを起動
	docker compose up -d
down: ## Docker Composeを停止
	docker compose down
exec: ## Docker Composeのコンテナに入る
	docker exec -it stellar-js bash
