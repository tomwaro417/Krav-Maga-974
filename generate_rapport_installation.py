from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib.colors import HexColor, black, white, grey
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY
from datetime import datetime
import os

# Créer le PDF
output_dir = "/home/tomwaro/.openclaw/workspace/output"
os.makedirs(output_dir, exist_ok=True)
pdf_path = f"{output_dir}/rapport_installation_morpheus.pdf"

doc = SimpleDocTemplate(
    pdf_path,
    pagesize=A4,
    rightMargin=2*cm,
    leftMargin=2*cm,
    topMargin=2*cm,
    bottomMargin=2*cm
)

# Styles
styles = getSampleStyleSheet()
primary_color = HexColor('#2C3E50')
accent_color = HexColor('#E74C3C')
secondary_color = HexColor('#3498DB')
light_grey = HexColor('#ECF0F1')

title_style = ParagraphStyle(
    'CustomTitle', parent=styles['Heading1'], fontSize=26,
    textColor=primary_color, spaceAfter=20, alignment=TA_CENTER, fontName='Helvetica-Bold'
)
subtitle_style = ParagraphStyle(
    'CustomSubtitle', parent=styles['Normal'], fontSize=12,
    textColor=grey, alignment=TA_CENTER, spaceAfter=40
)
heading_style = ParagraphStyle(
    'CustomHeading', parent=styles['Heading2'], fontSize=14,
    textColor=primary_color, spaceBefore=15, spaceAfter=8, fontName='Helvetica-Bold'
)
body_style = ParagraphStyle(
    'CustomBody', parent=styles['Normal'], fontSize=9,
    textColor=black, alignment=TA_JUSTIFY, spaceAfter=8, leading=12
)

story = []

# Page de titre
story.append(Spacer(1, 60))
story.append(Paragraph("RAPPORT D'INSTALLATION", title_style))
story.append(Paragraph("Configuration complète de Morpheus - Agent IA Autonome", subtitle_style))
story.append(Spacer(1, 20))

# Info système
info_data = [
    ['Machine', 'HP ProDesk 400 G4 DM'],
    ['OS', 'Ubuntu 24.04.4 LTS'],
    ['Date', datetime.now().strftime('%d %B %Y')],
    ['Agent', 'Morpheus v1.0'],
]
info_table = Table(info_data, colWidths=[4*cm, 10*cm])
info_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (0, -1), light_grey),
    ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
    ('FONTSIZE', (0, 0), (-1, -1), 10),
    ('GRID', (0, 0), (-1, -1), 0.5, grey),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 10),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
]))
story.append(info_table)
story.append(Spacer(1, 40))

# Ligne décorative
decoration = Table([['']], colWidths=[14*cm])
decoration.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, -1), accent_color),
    ('HEIGHT', (0, 0), (-1, -1), 3),
]))
story.append(decoration)
story.append(PageBreak())

# SECTION 1 : SYSTÈME
story.append(Paragraph("1. Outils Système & Réseau", heading_style))

sys_data = [
    ['Outil', 'Version', 'Usage'],
    ['htop', '3.3.0', 'Moniteur système interactif'],
    ['btop', '1.3.0', 'Moniteur système graphique'],
    ['fd (fdfind)', '9.0.0', 'Recherche fichier ultra-rapide'],
    ['ripgrep', '14.1.0', 'Grep moderne performant'],
    ['fzf', '0.44.1', 'Fuzzy finder interactif'],
    ['jq', '1.7.1', 'Parser JSON en CLI'],
    ['yq', '3.1.0', 'Parser YAML en CLI'],
    ['tree', '2.1.1', 'Arborescence répertoires'],
    ['ncdu', '1.19', 'Analyseur disque interactif'],
    ['rclone', '1.60.1', 'Synchronisation cloud'],
    ['nmap', '7.94', 'Scan réseau sécurité'],
    ['net-tools', '2.10', 'Outils réseau (ifconfig, netstat)'],
]

