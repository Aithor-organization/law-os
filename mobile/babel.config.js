module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    // react-native-reanimated/plugin must be LAST. Missing it causes
    // `__reanimatedLoggerConfig doesn't exist` + `makeMutable of undefined`.
    // (Reanimated 3.x uses its own plugin; react-native-worklets/plugin is for v4+)
    plugins: ["react-native-reanimated/plugin"],
  };
};
