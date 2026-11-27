from app.sender import send_to_all

report = send_to_all(
    title="Питомец рядом",
    body="Push, отправленный из Python-скрипта",
)
print(report)
