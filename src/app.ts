import express from "express";
import bodyParser from 'body-parser'
import postsRoutes from './routes/posts.routes';

const app = express();

app.use(bodyParser.json())
app.use('/posts', postsRoutes);

export default app;