sys_table = Table(sys_data, colWidths=[3.5*cm, 2.5*cm, 8*cm])
sys_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), primary_color),
    ('TEXTCOLOR', (0, 0), (-1, 0), white),
    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
    ('FONTSIZE', (0, 0), (-1, 0), 9),
    ('BACKGROUND', (0, 1), (-1, -1), white),
    ('BACKGROUND', (0, 2), (-1, 2), light_grey),
    ('BACKGROUND', (0, 4), (-1, 4), light_grey),
    ('BACKGROUND', (0, 6), (-1, 6), light_grey),
    ('BACKGROUND', (0, 8), (-1, 8), light_grey),
    ('BACKGROUND', (0, 10), (-1, 10), light_grey),
    ('GRID', (0, 0), (-1, -1), 0.5, grey),
    ('FONTSIZE', (0, 1), (-1, -1), 8),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
]))
story.append(sys_table)
story.append(Spacer(1, 15))

# SECTION 2 : DOCKER
story.append(Paragraph("2. Conteneurisation Docker", heading_style))

docker_data = [
    ['Composant', 'Version', 'Description'],
    ['Docker CE', '29.2.1', 'Moteur de conteneurs'],
    ['Docker Compose', 'v5.0.2', 'Orchestration multi-conteneurs'],
    ['Buildx', '0.31.1', 'Build multi-plateforme'],
    ['Containerd', '2.2.1', 'Runtime de conteneurs'],
]

docker_table = Table(docker_data, colWidths=[3.5*cm, 2.5*cm, 8*cm])
docker_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), secondary_color),
    ('TEXTCOLOR', (0, 0), (-1, 0), white),
    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
    ('FONTSIZE', (0, 0), (-1, 0), 9),
    ('BACKGROUND', (0, 1), (-1, -1), white),
    ('GRID', (0, 0), (-1, -1), 0.5, grey),
    ('FONTSIZE', (0, 1), (-1, -1), 8),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
]))
story.append(docker_table)
story.append(Spacer(1, 15))

# SECTION 3 : ENVIRONNEMENTS PYTHON
story.append(Paragraph("3. Environnements Python Virtualisés", heading_style))

env_text = """Trois environnements virtuels dédiés ont été créés pour isoler les dépendances :"""
story.append(Paragraph(env_text, body_style))
story.append(Spacer(1, 5))

env_data = [
    ['Environnement', 'Chemin', 'Usage principal'],
    ['scraping', '~/.venvs/scraping', 'Navigation web, Playwright, BeautifulSoup'],
    ['documents', '~/.venvs/documents', 'Génération PDF, Word, Excel, PowerPoint'],
    ['system', 'Python 3.12.3 natif', 'Outils système et scripts généraux'],
]

env_table = Table(env_data, colWidths=[3*cm, 6*cm, 5*cm])
env_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), primary_color),
    ('TEXTCOLOR', (0, 0), (-1, 0), white),
    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
    ('BACKGROUND', (0, 1), (-1, -1), white),
    ('BACKGROUND', (0, 2), (-1, 2), light_grey),
    ('GRID', (0, 0), (-1, -1), 0.5, grey),
    ('FONTSIZE', (0, 0), (-1, -1), 8),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
]))
story.append(env_table)
story.append(PageBreak())

# SECTION 4 : SCRAPING
story.append(Paragraph("4. Arsenal de Scraping Web", heading_style))

scrap_data = [
    ['Outil', 'Version', 'Fonction'],
    ['Playwright', '1.58.0', 'Navigateur automatisé (Chrome, Firefox, WebKit)'],
    ['yt-dlp', '2024.04.09', 'Téléchargement vidéos (YouTube, 1000+ sites)'],
    ['gallery-dl', '1.26.9', 'Téléchargement images (Instagram, Reddit...)'],
    ['instaloader', '4.10.3', 'Scraping Instagram spécifique'],
    ['requests', '2.32.5', 'Requêtes HTTP synchrones'],
    ['httpx', '0.28.1', 'Requêtes HTTP sync/async'],
    ['beautifulsoup4', '4.14.3', 'Parsing HTML/XML'],
    ['lxml', '6.0.2', 'Parsing XML/HTML haute performance'],
    ['fake-useragent', '2.2.0', 'Rotation User-Agent'],
]

