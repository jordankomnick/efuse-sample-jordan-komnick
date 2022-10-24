import express from "express";
import bodyParser from 'body-parser'
import * as postsRoutes from './routes/posts.routes';

const port = 8080;

const app = express();

app.use(bodyParser.json())
postsRoutes.register(app);

// start the Express server
app.listen( port, () => {
    // tslint:disable-next-line:no-console
    console.log( `server started at http://localhost:${ port }` );
} );