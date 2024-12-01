# Game Project README

Welcome to the **3D Flying Combat Game** project! This guide will help you set up, build, and launch the game on your local machine.
By default, **main.ts** file use empty path to initialize a new game, which will create a debug scene.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Building the Project](#building-the-project)
- [Running the Game](#running-the-game)
- [Code References](#code-references)
- [Troubleshooting](#troubleshooting)
- [License](#license)

## Prerequisites

Before you begin, ensure you have the following software installed:

- **Node.js** (version 12 or higher)
  - Download and install from [nodejs.org](https://nodejs.org/)
- **npm** (Node Package Manager)
  - Comes bundled with Node.js

## Installation

1. **Clone the Repository**

   ```bash
   git clone https://github.com/yourusername/acg-draft.git
   ```

   Replace `https://github.com/yourusername/acg-draft.git` with the actual repository URL.

2. **Navigate to the Project Directory**

   ```bash
   cd acg-draft
   ```

3. **Install Dependencies**

   Install the required npm packages by running:

   ```bash
   npm install
   ```

## Building the Project

To only build the project, run the following command:

```bash
npm run build
```

This will compile the TypeScript code and bundle the project using Webpack. The output will be placed in the `dist` directory.

### Building and Running the Game

You can build and run the game using the development server provided by Webpack. Execute the following command:

```bash
npm start
```

This command starts `webpack-dev-server` and serves the game at `http://localhost:3000/`.

### Accessing the Game

Open your web browser and navigate to:

```
http://localhost:3000/
```

The game should now load and run in your browser.

## Code References

The `Cloud.ts` and `Water.ts` in `Entities` are modified from the Three.js example [Cloud](https://threejs.org/examples/webgl_volume_cloud.html) and [Ocean](https://threejs.org/examples/webgl_shaders_ocean.html) and have been adapted to meet sence requirements. Shadow effects have been added, and optimizations have been made.

The `Mountain.ts` in `Entities` are modified from the Three.js example [Terrain](https://threejs.org/examples/webgl_geometry_terrain_raycast.html), but now only the noise generation is still in use.

The `Explosion.ts` is referenced from [threejs-games-course](https://github.com/NikLever/threejs-games-course/blob/master/complete/lecture5_6/Explosion.js).

The `NoiseShader.ts` is referenced from [CloudNoiseGen](https://github.com/Fewes/CloudNoiseGen) but it is unused.

Files in `assets/dcs` and `assets/LandTexturesSummer` is from the Digital Combat Simulator.
The plane model is from [threejs-games-course](https://github.com/NikLever/threejs-games-course).
The F22 model is from [Sketchfab](https://sketchfab.com/3d-models/lockheed-martin-f-22-raptor-204d1c74d6c44c049e167887943f1eb2).
The references of sounds is noted in `src/Configs/SoundPaths.ts`.

## Troubleshooting

- **Changing the Port Number**

  Find the `devServer` Configuration in `webpack.config.js` and edit the `port` value.

  ```javascript
  // webpack.config.js

  module.exports = {
    // ... existing configuration ...
    devServer: {
      static: {
        directory: path.join(__dirname, 'dist'),
      },
      compress: true,
      port: 3000, // Change this port number
    },
    // ... rest of your configuration ...
  }
  ```

  The port will change after restarting the deployment server.

- **Refused to Execute Script Due to MIME Type Error**

  If you encounter an error similar to:

  ```
  Refused to execute script from 'http://localhost:3000/dist/bundle.js' because its MIME type ('text/html') is not executable, and strict MIME type checking is enabled.
  ```

  Ensure that:

  - The `bundle.js` file exists in the `dist` directory.
  - The server is running and serving files from the correct directory.
  - The paths in `index.html` and `webpack.config.js` are correctly configured.

- **Cannot Use Import Statement Outside a Module**

  This error indicates that the browser is trying to execute untranspiled ES6 modules. Ensure you have built the project using `npm run build` and are serving it using `npm start`.

- **Port Already in Use**

  If you receive an error stating that the port is already in use, follow the steps in the `Changing the Port Number` section.

## License

This project is licensed under the MIT License.

---

Feel free to contribute to the project by submitting issues or pull requests. If you have any questions or need further assistance, please contact the project maintainers.

Happy gaming!
