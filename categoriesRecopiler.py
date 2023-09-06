import requests
import json

categories = {}
page = 1

while True:
    response = requests.get(
        f"http://regimen.localhost/wp-json/wp/v2/categories?page={page}")
    data = response.json()

    print(f"Recuperando categoria de la página: {page}")

    if not data:
        break

    for category in data:
        categories[category["name"]] = category["id"]

    page += 1

with open("assets/categoriesRaw.json", "w", encoding="utf-8") as json_file:
    json.dump(categories, json_file, indent=4, ensure_ascii=False)

print("Categorías almacenadas en categoriesRaw.json")

# category = {}
# page = 1

# while True:
#     response = requests.get(
#         f"http://regimen.localhost/wp-json/wp/v2/tags?page={page}")
#     data = response.json()

#     print(f"Recuperando etiqueta de la página: {page}")

#     if not data:
#         break

#     for category in data:
#         categories[category["name"]] = category["id"]

#     page += 1

# with open("tagsRaw.json", "w", encoding="utf-8") as json_file:
#     json.dump(categories, json_file, indent=4,ensure_ascii=False)

# print("Etiquetas almacenadas en tagsRaw.json")