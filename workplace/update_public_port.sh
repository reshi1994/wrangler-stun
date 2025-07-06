#!/bin/sh

# 默认配置
WORKER_URL="https://your-worker.workers.dev/api/update_webs_port"
BEARER_TOKEN="your-secret-token"
NEW_PORT=""

# 帮助文档
usage() {
  echo "用法: $0 -p <port> [-t <token>] [-u <url>]"
  echo ""
  echo "选项:"
  echo "  -p, --port     端口号（必填）"
  echo "  -t, --token    Bearer Token（可选）"
  echo "  -u, --url      Worker 接口地址（可选）"
  exit 1
}

# 参数解析
while [[ "$#" -gt 0 ]]; do
  case "$1" in
    -p|--port)
      NEW_PORT="$2"
      shift 2
      ;;
    -t|--token)
      BEARER_TOKEN="$2"
      shift 2
      ;;
    -u|--url)
      WORKER_URL="$2"
      shift 2
      ;;
    -h|--help)
      usage
      ;;
    *)
      echo "❌ 未知参数: $1"
      usage
      ;;
  esac
done

# 校验参数
if [[ -z "$NEW_PORT" ]]; then
  echo "❌ 错误: 端口号必须通过 -p 或 --port 指定"
  usage
fi

# 发起请求
response=$(curl -s -X POST "$WORKER_URL" \
  -H "Authorization: Bearer $BEARER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"port\": $NEW_PORT}")

# 输出结果
echo "✅ 响应: $response"
