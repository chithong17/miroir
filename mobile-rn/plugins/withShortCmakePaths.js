const {withAppBuildGradle,withProjectBuildGradle}=require('expo/config-plugins');
// Keep this in configuration, not generated android/. Older SDK-bundled Ninja
// has a 260-character path limit even when Windows long paths are enabled.
module.exports=config=>withProjectBuildGradle(withAppBuildGradle(config,mod=>{
  const marker='// MIROIR: bounded CMake object paths';
  if(!mod.modResults.contents.includes(marker)) {
    mod.modResults.contents+=`\n${marker}\nandroid {\n    defaultConfig {\n        externalNativeBuild {\n            cmake {\n                arguments "-DCMAKE_OBJECT_PATH_MAX=160"\n                def customNinja = System.getenv("MIROIR_NINJA_EXECUTABLE")\n                if (customNinja) {\n                    arguments "-DCMAKE_MAKE_PROGRAM=" + customNinja.replace('\\\\', '/')\n                }\n            }\n        }\n    }\n}\n`;
  }
  return mod;
}),mod=>{
  const marker='// MIROIR: shared Ninja for native libraries';
  if(!mod.modResults.contents.includes(marker)) {
    mod.modResults.contents+=`\n${marker}\nsubprojects { libraryProject ->\n    libraryProject.plugins.withId("com.android.library") {\n        def customNinja = System.getenv("MIROIR_NINJA_EXECUTABLE")\n        if (customNinja) {\n            libraryProject.android.defaultConfig.externalNativeBuild.cmake.arguments("-DCMAKE_MAKE_PROGRAM=" + customNinja.replace('\\\\', '/'))\n        }\n    }\n}\n`;
  }
  return mod;
});
