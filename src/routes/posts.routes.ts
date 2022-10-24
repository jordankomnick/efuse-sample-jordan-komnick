import * as express from "express";
import {PostsRepository} from "../repositories/posts.repository";

const router = express.Router()

router.get('/', async (req, res) => {
    try {
        const postsRepo = new PostsRepository();
        const result = await postsRepo.getAllPosts();
        res.status(200).send(result);
    } catch (e) {
        res.status(500).send({message: e.message});
    }
})

router.get('/:id', async (req, res) => {
    const {id} = req.params;

    try {
        const postsRepo = new PostsRepository();
        const result = await postsRepo.getPost(id);

        if (result) {
            res.status(200).send(result);
        } else {
            res.status(404).send({message: `No post found with id ${id}`});
        }
    } catch (e) {
        res.status(500).send({message: e.message});
    }
})

router.post('/', async (req, res) => {
    const {content, user_id} = req.body;

    try {
        const postsRepo = new PostsRepository();
        const insertedId = await postsRepo.createPost({content, user_id});
        res.status(201).send({id: insertedId});
    } catch (e) {
        res.status(500).send({message: e.message});
    }
})

router.put('/:id', async (req, res) => {
    const {id} = req.params;
    const {content, user_id} = req.body;

    try {
        const postsRepo = new PostsRepository();
        const foundPost = await postsRepo.getPost(id);
        if (!foundPost) {
            res.status(404).send({message: `No post found with id ${id}`});
            return;
        }

        await postsRepo.updatePost(id, {content, user_id});

        const updatedPost = await postsRepo.getPost(id);

        res.status(200).send(updatedPost);
    } catch (e) {
        res.status(500).send({message: e.message});
    }
})

router.delete('/:id', async (req, res) => {
    const {id} = req.params;

    try {
        const postsRepo = new PostsRepository();
        const toBeDeleted = await postsRepo.getPost(id);
        if (!toBeDeleted) {
            res.status(404).send({message: `No post found with id ${id}`});
            return;
        }

        await postsRepo.deletePost(id);

        res.status(200).send(toBeDeleted);
    } catch (e) {
        res.status(500).send({message: e.message});
    }
})

export default router;