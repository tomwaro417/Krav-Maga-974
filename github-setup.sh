#!/bin/bash
# github-setup.sh - Finalisation connexion GitHub

echo "🚀 FINALISATION CONNEXION GITHUB"
echo "================================="
echo ""

# Afficher la clé publique
echo "📋 Ta clé SSH publique (à copier sur GitHub) :"
echo "----------------------------------------------"
cat ~/.ssh/id_ed25519_github.pub
echo "----------------------------------------------"
echo ""

# Instructions
echo "🔐 ÉTAPE 1 : Ajouter la clé sur GitHub"
echo "   1. Va sur https://github.com/settings/keys"
echo "   2. Clique 'New SSH key'"
echo "   3. Colle la clé ci-dessus"
echo "   4. Clique 'Add SSH key'"
echo ""

echo "🔓 ÉTAPE 2 : Authentifier GitHub CLI"
echo "   Exécute : gh auth login"
echo "   Choisis : GitHub.com → SSH → Oui"
echo "   Suis les instructions à l'écran"
echo ""

echo "✅ ÉTAPE 3 : Tester"
echo "   ssh -T git@github.com"
echo "   Tu devrais voir : 'Hi [username]! You've successfully authenticated'"
echo ""

echo "📚 Commandes utiles une fois connecté :"
echo "   gh repo list              # Voir tes repos"
echo "   gh repo create mon-projet # Créer un repo"
echo "   git clone git@github.com:user/repo.git  # Cloner"
echo "   gh pr create              # Créer une pull request"
echo ""
