
from pathlib import Path

from service import check_image

examples_dir = Path(__file__).resolve().parent / "examples"
examples = {
    "animal.jpg": "approved",
    "no_animal.jpg": "rejected",
    "bird.jpg": "approved",
    "person.jpg": "rejected",
}

passed = 0
for filename, expected in examples.items():
    path = examples_dir / filename
    if not path.is_file() or path.stat().st_size == 0:
        print(f"{filename}: нужно добавить фото")
        continue

    print(f"Проверяю {filename}…", flush=True)
    try:
        actual = check_image(path)["status"]
    except Exception as error:
        print(f"{filename}: сбой проверки ({type(error).__name__})")
        continue

    passed += int(actual == expected)
    print(f"{filename}: ожидали {expected}, получили {actual}")

print(f"Совпало с ожиданиями: {passed}/{len(examples)}")