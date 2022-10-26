import * as express from "express";
import {PostsRepository} from "../repositories/posts.repository";
import {createClient} from "redis";

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
        let result;

        const redisClient = createClient();
        await redisClient.connect();

        const cacheResults = await redisClient.get(id);

        if (cacheResults) {
            result = JSON.parse(cacheResults);
        } else {
            const postsRepo = new PostsRepository();
            result = await postsRepo.getPost(id);
        }

        if (result) {
            await redisClient.set(id, JSON.stringify(result), {
                EX: 180,
                NX: true
            });
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

        const redisClient = createClient();
        await redisClient.connect();

        const updatedPost = await postsRepo.getPost(id);

        await redisClient.set(id, JSON.stringify(updatedPost), {
            EX: 180,
            XX: true
        });

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

        const redisClient = createClient();
        await redisClient.connect();
        await redisClient.del(id);

        res.status(200).send(toBeDeleted);
    } catch (e) {
        res.status(500).send({message: e.message});
    }
})

router.post('/:id/comments', async (req, res) => {
    const {id} = req.params;
    const {content, user_id} = req.body;

    try {
        const postsRepo = new PostsRepository();
        const foundPost = await postsRepo.getPost(id);
        if (!foundPost) {
            res.status(404).send({message: `No post found with id ${id}`});
            return;
        }

        const insertedId = await postsRepo.createComment(id, {content, user_id});
        res.status(201).send({id: insertedId});
    } catch (e) {
        res.status(500).send({message: e.message});
    }
})

router.get('/:postId/comments/:commentId', async (req, res) => {
    const {postId, commentId} = req.params;

    try {
        let result;
        const redisClient = createClient();
        await redisClient.connect();

        const cacheResults = await redisClient.get(commentId);

        if (cacheResults) {
            result = JSON.parse(cacheResults);
        } else {

            const postsRepo = new PostsRepository();
            const post = await postsRepo.getPost(postId);
            if (!post) {
                res.status(404).send({message: `No post found with id ${postId}`});
                return;
            }

            result = await postsRepo.getComment(postId, commentId);
            await redisClient.set(commentId, JSON.stringify(result), {
                EX: 180,
                NX: true
            });
        }

        if (result) {
            res.status(200).send(result);
        } else {
            res.status(404).send({message: `No comment found with id ${commentId}`});
        }
    } catch (e) {
        res.status(500).send({message: e.message});
    }
})

router.get('/:id/comments', async (req, res) => {
    const {id} = req.params;

    try {
        const postsRepo = new PostsRepository();
        const result = await postsRepo.getPost(id);

        if (result) {
            res.status(200).send(result.comments);
        } else {
            res.status(404).send({message: `No post found with id ${id}`});
        }
    } catch (e) {
        res.status(500).send({message: e.message});
    }
})

router.put('/:postId/comments/:commentId', async (req, res) => {
    const {postId, commentId} = req.params;
    const {content, user_id} = req.body;

    try {
        const postsRepo = new PostsRepository();
        const foundPost = await postsRepo.getPost(postId);
        if (!foundPost) {
            res.status(404).send({message: `No post found with id ${postId}`});
            return;
        }

        const foundComment = await postsRepo.getComment(postId, commentId);
        if (!foundComment) {
            res.status(404).send({message: `No comment found with id ${commentId}`});
            return;
        }

        await postsRepo.updateComment(postId, commentId, {content, user_id});

        const redisClient = createClient();
        await redisClient.connect();

        const updatedComment = await postsRepo.getComment(postId, commentId);

        await redisClient.set(commentId, JSON.stringify(updatedComment), {
            EX: 180,
            XX: true
        });

        res.status(200).send(updatedComment);
    } catch (e) {
        res.status(500).send({message: e.message});
    }
})

router.delete('/:postId/comments/:commentId', async (req, res) => {
    const {postId, commentId} = req.params;

    try {
        const postsRepo = new PostsRepository();

        const foundPost = await postsRepo.getPost(postId);
        if (!foundPost) {
            res.status(404).send({message: `No post found with id ${postId}`});
            return;
        }

        const commentToBeDeleted = await postsRepo.getComment(postId, commentId);
        if (!commentToBeDeleted) {
            res.status(404).send({message: `No comment found with id ${commentId}`});
            return;
        }

        await postsRepo.deleteComment(postId, commentId);

        res.status(200).send(commentToBeDeleted);
    } catch (e) {
        res.status(500).send({message: e.message});
    }
})

export default router;