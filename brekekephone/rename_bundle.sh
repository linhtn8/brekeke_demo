#!/bin/bash
set -e

OLD_BUNDLE="com.brekeke.phonedev"
NEW_BUNDLE="com.bap.phone"

echo "Replacing in Android files..."
find android/app -type f \( -name "*.java" -o -name "*.kt" -o -name "*.xml" -o -name "*.gradle" -o -name "BUCK" \) -exec sed -i '' "s/$OLD_BUNDLE/$NEW_BUNDLE/g" {} +

echo "Replacing in iOS files..."
find ios -type f \( -name "project.pbxproj" -o -name "Info.plist" -o -name "*.entitlements" \) -exec sed -i '' "s/$OLD_BUNDLE/$NEW_BUNDLE/g" {} +

echo "Moving Android directories..."
# Create the new directory structure
mkdir -p android/app/src/main/java/com/bap/phone

# Move the contents
mv android/app/src/main/java/com/brekeke/phonedev/* android/app/src/main/java/com/bap/phone/

# Remove the old directory if empty
rm -rf android/app/src/main/java/com/brekeke/phonedev
# Wait, we might need to remove com/brekeke if it's empty, let's just do:
rmdir android/app/src/main/java/com/brekeke || true

echo "Done!"
