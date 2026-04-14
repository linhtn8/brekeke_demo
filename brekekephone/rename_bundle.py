import os
import glob

OLD_BUNDLE = "com.brekeke.phonedev"
NEW_BUNDLE = "com.bap.phone"


def replace_in_file(filepath):
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
    except UnicodeDecodeError:
        try:
            with open(filepath, "r", encoding="mac_roman") as f:
                content = f.read()
        except Exception as e:
            print(f"Skipping {filepath}: {e}")
            return

    if OLD_BUNDLE in content:
        content = content.replace(OLD_BUNDLE, NEW_BUNDLE)
        try:
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(content)
            print(f"Updated {filepath}")
        except Exception as e:
            print(f"Failed to write {filepath}: {e}")


print("Processing Android files...")
for root, dirs, files in os.walk("android/app"):
    for file in files:
        if file.endswith((".java", ".kt", ".xml", ".gradle", "BUCK")):
            replace_in_file(os.path.join(root, file))

print("Processing iOS files...")
for root, dirs, files in os.walk("ios"):
    for file in files:
        if file.endswith(("project.pbxproj", "Info.plist", ".entitlements")):
            replace_in_file(os.path.join(root, file))

print("Moving Android directories...")
os.makedirs("android/app/src/main/java/com/bap/phone", exist_ok=True)
os.system(
    "mv android/app/src/main/java/com/brekeke/phonedev/* android/app/src/main/java/com/bap/phone/ || true"
)
os.system("rm -rf android/app/src/main/java/com/brekeke/phonedev || true")

print("Moving debug directories if they exist...")
if os.path.exists("android/app/src/debug/java/com/brekeke/phonedev"):
    os.makedirs("android/app/src/debug/java/com/bap/phone", exist_ok=True)
    os.system(
        "mv android/app/src/debug/java/com/brekeke/phonedev/* android/app/src/debug/java/com/bap/phone/ || true"
    )
    os.system("rm -rf android/app/src/debug/java/com/brekeke/phonedev || true")
