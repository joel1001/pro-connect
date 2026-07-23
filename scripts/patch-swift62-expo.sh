#!/usr/bin/env bash
# Swift 6.2 / Xcode 26 compatibility for expo-modules-jsi
set -euo pipefail
DIR="$(cd "$(dirname "$0")/.." && pwd)"
TARGET="$DIR/node_modules/expo-modules-jsi"
if [[ ! -d "$TARGET" ]]; then
  exit 0
fi

find "$TARGET" -name '*.swift' -print0 | xargs -0 sed -i '' 's/weak let/weak var/g' 2>/dev/null || true
sed -i '' 's/internal final class HostFunctionContext: Sendable/internal final class HostFunctionContext: @unchecked Sendable/g' \
  "$TARGET/apple/Sources/ExpoModulesJSI/Contexts/HostFunctionContext.swift"
sed -i '' 's/internal final class HostObjectContext: Sendable/internal final class HostObjectContext: @unchecked Sendable/g' \
  "$TARGET/apple/Sources/ExpoModulesJSI/Contexts/HostObjectContext.swift"
sed -i '' 's/public final class JavaScriptPropNameID: JavaScriptType {/public final class JavaScriptPropNameID: @unchecked Sendable, JavaScriptType {/g' \
  "$TARGET/apple/Sources/ExpoModulesJSI/Runtime/JavaScriptPropNameID.swift"
sed -i '' 's/public final class JavaScriptValue: JavaScriptType, Equatable, Escapable, Error {/public final class JavaScriptValue: @unchecked Sendable, JavaScriptType, Equatable, Escapable, Error {/g' \
  "$TARGET/apple/Sources/ExpoModulesJSI/Runtime/Values/JavaScriptValue.swift"