scrap_table = Table(scrap_data, colWidths=[3.5*cm, 2.5*cm, 8*cm])
scrap_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), HexColor('#9B59B6')),
    ('TEXTCOLOR', (0, 0), (-1, 0), white),
    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
    ('FONTSIZE', (0, 0), (-1, 0), 9),
    ('BACKGROUND', (0, 1), (-1, -1), white),
    ('BACKGROUND', (0, 2), (-1, 2), light_grey),
    ('BACKGROUND', (0, 4), (-1, 4), light_grey),
    ('BACKGROUND', (0, 6), (-1, 6), light_grey),
    ('BACKGROUND', (0, 8), (-1, 8), light_grey),
    ('GRID', (0, 0), (-1, -1), 0.5, grey),
    ('FONTSIZE', (0, 1), (-1, -1), 8),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
]))
story.append(scrap_table)
story.append(Spacer(1, 15))

# SECTION 5 : DEV WEB
story.append(Paragraph("5. Développement Web Moderne", heading_style))

dev_data = [
    ['Outil/Techno', 'Version', 'Usage'],
    ['Node.js', 'v22.22.0', 'Runtime JavaScript moderne'],
    ['npm', '10.9.4', 'Gestionnaire de paquets'],
    ['pm2', '6.0.14', 'Process manager production'],
    ['Vite', '7.3.1', 'Build tool ultra-rapide'],
    ['ESLint', '10.0.0', 'Linter JavaScript'],
    ['Sass', '1.97.3', 'Préprocesseur CSS'],
    ['TypeScript', '5.9.3', 'JavaScript typé'],
    ['ts-node', '10.9.2', 'Exécution TypeScript directe'],
]

dev_table = Table(dev_data, colWidths=[3.5*cm, 2.5*cm, 8*cm])
dev_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), HexColor('#E67E22')),
    ('TEXTCOLOR', (0, 0), (-1, 0), white),
    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
    ('FONTSIZE', (0, 0), (-1, 0), 9),
    ('BACKGROUND', (0, 1), (-1, -1), white),
    ('BACKGROUND', (0, 2), (-1, 2), light_grey),
    ('BACKGROUND', (0, 4), (-1, 4), light_grey),
    ('BACKGROUND', (0, 6), (-1, 6), light_grey),
    ('GRID', (0, 0), (-1, -1), 0.5, grey),
    ('FONTSIZE', (0, 1), (-1, -1), 8),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
]))
story.append(dev_table)
story.append(Spacer(1, 15))

# SECTION 6 : DOCUMENTS
story.append(Paragraph("6. Génération de Documents", heading_style))

doc_data = [
    ['Librairie', 'Version', 'Formats supportés'],
    ['python-docx', '1.2.0', 'Microsoft Word (.docx)'],
    ['openpyxl', '3.1.5', 'Microsoft Excel (.xlsx)'],
    ['python-pptx', '1.0.2', 'Microsoft PowerPoint (.pptx)'],
    ['reportlab', '4.4.10', 'PDF avancé (vectoriel)'],
    ['fpdf2', '2.8.5', 'PDF simple'],
    ['XlsxWriter', '3.2.9', 'Excel avancé (graphiques)'],
    ['Pillow', '12.1.1', 'Manipulation d\'images'],
]

doc_table = Table(doc_data, colWidths=[3.5*cm, 2.5*cm, 8*cm])
doc_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), HexColor('#27AE60')),
    ('TEXTCOLOR', (0, 0), (-1, 0), white),
    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
    ('FONTSIZE', (0, 0), (-1, 0), 9),
    ('BACKGROUND', (0, 1), (-1, -1), white),
    ('BACKGROUND', (0, 2), (-1, 2), light_grey),
    ('BACKGROUND', (0, 4), (-1, 4), light_grey),
    ('BACKGROUND', (0, 6), (-1, 6), light_grey),
    ('GRID', (0, 0), (-1, -1), 0.5, grey),
    ('FONTSIZE', (0, 1), (-1, -1), 8),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
]))
story.append(doc_table)
story.append(PageBreak())

