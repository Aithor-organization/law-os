module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    // react-native-worklets/plugin is required by Reanimated 3.16+
    // It's installed via the `react-native-worklets` dependency.
  };
};
