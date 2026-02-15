#!/bin/bash
# activate-devweb.sh - Active les outils dev web
echo "🌐 Outils Dev Web disponibles :"
echo ""
echo "Node.js :"
echo "  • Node $(node --version)"
echo "  • npm $(npm --version)"
echo ""
echo "Installation de Vite (build tool rapide) :"
npm install -g vite@latest 2>&1 | tail -3
echo ""
echo "Installation de live-server :"
npm install -g live-server@latest 2>&1 | tail -3
echo ""
echo "✅ Prêt pour le dev web moderne !"
echo ""
echo "Usage :"
echo "  vite create mon-projet"
echo "  cd mon-projet && npm install && npm run dev"
echo "  live-server --port=8080"
