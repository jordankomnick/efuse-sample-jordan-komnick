import * as express from "express";
import {MongoClient} from "mongodb";

export const register = ( app: express.Application ) => {
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

        const uri = "mongodb://localhost:27017";
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