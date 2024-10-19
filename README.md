# Game Project README

Welcome to the **ACG-Draft Game** project! This guide will help you set up, build, and launch the game on your local machine.
By default, **main.ts** file use empty path to initialize a new game, which will create a debug scene.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Building the Project](#building-the-project)
- [Running the Game](#running-the-game)
- [Changing the Port Number](#changing-the-port-number)
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

## Building and Running the Game

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

## Changing the Port Number

If port `3000` is already in use on your machine, you can change the port number by modifying the `webpack.config.js` file.

1. **Open `webpack.config.js`**

   Located in the project root directory.

2. **Find the `devServer` Configuration**

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
   };
   ```

3. **Change the `port` Value**

   Replace `3000` with an available port number of your choice. For example, to use port `8080`:

   ```javascript
   port: 8080,
   ```

4. **Save the File**

5. **Restart the Development Server**

   After changing the port, restart the server:

   ```bash
   npm start
   ```

6. **Access the Game on the New Port**

   Navigate to:

   ```
   http://localhost:3000/
   ```

## Troubleshooting

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

  If you receive an error stating that the port is already in use, follow the steps in the [Changing the Port Number](#changing-the-port-number) section.

## License

This project is licensed under the [MIT License](LICENSE).

---

Feel free to contribute to the project by submitting issues or pull requests. If you have any questions or need further assistance, please contact the project maintainers.

Happy gaming!