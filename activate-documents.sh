#!/bin/bash
# activate-documents.sh - Active l'environnement documents
source /home/tomwaro/.venvs/documents/bin/activate
export PYTHONPATH="/home/tomwaro/.venvs/documents/lib/python3.12/site-packages:$PYTHONPATH"
echo "📄 Environnement Documents activé !"
echo "Outils disponibles :"
echo "  • python-docx - Génération .docx"
echo "  • openpyxl - Génération .xlsx"
echo "  • python-pptx - Génération .pptx"
echo "  • reportlab/fpdf2 - Génération PDF"
