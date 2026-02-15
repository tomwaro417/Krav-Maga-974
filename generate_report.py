from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib.colors import HexColor, black, white, grey
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY
from datetime import datetime
import os

# Créer le répertoire de sortie
output_dir = "/home/tomwaro/.openclaw/workspace/output"
os.makedirs(output_dir, exist_ok=True)

# Créer le PDF
pdf_path = f"{output_dir}/rapport_exemple.pdf"
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

# Couleurs personnalisées
primary_color = HexColor('#2C3E50')
accent_color = HexColor('#E74C3C')
light_grey = HexColor('#ECF0F1')

# Styles personnalisés
title_style = ParagraphStyle(
    'CustomTitle',
    parent=styles['Heading1'],
    fontSize=28,
    textColor=primary_color,
    spaceAfter=30,
    alignment=TA_CENTER,
    fontName='Helvetica-Bold'
)

subtitle_style = ParagraphStyle(
    'CustomSubtitle',
    parent=styles['Normal'],
    fontSize=12,
    textColor=grey,
    alignment=TA_CENTER,
    spaceAfter=50
)

heading_style = ParagraphStyle(
    'CustomHeading',
    parent=styles['Heading2'],
    fontSize=16,
    textColor=primary_color,
    spaceBefore=20,
    spaceAfter=10,
    fontName='Helvetica-Bold'
)

body_style = ParagraphStyle(
    'CustomBody',
    parent=styles['Normal'],
    fontSize=10,
    textColor=black,
    alignment=TA_JUSTIFY,
    spaceAfter=10,
    leading=14
)

date_style = ParagraphStyle(
    'DateStyle',
    parent=styles['Normal'],
    fontSize=11,
    textColor=grey,
    alignment=TA_CENTER
)

# Contenu du rapport
story = []

# Page de titre
story.append(Spacer(1, 80))
story.append(Paragraph("RAPPORT ANNUEL 2024", title_style))
story.append(Paragraph("Performance & Analyses Stratégiques", subtitle_style))
story.append(Spacer(1, 30))

# Date
story.append(Paragraph(f"Généré le {datetime.now().strftime('%d %B %Y')}", date_style))
story.append(Spacer(1, 100))

# Ligne décorative
decoration = Table([['']], colWidths=[15*cm])
decoration.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, -1), accent_color),
    ('HEIGHT', (0, 0), (-1, -1), 3),
]))
story.append(decoration)
story.append(Spacer(1, 50))

story.append(PageBreak())

# Introduction
story.append(Paragraph("1. Introduction", heading_style))
intro_text = """Ce rapport présente une analyse complète des performances réalisées au cours de l'année 2024. 
Les données collectées révèlent des tendances positives et des opportunités d'amélioration 
identifiées à travers différents secteurs d'activité."""
story.append(Paragraph(intro_text, body_style))
story.append(Spacer(1, 20))

# Section 2 : Chiffres clés
story.append(Paragraph("2. Chiffres Clés", heading_style))

# Tableau de données stylisé
data = [
    ['Métrique', '2023', '2024', 'Évolution'],
    ['Revenus (k€)', '850', '1 240', '+45.9%'],
    ['Clients', '45', '68', '+51.1%'],
    ['Satisfaction', '87%', '92%', '+5 pts'],
    ['Projets livrés', '23', '35', '+52.2%'],
]

table = Table(data, colWidths=[4*cm, 3*cm, 3*cm, 3*cm])
table.setStyle(TableStyle([
    # En-tête
    ('BACKGROUND', (0, 0), (-1, 0), primary_color),
    ('TEXTCOLOR', (0, 0), (-1, 0), white),
    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
    ('FONTSIZE', (0, 0), (-1, 0), 10),
    ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
    ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
    
    # Corps
    ('BACKGROUND', (0, 1), (-1, -1), white),
    ('TEXTCOLOR', (0, 1), (-1, -1), black),
    ('FONTNAME', (0, 1), (0, -1), 'Helvetica-Bold'),
    ('FONTSIZE', (0, 1), (-1, -1), 9),
    ('ALIGN', (1, 1), (-1, -1), 'CENTER'),
    ('BOTTOMPADDING', (0, 1), (-1, -1), 8),
    ('TOPPADDING', (0, 1), (-1, -1), 8),
    
    # Lignes alternées
    ('BACKGROUND', (0, 2), (-1, 2), light_grey),
    ('BACKGROUND', (0, 4), (-1, 4), light_grey),
    
    # Évolution en couleur
    ('TEXTCOLOR', (3, 1), (3, -1), HexColor('#27AE60')),
    ('FONTNAME', (3, 1), (3, -1), 'Helvetica-Bold'),
    
    # Bordures
    ('GRID', (0, 0), (-1, -1), 0.5, grey),
    ('BOX', (0, 0), (-1, -1), 1, primary_color),
]))

story.append(table)
story.append(Spacer(1, 30))

# Section 3 : Analyse
story.append(Paragraph("3. Analyse des Performances", heading_style))

analysis_text = """L'année 2024 marque une étape importante dans notre développement avec une croissance 
exceptionnelle de +45.9% du chiffre d'affaires. Cette performance s'explique par :"""
story.append(Paragraph(analysis_text, body_style))
story.append(Spacer(1, 10))

points = [
    "• Le lancement réussi de trois nouveaux produits innovants",
    "• L'expansion sur de nouveaux marchés géographiques",
    "• L'amélioration continue de la satisfaction client (+5 points)",
    "• L'optimisation des processus internes permettant +52% de projets livrés"
]

for point in points:
    story.append(Paragraph(point, body_style))

story.append(Spacer(1, 20))

# Encadré important
encadre_text = """<b>Point Clé :</b> La satisfaction client atteint 92% en 2024, dépassant largement 
l'objectif fixé à 88%. Cette performance traduit la qualité des améliorations apportées au service client."""

important_data = [[Paragraph(encadre_text, body_style)]]

important_box = Table(important_data, colWidths=[15*cm])
important_box.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, -1), HexColor('#FFF9E6')),
    ('BOX', (0, 0), (-1, -1), 1, HexColor('#F39C12')),
    ('LEFTPADDING', (0, 0), (-1, -1), 15),
    ('RIGHTPADDING', (0, 0), (-1, -1), 15),
    ('TOPPADDING', (0, 0), (-1, -1), 10),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
]))

story.append(important_box)
story.append(Spacer(1, 30))

# Section 4 : Conclusion
story.append(Paragraph("4. Perspectives 2025", heading_style))

conclusion_text = """Les résultats de 2024 établissent une base solide pour la poursuite de notre 
développement. Les objectifs 2025 visent une croissance maintenue de 30% avec 
une focalisation particulière sur l'innovation produit et l'expansion européenne."""
story.append(Paragraph(conclusion_text, body_style))

# Générer le PDF
doc.build(story)

print(f"✅ Rapport PDF créé : {pdf_path}")
print(f"📄 Taille : {os.path.getsize(pdf_path) / 1024:.1f} Ko")
