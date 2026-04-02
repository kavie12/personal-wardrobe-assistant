# Wardrobe Assistant — Phase 1 Test Suite

## Folder structure

```
tests/
├── test_classification.py      ← main test script
├── classification_results.json ← auto-generated after a run
├── README.md                   ← this file
└── test_images/                ← put your clothing images here
    ├── white_tshirt.jpg
    ├── blue_formal_shirt.jpg
    └── ...
```

## Setup

```bash
pip install requests pytest pillow
```

## Authentication

Get a Firebase ID token for a test account:

```python
import pyrebase
# or use the Firebase REST API:
# POST https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=YOUR_API_KEY
```

Then either:
- Set it directly in `test_classification.py` → `AUTH_TOKEN = "your_token"`
- Or export it: `export WARDROBE_TOKEN=your_token`

## Running the tests

**With pytest (recommended — shows per-image pass/fail):**
```bash
pytest test_classification.py -v
```

**Standalone summary mode:**
```bash
python test_classification.py
```

## Adding test images

1. Place `.jpg` images in `tests/test_images/`
2. Add an entry to `TEST_ITEMS` in `test_classification.py`:

```python
"your_image.jpg": {
    "category":      "Topwear",           # one value, strict match
    "type":          "T-shirt",           # one value, strict match
    "colors":        ["White"],           # list, lenient match (subset)
    "occasions":     ["Casual"],          # list, lenient match
    "temperatures":  ["Hot", "Mild"],     # list, lenient match
},
```

## Scoring modes explained

| Mode | Fields | Rule |
|------|--------|------|
| Strict | `category`, `type` | Predicted must exactly equal expected |
| Lenient | `colors`, `occasions`, `temperatures` | Every value in your expected list must appear in the predicted list. The LLM may add extra valid values (e.g. predict `["Blue", "White"]` when you expected `["Blue"]`) — this still passes. |

## Results file

After each run, `classification_results.json` is written. Include this in your thesis appendix as evidence of testing. It contains per-image, per-field results with strict and lenient pass flags.

## Suggested test image set (minimum 15 images)

| File | Category | Type |
|------|----------|------|
| white_tshirt.jpg | Topwear | T-shirt |
| blue_formal_shirt.jpg | Topwear | Shirt |
| black_hoodie.jpg | Topwear | Hoodie |
| grey_blazer.jpg | Topwear | Blazer |
| red_polo_shirt.jpg | Topwear | Polo shirt |
| blue_jeans.jpg | Bottomwear | Jeans |
| black_trousers.jpg | Bottomwear | Trousers |
| khaki_shorts.jpg | Bottomwear | Shorts |
| black_leggings.jpg | Bottomwear | Leggings |
| black_dress.jpg | One-piece | Dress |
| floral_jumpsuit.jpg | One-piece | Jumpsuit |
| white_sneakers.jpg | Footwear | Sneakers |
| black_formal_shoes.jpg | Footwear | Formal shoes |
| brown_boots.jpg | Footwear | Boots |
| blurry_jacket.jpg | Topwear | Jacket (edge case) |