# SECTION 7 : CONFIGURATION
story.append(Paragraph("7. Configuration Système", heading_style))

config_data = [
    ['Paramètre', 'Valeur', 'Description'],
    ['SSH', 'Actif + auto-boot', 'Accès distant sécurisé'],
    ['Docker', 'Service auto-boot', 'Démarrage automatique des containers'],
    ['OpenClaw', 'Service systemd', 'Agent IA démarrage auto'],
    ['Sudo sans pass', 'Activé', 'tomwaro ALL=(ALL) NOPASSWD'],
    ['Veille', 'Désactivée', 'Machine toujours allumée'],
    ['Headless', 'Actif', 'Fonctionnement sans écran/clavier'],
]

config_table = Table(config_data, colWidths=[4*cm, 4*cm, 6*cm])
config_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), accent_color),
    ('TEXTCOLOR', (0, 0), (-1, 0), white),
    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
    ('FONTSIZE', (0, 0), (-1, 0), 9),
    ('BACKGROUND', (0, 1), (-1, -1), white),
    ('BACKGROUND', (0, 2), (-1, 2), light_grey),
    ('BACKGROUND', (0, 4), (-1, 4), light_grey),
    ('GRID', (0, 0), (-1, -1), 0.5, grey),
    ('FONTSIZE', (0, 1), (-1, -1), 8),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
]))
story.append(config_table)
story.append(Spacer(1, 20))

# Résumé
story.append(Paragraph("Résumé de l'Installation", heading_style))

resume_data = [
    ['Catégorie', 'Nombre d\'outils', 'Statut'],
    ['Outils Système', '12+', '✅ Opérationnel'],
    ['Docker & Conteneurs', '4', '✅ Service actif'],
    ['Environnements Python', '3 venv', '✅ Isolés'],
    ['Outils Scraping', '9', '✅ Configurés'],
    ['Dev Web', '8', '✅ Installés'],
    ['Génération Documents', '7', '✅ Fonctionnels'],
    ['Configuration', '6', '✅ Optimisée'],
]

resume_table = Table(resume_data, colWidths=[5*cm, 3*cm, 6*cm])
resume_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), primary_color),
    ('TEXTCOLOR', (0, 0), (-1, 0), white),
    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
    ('BACKGROUND', (0, 1), (-1, -1), white),
    ('BACKGROUND', (0, 2), (-1, 2), light_grey),
    ('BACKGROUND', (0, 4), (-1, 4), light_grey),
    ('BACKGROUND', (0, 6), (-1, 6), light_grey),
    ('GRID', (0, 0), (-1, -1), 0.5, grey),
    ('FONTNAME', (0, 1), (0, -1), 'Helvetica-Bold'),
    ('FONTSIZE', (0, 0), (-1, -1), 9),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
]))
story.append(resume_table)
story.append(Spacer(1, 30))

# Conclusion
conclusion = """<b>Status Global :</b> L'installation de Morpheus est complète et fonctionnelle. 
L'agent dispose désormais de tous les outils nécessaires pour opérer de manière autonome : 
gestion système, scraping web, développement, génération de documents, et conteneurisation.

<b>Espace disque utilisé :</b> ~+650 Mo | <b>Prochaines étapes :</b> Création d'agents spécialisés"""

conclusion_data = [[Paragraph(conclusion, body_style)]]
conclusion_box = Table(conclusion_data, colWidths=[15*cm])
conclusion_box.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, -1), HexColor('#E8F8F5')),
    ('BOX', (0, 0), (-1, -1), 1, HexColor('#1ABC9C')),
    ('LEFTPADDING', (0, 0), (-1, -1), 15),
    ('RIGHTPADDING', (0, 0), (-1, -1), 15),
    ('TOPPADDING', (0, 0), (-1, -1), 10),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
]))
story.append(conclusion_box)

# Générer le PDF
doc.build(story)

print(f"✅ Rapport créé : {pdf_path}")
print(f"📄 Taille : {os.path.getsize(pdf_path) / 1024:.1f} Ko")
