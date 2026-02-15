#!/bin/bash
# setup-headless.sh - Optimisation machine pour Morpheus 24/7
# À exécuter avec: sudo bash setup-headless.sh

set -e

echo "🔧 Configuration mode headless pour Morpheus..."

# 1. Activer SSH au démarrage
echo "→ Activation SSH au boot..."
systemctl enable ssh

# 2. Désactiver toutes les mises en veille
echo "→ Désactivation veille/hibernation..."
systemctl mask sleep.target suspend.target hibernate.target hybrid-sleep.target

# 3. Créer la config de veille (désactivée)
cat > /etc/systemd/sleep.conf.d/disable-sleep.conf << 'EOF'
[Sleep]
AllowSuspend=no
AllowHibernation=no
AllowSuspendThenHibernate=no
AllowHybridSleep=no
EOF

# 4. Désactiver la suspension à la fermeture du capot (si laptop)
# (Pas applicable sur desktop, mais on le met au cas où)

# 5. Configurer le WiFi pour ne jamais se mettre en économie d'énergie
# (Si interface wifi présente)
for wifi in /sys/class/net/wl*; do
    if [ -d "$wifi" ]; then
        iface=$(basename "$wifi")
        echo "→ Désactivation économie d'énergie sur $iface..."
        iw dev "$iface" set power_save off 2>/dev/null || true
    fi
done

# 6. Activer le service OpenClaw
echo "→ Activation service OpenClaw..."
systemctl daemon-reload
systemctl enable openclaw
systemctl start openclaw

echo ""
echo "✅ Configuration terminée !"
echo ""
echo "📋 Résumé:"
echo "   - SSH: actif au boot"
echo "   - Veille: désactivée"
echo "   - OpenClaw: service activé"
echo ""
echo "💡 Pour te connecter à distance:"
echo "   ssh tomwaro@192.168.1.7"
echo ""
