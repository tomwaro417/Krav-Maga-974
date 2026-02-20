# Format d’import (JSON) — Référentiel

Endpoint: `POST /api/admin/import` (Admin)

## Schéma
```json
{
  "belts": [
    {
      "code": "JAUNE",
      "name": "Jaune",
      "orderIndex": 1,
      "isActive": true,
      "modules": [
        {
          "title": "UV1 — Techniques en position neutre",
          "orderIndex": 1,
          "isActive": true,
          "techniques": [
            { "title": "Coup de tête", "orderIndex": 1, "descriptionRich": "…", "keywords": "…" }
          ]
        }
      ]
    }
  ]
}
```

## Remarques MVP
- Stratégie d’import actuelle : pour chaque ceinture importée, on **supprime** les modules existants puis on recrée.
- À améliorer ensuite : import “diff/merge” + soft-delete + mapping stable (ex: `external_id`).
