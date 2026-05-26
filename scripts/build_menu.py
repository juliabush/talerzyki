#!/usr/bin/env python3
"""Generate menu HTML and translation JSON for Talerzyki."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def item(key, pl_name, pl_price, pl_desc, en_name, en_price, en_desc):
    return {
        "key": key,
        "pl": {"name": pl_name, "price": pl_price, "desc": pl_desc},
        "en": {"name": en_name, "price": en_price, "desc": en_desc},
    }


def note(key, pl_text, en_text):
    return {"key": key, "note": True, "pl": pl_text, "en": en_text}


def item_html(it):
    if it.get("note"):
        k = it["key"]
        return f"""                <li class="menu-item menu-item--note">
                  <p class="menu-item-desc" data-i18n="menu.{k}">{it["pl"]}</p>
                </li>"""
    k = it["key"]
    pl = it["pl"]
    price = (
        f'\n                    <span class="menu-item-price" data-i18n="menu.{k}.price">{pl["price"]}</span>'
        if pl["price"]
        else ""
    )
    desc = (
        f'\n                  <p class="menu-item-desc" data-i18n="menu.{k}.desc">{pl["desc"]}</p>'
        if pl.get("desc")
        else ""
    )
    return f"""                <li class="menu-item">
                  <div class="menu-item-head">
                    <span class="menu-item-name" data-i18n="menu.{k}.name">{pl["name"]}</span>{price}
                  </div>{desc}
                </li>"""


def sub(i18n, text):
    return f'              <h4 class="menu-subcategory-heading" data-i18n="{i18n}">{text}</h4>\n'


def category(title_i18n, title_pl, items):
    blocks = [f"""            <div class="menu-category">
              <h3 class="menu-category-heading" data-i18n="{title_i18n}">{title_pl}</h3>
              <ul class="menu-items">
{chr(10).join(item_html(i) for i in items)}
              </ul>
            </div>"""]
    return "\n".join(blocks)


MENU_INTRO = note(
    "intro",
    "Smaki Lewantu i Bliskiego Wschodu — dania inspirowane tradycją, podane z sercem.",
    "Inspired by the flavors of the Levant & Middle East — tradition on every plate.",
)

SMALL_PLATES = [
    item(
        "small.hummus",
        "Classic Hummus",
        "24 zł",
        "Kremowy hummus z ciecierzycy z tahini, oliwą, papryką i pietruszką",
        "Classic Hummus",
        "24 PLN",
        "Creamy chickpea hummus with tahini, olive oil, paprika & parsley",
    ),
    item(
        "small.muttabal",
        "Smoky Muttabal",
        "28 zł",
        "Dip z pieczonego bakłażana z sezamem, granatem i oliwą",
        "Smoky Muttabal",
        "28 PLN",
        "Fire-roasted eggplant dip with sesame, pomegranate & olive oil",
    ),
    item(
        "small.falafel",
        "Falafel",
        "26 zł",
        "Chrupiące falafele z ziołami, sezonowym sosem i ogórkami",
        "Falafel",
        "26 PLN",
        "Crispy herb falafel served with seasonal sauce & pickles",
    ),
    item(
        "small.ful",
        "Palestinian Ful",
        "28 zł",
        "Ciepły gulasz z bobu z kminkiem, pomidorem i oliwą",
        "Palestinian Ful",
        "28 PLN",
        "Warm fava bean stew with cumin, tomato & olive oil",
    ),
    item(
        "small.labaneh",
        "Labaneh",
        "26 zł",
        "Domowy jogurt z zaatarem lub sosem shatta chili",
        "Labaneh",
        "26 PLN",
        "House strained yogurt with za'atar or shatta chili sauce",
    ),
    item(
        "small.zahra",
        "Zahra Bi Tahini",
        "30 zł",
        "Pieczony kalafior z cytrynową tahini i sumakiem",
        "Zahra Bi Tahini",
        "30 PLN",
        "Roasted cauliflower with lemon tahini & sumac",
    ),
    item(
        "small.fatteh",
        "Hummus Fatteh",
        "33 zł",
        "Warstwowy hummus z jogurtem, chrupiącą pitą, ciecierzycą i nerkowcem",
        "Hummus Fatteh",
        "33 PLN",
        "Layered hummus with yogurt, crispy pita, chickpeas & cashews",
    ),
]

WRAPS = [
    item(
        "wraps.falafel",
        "Falafel Wrap",
        "25 zł",
        "Falafel, tahini, ogórki i zioła",
        "Falafel Wrap",
        "25 PLN",
        "Falafel, tahini, pickles & herbs",
    ),
    item(
        "wraps.hummus_falafel",
        "Hummus + Falafel Wrap",
        "27 zł",
        "Klasyczne połączenie kremowego hummusu i chrupiącego falafela",
        "Hummus + Falafel Wrap",
        "27 PLN",
        "Classic combo with creamy hummus & crunchy falafel",
    ),
    item(
        "wraps.nabulsi",
        "Grilled Nabulsi Wrap",
        "29 zł",
        "Grillowany słony ser, pomidory i zaatar",
        "Grilled Nabulsi Wrap",
        "29 PLN",
        "Salty grilled cheese, tomatoes & za'atar",
    ),
    item(
        "wraps.ful_falafel",
        "Ful + Falafel Wrap",
        "28 zł",
        "Bogaty pastet z bobu z chrupiącym falafelem",
        "Ful + Falafel Wrap",
        "28 PLN",
        "Rich fava bean spread with crispy falafel",
    ),
]

SALADS = [
    item(
        "salads.tabbouleh",
        "Tabbouleh",
        "24 zł",
        "Pietruszka, bulgur, pomidor, ogórek, mięta i dressing cytrynowy",
        "Tabbouleh",
        "24 PLN",
        "Parsley, bulgur, tomato, cucumber, mint & lemon dressing",
    ),
    item(
        "salads.fattoush",
        "Fattoush",
        "23 zł",
        "Świeże warzywa, zioła, chrupiąca pita i dressing z sumakiem",
        "Fattoush",
        "23 PLN",
        "Fresh vegetables, herbs, crispy pita & sumac dressing",
    ),
]

HOT_DISHES = [
    item(
        "hot.shakshuka",
        "Shakshuka",
        "32 zł",
        "Jajka pieczone w aromatycznym sosie pomidorowym z ziołami",
        "Shakshuka",
        "32 PLN",
        "Eggs baked in spiced tomato sauce with herbs",
    ),
    item(
        "hot.mfarrakeh",
        "Mfarrakeh",
        "29 zł",
        "Przyprawione ziemniaki z jajkami i mieszanką siedmiu przypraw",
        "Mfarrakeh",
        "29 PLN",
        "Spiced potatoes with eggs & seven spice blend",
    ),
    item(
        "hot.mshat",
        "Mshat Zahrah",
        "30 zł",
        "Palestyńskie placki z kalafiora z miętowym jogurtem",
        "Mshat Zahrah",
        "30 PLN",
        "Palestinian cauliflower fritters with mint yogurt",
    ),
]

SWEETS = [
    item(
        "sweets.harissa",
        "Pistachio Harissa Cake",
        "12 zł",
        "Słodkie ciasto semolina moczone w kwiatowym syropie",
        "Pistachio Harissa Cake",
        "12 PLN",
        "Sweet semolina cake soaked in floral syrup",
    ),
    item(
        "sweets.baklava",
        "Baklava",
        "10 zł",
        "Warstwy ciasta filo, orzechy i syrop",
        "Baklava",
        "10 PLN",
        "Layers of filo pastry, nuts & syrup",
    ),
    item(
        "sweets.halva",
        "Halva Melted Pita",
        "18 zł",
        "Ciepła pita z roztopioną chałwą, pistacjami i granatem",
        "Halva Melted Pita",
        "18 PLN",
        "Warm pita with melted halva, pistachio & pomegranate",
    ),
    item(
        "sweets.date_cake",
        "Date Lazy Cake",
        "14 zł",
        "Miękkie ciasto-biszkopt czekoladowo-daktylowe",
        "Date Lazy Cake",
        "14 PLN",
        "Soft chocolate-date biscuit cake",
    ),
]

COFFEE = [
    item("coffee.espresso", "Espresso", "10 zł", "", "Espresso", "10 PLN", ""),
    item("coffee.flat_white", "Flat White", "14 zł", "", "Flat White", "14 PLN", ""),
    item("coffee.cappuccino", "Cappuccino", "14 zł", "", "Cappuccino", "14 PLN", ""),
    item("coffee.latte", "Latte", "15 zł", "", "Latte", "15 PLN", ""),
    item("coffee.turkish", "Turkish Coffee", "13 zł", "", "Turkish Coffee", "13 PLN", ""),
    item("coffee.sahlab", "Sahlab Espresso", "16 zł", "", "Sahlab Espresso", "16 PLN", ""),
    item("coffee.tonic", "Tonic Espresso", "17 zł", "", "Tonic Espresso", "17 PLN", ""),
]

TEA_DRINKS = [
    item(
        "drinks.mint_lemonade",
        "Mint Lemonade",
        "16 zł",
        "",
        "Mint Lemonade",
        "16 PLN",
        "",
    ),
    item("drinks.tamarind", "Tamarind Drink", "14 zł", "", "Tamarind Drink", "14 PLN", ""),
    item(
        "drinks.orange_ginger",
        "Orange Ginger Raspberry",
        "16 zł",
        "",
        "Orange Ginger Raspberry",
        "16 PLN",
        "",
    ),
    item("drinks.sage_tea", "Sage Black Tea", "16 zł", "", "Sage Black Tea", "16 PLN", ""),
    item("drinks.mint_tea", "Mint Black Tea", "15 zł", "", "Mint Black Tea", "15 PLN", ""),
    item(
        "drinks.syrian_herbal",
        "Syrian Herbal Tea",
        "17 zł",
        "",
        "Syrian Herbal Tea",
        "17 PLN",
        "",
    ),
    item(
        "drinks.cardamom_milk",
        "Cardamom Milk Tea",
        "19 zł",
        "",
        "Cardamom Milk Tea",
        "19 PLN",
        "",
    ),
]

SIDES = [
    item("sides.pita", "Fresh Pita", "3 zł", "", "Fresh Pita", "3 PLN", ""),
    item("sides.pickles", "Pickles", "5 zł", "", "Pickles", "5 PLN", ""),
    item(
        "sides.sauces",
        "Sauces",
        "4 zł",
        "Tahini / Harissa / Za'atar",
        "Sauces",
        "4 PLN",
        "Tahini / Harissa / Za'atar",
    ),
]

META_PL = {
    "eyebrow": "Lewant · Bliski Wschód",
    "title": "Menu",
    "lead": "Smaki Lewantu i Bliskiego Wschodu — dania inspirowane tradycją.",
    "catSmallPlates": "Małe talerze",
    "catWraps": "Wrapy",
    "catSalads": "Sałatki",
    "catHotDishes": "Dania na ciepło",
    "catSweets": "Słodkości",
    "catCoffee": "Kawa",
    "catTeaDrinks": "Herbata i napoje",
    "catSides": "Dodatki",
    "serviceNote": "",
}

META_EN = {
    "eyebrow": "Levant · Middle East",
    "title": "Menu",
    "lead": "Inspired by the flavors of the Levant & Middle East.",
    "catSmallPlates": "Small Plates",
    "catWraps": "Wraps",
    "catSalads": "Salads",
    "catHotDishes": "Hot Dishes",
    "catSweets": "Sweets",
    "catCoffee": "Coffee",
    "catTeaDrinks": "Tea & Drinks",
    "catSides": "Sides",
    "serviceNote": "",
}


def build_menu_json_for_lang(meta, all_items, lang):
    menu = dict(meta)
    for it in all_items:
        if it.get("note"):
            menu[it["key"]] = it[lang]
            continue
        src = it[lang]
        entry = {"name": src["name"], "price": src["price"] or ""}
        if src.get("desc"):
            entry["desc"] = src["desc"]
        parts = it["key"].split(".")
        cur = menu
        for p in parts[:-1]:
            cur = cur.setdefault(p, {})
        cur[parts[-1]] = entry
    return menu


def main():
    food_items = (
        [MENU_INTRO]
        + SMALL_PLATES
        + WRAPS
        + SALADS
        + HOT_DISHES
        + SWEETS
    )
    drink_items = COFFEE + TEA_DRINKS + SIDES
    all_items = food_items + drink_items

    food_html = "\n".join(
        [
            category("menu.catSmallPlates", "Małe talerze", SMALL_PLATES),
            category("menu.catWraps", "Wrapy", WRAPS),
            category("menu.catSalads", "Sałatki", SALADS),
            category("menu.catHotDishes", "Dania na ciepło", HOT_DISHES),
            category("menu.catSweets", "Słodkości", SWEETS),
        ]
    )

    drinks_html = "\n".join(
        [
            category("menu.catCoffee", "Kawa", COFFEE),
            category("menu.catTeaDrinks", "Herbata i napoje", TEA_DRINKS),
            category("menu.catSides", "Dodatki", SIDES),
        ]
    )

    catalog = f"""          <div class="menu-catalog">
            <div class="menu-catalog-columns">
              <div class="menu-catalog-col menu-catalog-col--food">
{food_html}
              </div>
              <div class="menu-catalog-col menu-catalog-col--drinks">
{drinks_html}
              </div>
            </div>
          </div>"""

    index = (ROOT / "index.html").read_text()
    new_index = re.sub(
        r'          <div class="menu-catalog">[\s\S]*?</div>\n        </div>\n      </section>\n\n      <!-- Gallery -->',
        catalog + "\n        </div>\n      </section>\n\n      <!-- Gallery -->",
        index,
        count=1,
    )
    if new_index == index:
        raise SystemExit("Could not replace menu-catalog in index.html")

    (ROOT / "index.html").write_text(new_index)

    for lang, meta in [("pl", META_PL), ("en", META_EN)]:
        path = ROOT / "translations" / f"{lang}.json"
        data = json.loads(path.read_text())
        data["menu"] = build_menu_json_for_lang(meta, all_items, lang)
        path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")

    print(
        "OK:",
        len([i for i in all_items if not i.get("note")]),
        "dishes,",
        len([i for i in all_items if i.get("note")]),
        "notes",
    )


if __name__ == "__main__":
    main()
