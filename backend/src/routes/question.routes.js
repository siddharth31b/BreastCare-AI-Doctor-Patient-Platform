const express = require('express');
const router = express.Router();
const repo = require('../db/repository');

/**
 * GET /api/questions
 * Get all clinical screening questions (optionally filter by ?phase=0,1,2,3)
 */
router.get('/', async (req, res, next) => {
  try {
    const { phase } = req.query;
    let questions;
    if (phase !== undefined && phase !== '') {
      questions = await repo.getQuestionsByPhase(parseInt(phase, 10));
    } else {
      questions = await repo.getAllQuestions();
    }

    res.status(200).json({
      success: true,
      count: questions.length,
      questions
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/questions/:id
 * Get single question
 */
router.get('/:id', async (req, res, next) => {
  try {
    const question = await repo.getQuestionById(req.params.id);
    if (!question) {
      return res.status(404).json({ error: { message: 'Question not found', status: 404 } });
    }
    res.status(200).json({ success: true, question });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
