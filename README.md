# Quar Studio – Quick UI for Mongoose Models

<p align="center">
    <img src="./assets/icon.png" alt="logo" width="200px"/>
</p>

Instantly spin up a web-based editor for your Mongoose models.
Built for developers who loves quick database interaction!

## Install & Run
```bash
npx quar --model <path-to-model-folder> --db <db-name>
```
This will load all Mongoose models from the folder and start a local web UI to Create, view, update, and delete documents.

## What it does
- Loads your Mongoose models dynamically
- Connects to your MongoDB database
- Gives a tabbed UI for each model
- View nested documents in a tree-style
- Supports Create, Read, update and delete

## Folder Structure
Your models folder can contain files like this:

```js
// ./models/Post.js
import mongoose from "mongoose"

const postSchema = new mongoose.Schema({
  title: String,
  body: String,
  author: {
    name: String,
    age: Number
  }
});

export default mongoose.model("Post", postSchema);
```

## Configuration

1. Install Quar as dev deps
    ```bash
    npm i quar --save-dev
    ```

2. Execute Command
    ```bash
    npx quar
    ```

3. Set Models Folder
    ```bash
    npx quar --model <folder-path>
    ```

4. Set Database Name
    ```bash
    npx quar --model <folder-path> --db <db-name>
    ```

5. Set Database URI `(Optional)`
    ```bash
    npx quar --model <folder-path> --db <db-name> --uri <db-uri>
    ```
    > ***Note:** By default it will try to connect local mongodb if uri not provided

## Usage Tips
- Supports nested schemas & subdocuments
- Clean tabbed navigation per model
- Auto-refreshes data after updates
- Keyboard shortcuts support

    | Command | Performs |
    |---------|----------|
    | <kbd>ctrl + o</kbd> | Toggles Insert Tab |
    | <kbd>ctrl + r</kbd> | Refresh Model |
    | <kbd>ctrl + ></kbd> | Go To Next Page |
    | <kbd>ctrl + <</kbd> | Go To Previous Page |



## Dev Notes

- Built for development use
- Doesn’t expose MONGO_URI publicly
- Uses Mongoose’s model.schema.tree for schema info
- Modular and extendable

## Contribute
Pull requests, suggestions, and ideas are welcome!

***Icon: <a href="https://www.flaticon.com/free-icons/thunder" title="thunder icons">Thunder icons created by Hexagon075 - Flaticon</a>***
