============================== CRASHWATCHDOG ==============================

A desktop utility for monitoring game processes for crashes, hangs, and
performance issues, built with a custom Matrix-style theme.

The current public build is distributed as a standalone executable.
A full installer experience is not yet implemented. At present, the
downloaded executable runs directly and does not perform a permanent
system installation.

Created by Nick Hall (Maxingitout).

============================== WHAT IT DOES ==============================

CrashWatchdog is a tool designed for PC gamers, developers, and power users to
monitor running applications and system performance. It can automatically
detect installed Steam games and display them in a tiled interface, but it can
also be used to monitor other running processes.

The application provides real-time system metrics, process lifecycle tracking,
and session logging to help diagnose issues such as application freezes,
unresponsive behaviour, or unexpected closures.

============================== CHANGELOG ==============================

v0.0.1 - Concept

Project concept defined.

Core application logic made standalone in Node.js, removing external script
dependencies.

v0.0.2 - Working Build

First stable, working build of the application.

Confirmed codebase is platform-agnostic for Windows and Linux packaging.

Implemented basic crash detection for terminated processes.

v0.0.5 - Theme

Fully custom "Matrix" theme with a green-on-black aesthetic.

Integrated a custom monospace font ("Share Tech Mono").

Added an animated "digital rain" background of binary code.

v0.0.7 - Features & Colour Scheme

Refined colour scheme and UI component styling.

Live system health monitoring for real-time CPU and RAM usage.

Hang detection implemented to flag unresponsive processes.

Custom geometric wolf logo integrated into the application header and
configured as the taskbar and window icon.

v0.9.0 - Windows Stability & Executable Release

Reliable Steam game detection on Windows.

Automatic extraction and caching of game icons from executables.

Monitoring start/stop logic stabilised.

Automatic stop of monitoring when the monitored game process exits.

Standalone Windows executable published.

NOTE:
The current executable runs as a one-time application and does not yet
install CrashWatchdog permanently onto the system. Improving the installer
experience is planned for a future release.

============================== HOW TO LAUNCH (CURRENT BUILD) ==============================

1. Download the latest CrashWatchdog executable from the GitHub Releases page:
   https://github.com/Maxingitout/Crashwatchdog/releases

2. Run the downloaded executable directly.

No Node.js, command-line usage, or developer tools are required for this
method. The application will run for the current session only.

============================== HOW TO LAUNCH (FOR DEVELOPMENT) ==============================

To run CrashWatchdog in a development environment, Node.js is required:
https://nodejs.org/

Navigate to the project directory in your terminal.

Examples:
  Linux (Chromebook):
    cd ~/CrashWatchdog-New

  Windows:
    cd C:\Temp\CrashWatchdog-New
    (Create the Temp folder if it does not already exist.)

Install all required dependencies. This command reads the package.json file
and downloads the necessary libraries into the node_modules folder:

  npm install

Run the application. This command starts the Vite development server for the
user interface and launches the Electron application:

  npx electron-forge start

============================== KNOWN LIMITATIONS ==============================

• The current executable is not a full installer.
• CrashWatchdog is not permanently installed on the system.
• Monitoring must currently be started manually.
• Automatic detection of active running games is not yet implemented.
• Session summary files are not yet generated.

============================== PLANNED IMPROVEMENTS ==============================

• Proper Windows installer with permanent installation
• Automatic detection of running games
• Automatic monitoring start and stop
• Per-session .txt summary reports
• Improved update and versioning workflow

===========================================================================
