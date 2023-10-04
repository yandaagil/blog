import jwt_decode from "jwt-decode";
import jwt from 'jsonwebtoken'
import { prismaClient } from "../src/prisma-client.js";
import fs from "fs";
import path from "path";


const createPost = async (req, res) => {
  const { authorId, title, content, published, category } = req.body;
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  const file = req.file.path.split("\\").slice(1).join("\\");
  try {
    const post = await prismaClient.post.create({
      data: {
        title: title,
        image: file,
        content: content,
        published: JSON.parse(published),
        category: category,
        author: {
          connect: { id: parseInt(authorId) },
        },
      },
      include: {
        author: {
          select: {
            name: true,
            username: true,
            email: true,
            photo_profile: true,
          },
        },
      },
    });
    if (post) post.image = `${baseUrl}/${post.image}`;
    res.status(201).json(post);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const getPosts = async (req, res) => {
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  try {
    const posts = await prismaClient.post.findMany({
      where: {
        published: true,
      },
      include: {
        author: {
          select: {
            name: true,
            username: true,
            email: true,
            photo_profile: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    if (posts) {
      posts.forEach((post) => {
        post.image = `${baseUrl}/${post.image}`;
        if(post.author.photo_profile !== null) post.author.photo_profile = `${baseUrl}/${post.author.photo_profile}`;
      });
    }

    res.status(200).json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getProfilePosts = async (req, res) => {
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  const authHeader = req.get('Authorization');
  const token = authHeader && authHeader.split(' ')[1];
  let authorId = parseInt(req.params.id);
  let posts;
  try {
    async function getPost() {
      posts = await prismaClient.post.findMany({
        where: { authorId: parseInt(req.params.id), published: true },
        include: {
          author: {
            select: {
              name: true,
              username: true,
              email: true,
              photo_profile: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
      if (posts) {
        posts.forEach((post) => {
          post.image = `${baseUrl}/${post.image}`;
          if(post.author.photo_profile !== null) post.author.photo_profile = `${baseUrl}/${post.author.photo_profile}`;
        });
      }

      res.status(200).json(posts);
    }
    async function getPostProfile() {
      posts = await prismaClient.post.findMany({
        where: { authorId: parseInt(req.params.id) },
        include: {
          author: {
            select: {
              name: true,
              username: true,
              email: true,
              photo_profile: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
      if (posts) {
        posts.forEach((post) => {
          post.image = `${baseUrl}/${post.image}`;
        });
      }

      res.status(200).json(posts);
    }
    if (token == null) getPost();
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
      if (err) {
        getPost();
      } else {
        const decoded = jwt_decode(token);
        if (decoded.userId != authorId) {
          getPost();
        } else {
          getPostProfile();
        }
      }
    })
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getPost = async (req, res) => {
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  try {
    const post = await prismaClient.post.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        author: {
          select: {
            name: true,
            username: true,
            email: true,
            photo_profile: true,
          },
        },
      },
    });
    post.image = `${baseUrl}/${post.image}`;
    if(post.author.photo_profile !== null) post.author.photo_profile = `${baseUrl}/${post.author.photo_profile}`;
    res.status(200).json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updatePost = async (req, res) => {
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  const { authorId, title, content, published, category } = req.body;
  const file = req.file?.path.split("\\").slice(1).join("\\");
  try {
    let updateData = { authorId, title, content, published, category };
    updateData.authorId = parseInt(authorId);
    updateData.published = JSON.parse(published);
    if (file) updateData.image = file;
    const [searchPost, post] = await prismaClient.$transaction(
      async (prisma) => {
        const searchPost = await prisma.post.findUnique({
          where: { id: parseInt(req.params.id) },
          select: {
            image: true,
          },
        });

        const post = await prisma.post.update({
          where: { id: parseInt(req.params.id) },
          data: updateData,
          include: {
            author: {
              select: {
                name: true,
                username: true,
                email: true,
                photo_profile: true,
              },
            },
          },
        });
        return [searchPost, post];
      }
    );
    const imagePath = path.join("public", searchPost.image);
    post.image = `${baseUrl}/${post.image}`;
    if (searchPost.image) {
      if (file && post) {
        fs.unlink(imagePath, (err) => {
          if (err) {
            return res
              .status(500)
              .json({ error: "An error occurred while deleting the file." });
          }
        });
      }
    }
    res.status(201).json(post);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const deletePost = async (req, res) => {
  try {
    const post = await prismaClient.post.delete({
      where: { id: parseInt(req.params.id) },
    });
    if (post) {
      const imagePath = path.join("public", post.image);
      fs.unlink(imagePath, (err) => {
        if (err) {
          return res
            .status(500)
            .json({ error: "An error occurred while deleting the file." });
        }

        res.json({ message: "Post deleted successfully." });
      });
    }
  } catch (err) {
    res.status().json({ message: err.message });
  }
};

export { createPost, getPosts, getProfilePosts, getPost, updatePost, deletePost}