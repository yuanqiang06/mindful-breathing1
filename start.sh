#!/bin/bash

# 检查Python版本
if command -v python3 &>/dev/null; then
    python3 -m http.server 8000
elif command -v python &>/dev/null; then
    python -m SimpleHTTPServer 8000
else
    echo "错误：未找到Python，请安装Python后再试"
    exit 1
fi 