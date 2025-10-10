============================== CRASHWATCHWATCHDOG ============================== 

A desktop utility for monitoring game processes for crashes and hangs, built with a custom matrix-style theme.

Current build is not packaged and will need the steps for developers to launch.

Created by Nick Hall (Maxingitout).

==============================  WHAT IT DOES ============================== 

CrashWatchdog is a tool designed for PC gamers, developers, and power users to keep an eye on running applications. It can automatically detect your Steam library but can be used to monitor any running process. The application provides real-time feedback and system metrics, helping to diagnose issues like application freezes or unexpected closures.

============================== CHANGELOG ============================== 

v0.0.1 - Concept

Project concept defined.

Core application logic made standalone in Node.js, removing external script dependencies.

v0.0.2 - Working Build

First stable, working build of the application.

Confirmed codebase is platform-agnostic for Windows and Linux packaging.

Implemented basic Crash Detection for terminated processes.

v0.0.5 - Theme

Fully custom "Matrix" theme with a green-on-black aesthetic.

Integrated a custom monospace font ("Share Tech Mono").

Added an animated "digital rain" background of binary code.

v0.0.7 - Features & Colour Scheme

Refined colour scheme and UI component styling.

Live System Health monitoring for real-time CPU and RAM usage.

Hang Detection implemented to flag unresponsive processes.

Custom geometric wolf logo integrated into the application header and configured as the taskbar/window icon.

============================== HOW TO LAUNCH (FOR DEVELOPMENT) ============================== 

To run this application in a development environment, you will need to have Node.js installed (https://nodejs.org/).

Navigate to the project directory in your terminal:
cd ~./CrashWatchdog-New (Lunix in Chromebook)
cd c/Temp/CrashWatchdog-New (Windows) (Create Temp file if it doesn't already exisit)

Install all the required dependencies. This command reads the package.json file and downloads all the necessary libraries into the node_modules folder.
npm install

Run the application. This command will start the Vite development server for the user interface and launch the Electron application.
npx electron-forge start
