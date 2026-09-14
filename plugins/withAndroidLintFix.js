const { withAppBuildGradle } = require('@expo/config-plugins');

// Le chiavi Info.plist localizzate per iOS (locales/it.json, locales/en.json,
// vedi app.json "locales") finiscono anche nelle risorse stringa di Android
// senza un valore "di base": il lint obbligatorio di una build release
// (lintVitalRelease) le segnala come errore fatale "ExtraTranslation" e
// blocca la build, anche se quelle chiavi non vengono mai lette su Android.
// Disattiva solo questo controllo, non tocca il resto del lint.
module.exports = function withAndroidLintFix(config) {
  return withAppBuildGradle(config, (config) => {
    if (!config.modResults.contents.includes("disable 'ExtraTranslation'")) {
      config.modResults.contents = config.modResults.contents.replace(
        /android\s*\{/,
        `android {\n    lint {\n        disable 'ExtraTranslation'\n    }\n`
      );
    }
    return config;
  });
};
