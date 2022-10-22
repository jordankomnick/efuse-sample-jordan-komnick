import express from "express";
import bodyParser from 'body-parser'
 // default port to listen
import {MongoClient} from "mongodb";

const app = express();
const port = 8080;

app.use(bodyParser.json())

// define a route handler for the default home page
app.get( "/", (req, res ) => {
    res.send( "Hello world!" );
} );

app.post('/', async (req, res) => {
    const {content, user_id} = req.body;
    const postData = {
        content,
        created_time: new Date(),
        updated_time: new Date(),
        user_id
    }

    let result;

    const uri = "mongodb://localhost:27017";
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db("local");
        const postsCollection = db.collection("posts");
        result = await postsCollection.insertOne(postData);
    } finally {
        await client.close();
    }

    if(result) {
        res.send(result.insertedId);
    } else {
        res.send('Error!');
    }
})

// start the Express server
app.listen( port, () => {
    // tslint:disable-next-line:no-console
    console.log( `server started at http://localhost:${ port }` );
} );