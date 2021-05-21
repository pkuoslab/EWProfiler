# The manager of EWProfiler

This directory contains the manager of EWProfiler.

The implementation is based on an early version of [Paladin](https://github.com/pkuoslab/Paladin).

## Prerequisite
* Android SDK
* [Gradle](https://gradle.org/)

## Compile
* Run `gradle fatjar` in the `paladin-source` directory. This command will compile the Java source code and build a `paladin.jar` file in the `paladin-source/build/libs` directory.

## Deplay
* Install the `uiautomator.apk` and the `uiautomator-androidTest.apk` on the smartphone.

## Explore
* Before running the manager, set configuration in the file `paladin-source/build/config.json`. Generally, only the `ADB_PATH` and `PACKAGE` fields need to be customized, other fields in the configuation can be kept same as the original. The `ADB_PATH` field points to the folder of the `adb`, and the `PACKAGE` field specifies the package name of the mobile app going to be traversed.
* Run `java -jar paladin.jar` to start traversing in the mobile app.
* During the running of manager, one can access `http://localhost:5700/save` to let the manager save the current traversal graph.
* The manager will traverse the app until it thinks that there are no more activities can be found in the mobile app. One can stop the running of the manager at any time. As long as the traversal graph has been saved, EWProfiler can replay the traversal even though the exploration did not terminate properly.

## Replay
* Run `java -jar paladin.jar -r` to replay the traveral of EWProfiler.
