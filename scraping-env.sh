#!/bin/bash
# scraping-env.sh - Active l'environnement de scraping
source /home/tomwaro/.venvs/scraping/bin/activate
export PYTHONPATH="/home/tomwaro/.venvs/scraping/lib/python3.12/site-packages:$PYTHONPATH"
echo "🕷️ Environnement scraping activé !"
echo "Packages disponibles :"
pip list | grep -E "(requests|beautifulsoup4|playwright|httpx|fake-useragent|lxml)"
