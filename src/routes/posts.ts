import * as express from "express";
import {Document, MongoClient, ObjectId, WithId} from "mongodb";

const uri = "mongodb://localhost:27017";

export const register = (app: express.Application) => {
    app.get('/', async (req, res) => {
        const result: WithId<Document>[] = [];
        let errorMessage;

        const client = new MongoClient(uri);
        try {
            await client.connect();
            const db = client.db("local");
            const postsCollection = db.collection("posts");
            const cursor = await postsCollection.find();
            await cursor.forEach((doc) => {
                result.push(doc);
            })
        } catch(e) {
            errorMessage = e.message;
        } finally {
            await client.close();
        }

        if(errorMessage) {
            res.status(500).send({message: errorMessage});
        } else {
            res.status(200).send(result);
        }
    })

    app.get('/:id', async (req, res) => {
        const{id} = req.params;

        let result;
        let errorMessage;

        const client = new MongoClient(uri);
        try {
            await client.connect();
            const db = client.db("local");
            const postsCollection = db.collection("posts");
            result = await postsCollection.findOne({'_id': new ObjectId(id)});
        } catch(e) {
            errorMessage = e.message;
        } finally {
            await client.close();
        }

        if(errorMessage) {
            res.status(500).send({message: errorMessage});
        }

        if(result) {
            res.status(200).send(result);
        } else {
            res.status(404).send({message: `No post found with id ${id}`});
        }

    })

    app.post('/', async (req, res) => {
        const {content, user_id} = req.body;
        const postData = {
            content,
            created_time: new Date(),
            updated_time: new Date(),
            user_id
        }

        let result;
        let errorMessage;

        const client = new MongoClient(uri);
        try {
            await client.connect();
            const db = client.db("local");
            const postsCollection = db.collection("posts");
            result = await postsCollection.insertOne(postData);
        } catch(e) {
            errorMessage = e.message;
        } finally {
            await client.close();
        }

        if(result) {
            res.status(201).send({id: result.insertedId});
        } else {
            res.status(500).send({message: errorMessage});
        }
    })
};