import express, { Router } from 'express';
import { verifyWebhook, receiveMessage } from '../controllers/whatsAppController';

const router: Router = express.Router();

// Import controller
router.get('/webhooks', verifyWebhook);
router.post('/webhooks', receiveMessage);

export default router;
