import express from 'express';
import mongoose from 'mongoose';
import path from "path"
import loadModels from './utils/loadModels.js';

const app = express();
const PORT = 8319;

app.set('view engine', 'zare');
app.set("views", path.join(import.meta.dirname, "views"));
app.set("port", PORT);

app.use(express.static(path.join(import.meta.dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', async (_, res) => {
    try {
        const modelNames = mongoose.modelNames();

        modelNames.sort((a, b) => a.localeCompare(b));

        const result = await Promise.all(
            modelNames.map(async name => {
                const model = mongoose.model(name);
                const count = await model.countDocuments();
                return { name, count };
            })
        );

        res.render('pages/index', { models: result });
    } catch (error) {
        res.status(500).json({ error: error.message || "Internal server error" });
    }
});

app.get("/models", async (_, res) => {

    try {

        if (!app.locals.modelPath) return res.status(409).json({ error: "model directory path not set" })
        loadModels(app.locals.modelPath)
        const modelNames = mongoose.modelNames();
        modelNames.sort((a, b) => a.localeCompare(b));
    
        const result = await Promise.all(
            modelNames.map(async name => {
                const model = mongoose.model(name);
                const count = await model.countDocuments();
                return { name, count };
            })
        );
    
        res.status(200).json({ models: result });
    } catch (error) {
        res.status(500).json({ error: error.message || "Internal server error" });
    }
});

app.get("/models/:modelName", async (req, res) => {
    try {

        const { modelName } = req.params;
        const { page = 1, limit = 100 } = req.query;
        const model = mongoose.model(modelName);
        const modelSchema = model.schema.paths;
        const documents = await model.find({}).limit(limit).skip((page - 1) * limit);
        const totalCount = await model.countDocuments();
        const count = documents.length;
        const totalPages = Math.ceil(totalCount / limit);

        res.status(200).json({ documents, schema: modelSchema, totalCount, count, totalPages });
    } catch (error) {
        res.status(500).json({ error: error.message || "Internal server error" });
    }
});

app.get("/schema/:modelName", async (req, res) => {
    try {
        const modelName = req.params.modelName;
        const Model = mongoose.model(modelName);

        if (!Model) return res.status(404).json({ error: 'Model not found' });

        const paths = Model.schema.paths;
        const schema = {};

        function getSchema(paths) {
            for (const path in paths) {

                if (path === '_id' || path === '__v') continue;

                if (paths[path].instance === 'Embedded') {
                    getSchema(paths[path].schema.paths);
                    continue;
                };

                const field = paths[path];
                const fieldType = field.instance;
                const fieldOptions = Object.assign({}, field.options);

                delete fieldOptions["type"];

                schema[path] = {
                    type: fieldType,
                    ...fieldOptions
                }
            }
        }
        getSchema(paths)

        res.status(200).json(schema);
    } catch (error) {
        res.status(500).json({ error: error.message || "Intenral Server Error" })
    }
});

app.get("/id/:modelName", async (req, res) => {

    try {
        const { modelName } = req.params;
        const Model = mongoose.model(modelName)
        if (!Model) return res.status(404).json({ error: "model not found" });

        const docs = await Model.find({});
        const ids = [];

        docs.map(doc => ids.push(doc._id))

        res.status(200).json(ids)
    } catch (error) {
        res.status(500).json({ error: error.message || "Internal server error" })
    }
})

app.post("/insert/:modelName", async (req, res) => {

    try {
        const { modelName } = req.params;
        const body = req.body;
    
        const Model = mongoose.model(modelName);
    
        if (!Model) return res.status(404).json({ error: "model not found" });
    
        const paths = Model.schema.paths;
    
        function getSchema(paths) {
    
            let schema = {};
            for (const path in paths) {
    
                if (path === '_id' || path === '__v') continue;
    
                if (paths[path].instance === 'Embedded') {
                    schema[path] = getSchema(paths[path].schema.paths);
                    continue;
                };
    
                schema[path] = paths[path].instance;
            }
    
            return schema;
        }
    
        const schema = getSchema(paths)
    
        function getData(body, schema) {
    
            let data = {};
            
            for (const key in schema) {
                if (typeof schema[key] === 'object' && schema[key] !== null) {
                    
                    data[key] = getData(body, schema[key]);
                    continue;
                }
    
                if (Object.keys(body).includes(key)) {
                    data[key] = body[key];
                }
            }
    
            return data;
        }
    
        const data = getData(body, schema)
        
        const result = await Model.create(data)
    
        res.status(200).json(result)
    } catch (error) {
        res.status(500).json({ error: error.message || "Internal server error" })
    }
})

app.put("/update/:modelName/:id", async (req, res) => {
    try {
        const { modelName, id } = req.params;
        const model = mongoose.model(modelName);
        const updatedDoc = req.body;
        
        delete updatedDoc._id;
        const result = await model.findByIdAndUpdate(id, updatedDoc, { new: true });

        res.status(200).json(result);
    } catch (error) {

        res.status(500).json({ error: error.message || "Internal server error" });
    }
});

app.delete("/delete/:modelName/:id", async (req, res) => {
    try {
        const { modelName, id } = req.params;
        const model = mongoose.model(modelName);

        await model.findByIdAndDelete(id);
        const count = await model.countDocuments();

        res.status(200).json({ count });
    } catch (error) {
        res.status(500).json({ error: error.message || "Internal server error" });
    }
});

app.delete("/delete-all/:modelName", async (req, res) => {
    try {
        const { modelName } = req.params;
        const model = mongoose.model(modelName);
        if (!model) return res.status(404).json({ error: "model not found" });

        await model.deleteMany({});

        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message || "Internal server error" });
    }
})

export default app;